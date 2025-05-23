from flask import Blueprint, request, jsonify, g, abort, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from ..utils.db import get_db
from ..utils.helpers import (
    validate_email, send_email, owner_required, 
    sanitize_text, validate_positive_number, validate_int
)
import datetime, re, logging
from werkzeug.security import check_password_hash, generate_password_hash

logger = logging.getLogger(__name__)
bp = Blueprint('api', __name__)

# --- Rate Limiting (nur für Login) ---
@bp.before_app_request
def limit_login_attempts():
    if request.endpoint == 'login':
        ip = request.remote_addr
        current_time = datetime.datetime.now()
        if not hasattr(current_app, 'login_attempts'):
            current_app.login_attempts = {}
        # Entferne alte Einträge (> 15 min)
        for stored_ip in list(current_app.login_attempts.keys()):
            attempts = current_app.login_attempts[stored_ip]
            if (current_time - attempts['timestamp']).total_seconds() > 900:
                del current_app.login_attempts[stored_ip]
        if ip in current_app.login_attempts:
            attempts = current_app.login_attempts[ip]
            if attempts['count'] >= 5 and (current_time - attempts['timestamp']).total_seconds() < 900:
                abort(429)
            attempts['count'] += 1
            attempts['timestamp'] = current_time
        else:
            current_app.login_attempts[ip] = {'count': 1, 'timestamp': current_time}

@bp.errorhandler(429)
def too_many_requests(error):
    return jsonify({
        "message": "Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut."
    }), 429

# --- Auth ---

@bp.route('/api/auth/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    username = sanitize_text(request.json.get('username', ''), 64, False)
    password = request.json.get('password', None)
    if not username or not password:
        return jsonify({"message": "Benutzername und Passwort sind erforderlich"}), 400
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    if user and check_password_hash(user['password_hash'], password):
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    return jsonify({"message": "Falsche Anmeldedaten"}), 401

@bp.route('/api/auth/change-password', methods=['PUT'])
@jwt_required()
@owner_required
def change_password():
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    current_password = request.json.get('current_password', None)
    new_password = request.json.get('new_password', None)
    if not current_password or not new_password:
        return jsonify({"message": "Aktuelles und neues Passwort sind erforderlich"}), 400
    if len(new_password) < 8:
        return jsonify({"message": "Das neue Passwort muss mindestens 8 Zeichen lang sein"}), 400
    username = get_jwt_identity()
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    if not check_password_hash(user['password_hash'], current_password):
        return jsonify({"message": "Aktuelles Passwort ist falsch"}), 401
    password_hash = generate_password_hash(new_password)
    db.execute('UPDATE users SET password_hash = ? WHERE username = ?', (password_hash, username))
    db.commit()
    return jsonify({"message": "Passwort erfolgreich geändert"}), 200

# --- Artikelverwaltung ---

@bp.route('/api/articles', methods=['GET'])
def get_articles():
    db = get_db()
    articles = db.execute('SELECT * FROM articles').fetchall()
    result = []
    for article in articles:
        result.append({
            'id': article['id'],
            'name': article['name'],
            'description': article['description'],
            'price_per_day': float(article['price_per_day']),
            'image_url': article['image_url'],
            'is_available': bool(article['is_available']),
            'quantity_available': article['quantity_available'],
            'created_at': article['created_at'],
            'updated_at': article['updated_at']
        })
    return jsonify(result), 200

@bp.route('/api/articles/<int:article_id>', methods=['GET'])
def get_article(article_id):
    db = get_db()
    article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
    if not article:
        return jsonify({"message": "Artikel nicht gefunden"}), 404
    result = {
        'id': article['id'],
        'name': article['name'],
        'description': article['description'],
        'price_per_day': float(article['price_per_day']),
        'image_url': article['image_url'],
        'is_available': bool(article['is_available']),
        'quantity_available': article['quantity_available'],
        'created_at': article['created_at'],
        'updated_at': article['updated_at']
    }
    return jsonify(result), 200

@bp.route('/api/articles', methods=['POST'])
@jwt_required()
@owner_required
def create_article():
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    name = sanitize_text(request.json.get('name'), 120)
    description = sanitize_text(request.json.get('description', ''), 500)
    price_per_day = request.json.get('price_per_day')
    image_url = sanitize_text(request.json.get('image_url', ''), 300)
    is_available = bool(request.json.get('is_available', True))
    quantity_available = request.json.get('quantity_available', 1)
    if not name:
        return jsonify({"message": "Name darf nicht leer sein"}), 400
    if not validate_positive_number(price_per_day):
        return jsonify({"message": "Preis muss eine positive Zahl sein"}), 400
    if not validate_int(quantity_available, 0):
        return jsonify({"message": "Verfügbare Menge muss eine nicht-negative Ganzzahl sein"}), 400
    db = get_db()
    cursor = db.execute(
        '''INSERT INTO articles 
           (name, description, price_per_day, image_url, is_available, quantity_available) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        (name, description, float(price_per_day), image_url, int(is_available), int(quantity_available))
    )
    db.commit()
    new_article_id = cursor.lastrowid
    article = db.execute('SELECT * FROM articles WHERE id = ?', (new_article_id,)).fetchone()
    result = {
        'id': article['id'],
        'name': article['name'],
        'description': article['description'],
        'price_per_day': float(article['price_per_day']),
        'image_url': article['image_url'],
        'is_available': bool(article['is_available']),
        'quantity_available': article['quantity_available'],
        'created_at': article['created_at'],
        'updated_at': article['updated_at']
    }
    return jsonify(result), 201

@bp.route('/api/articles/<int:article_id>', methods=['PUT'])
@jwt_required()
@owner_required
def update_article(article_id):
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    db = get_db()
    article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
    if not article:
        return jsonify({"message": "Artikel nicht gefunden"}), 404
    name = sanitize_text(request.json.get('name', article['name']), 120)
    description = sanitize_text(request.json.get('description', article['description']), 500)
    price_per_day = request.json.get('price_per_day', article['price_per_day'])
    image_url = sanitize_text(request.json.get('image_url', article['image_url']), 300)
    is_available = bool(request.json.get('is_available', article['is_available']))
    quantity_available = request.json.get('quantity_available', article['quantity_available'])
    if not name:
        return jsonify({"message": "Name darf nicht leer sein"}), 400
    if not validate_positive_number(price_per_day):
        return jsonify({"message": "Preis muss eine positive Zahl sein"}), 400
    if not validate_int(quantity_available, 0):
        return jsonify({"message": "Verfügbare Menge muss eine nicht-negative Ganzzahl sein"}), 400
    db.execute(
        '''UPDATE articles 
           SET name = ?, description = ?, price_per_day = ?, 
               image_url = ?, is_available = ?, quantity_available = ?
           WHERE id = ?''',
        (name, description, float(price_per_day), image_url, int(is_available), int(quantity_available), article_id)
    )
    db.commit()
    updated_article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
    result = {
        'id': updated_article['id'],
        'name': updated_article['name'],
        'description': updated_article['description'],
        'price_per_day': float(updated_article['price_per_day']),
        'image_url': updated_article['image_url'],
        'is_available': bool(updated_article['is_available']),
        'quantity_available': updated_article['quantity_available'],
        'created_at': updated_article['created_at'],
        'updated_at': updated_article['updated_at']
    }
    return jsonify(result), 200

@bp.route('/api/articles/<int:article_id>', methods=['DELETE'])
@jwt_required()
@owner_required
def delete_article(article_id):
    db = get_db()
    article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
    if not article:
        return jsonify({"message": "Artikel nicht gefunden"}), 404
    rental_items = db.execute(
        '''SELECT ri.* FROM rental_request_items ri
           JOIN rental_requests rr ON ri.request_id = rr.id
           WHERE ri.article_id = ? AND rr.status IN ('new', 'contacted')''',
        (article_id,)
    ).fetchall()
    if rental_items:
        return jsonify({
            "message": "Dieser Artikel kann nicht gelöscht werden, da er in aktiven Mietanfragen verwendet wird"
        }), 400
    db.execute('DELETE FROM articles WHERE id = ?', (article_id,))
    db.commit()
    return jsonify({"message": "Artikel erfolgreich gelöscht"}), 200

# --- Health Check ---
@bp.route("/healthz")
def healthz():
    return "OK", 200

# --- Mietanfragen ---

@bp.route('/api/rentals/request', methods=['POST'])
def create_rental_request():
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    required_fields = ['customer_name', 'customer_email', 'start_date', 'end_date', 'items']
    for field in required_fields:
        if field not in request.json:
            return jsonify({"message": f"Feld {field} ist erforderlich"}), 400
    customer_name = sanitize_text(request.json.get('customer_name'), 120)
    customer_email = sanitize_text(request.json.get('customer_email'), 254, False)
    customer_phone = sanitize_text(request.json.get('customer_phone', ''), 30)
    start_date = request.json.get('start_date')
    end_date = request.json.get('end_date')
    message = sanitize_text(request.json.get('message', ''), 800)
    items = request.json.get('items', [])
    if not customer_name:
        return jsonify({"message": "Name darf nicht leer sein"}), 400
    if not validate_email(customer_email):
        return jsonify({"message": "Ungültige E-Mail-Adresse"}), 400
    try:
        start_date_obj = datetime.date.fromisoformat(start_date)
        end_date_obj = datetime.date.fromisoformat(end_date)
        if start_date_obj < datetime.date.today():
            return jsonify({"message": "Startdatum kann nicht in der Vergangenheit liegen"}), 400
        if end_date_obj < start_date_obj:
            return jsonify({"message": "Enddatum muss nach dem Startdatum liegen"}), 400
    except ValueError:
        return jsonify({"message": "Ungültiges Datumsformat. Bitte YYYY-MM-DD verwenden"}), 400
    if not items or not isinstance(items, list) or len(items) == 0:
        return jsonify({"message": "Mindestens ein Artikel muss ausgewählt werden"}), 400
    db = get_db()
    for item in items:
        if 'article_id' not in item or 'quantity' not in item:
            return jsonify({"message": "Jeder Artikel muss eine ID und eine Menge haben"}), 400
        article_id = item['article_id']
        quantity = item['quantity']
        if not validate_int(quantity, 1):
            return jsonify({"message": "Menge muss eine positive Ganzzahl sein"}), 400
        article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
        if not article:
            return jsonify({"message": f"Artikel mit ID {article_id} nicht gefunden"}), 404
        if not article['is_available']:
            return jsonify({"message": f"Artikel '{article['name']}' ist nicht verfügbar"}), 400
        if article['quantity_available'] < quantity:
            return jsonify({
                "message": f"Nur {article['quantity_available']} Einheiten von '{article['name']}' verfügbar"
            }), 400
    try:
        cursor = db.execute(
            '''INSERT INTO rental_requests 
               (customer_name, customer_email, customer_phone, start_date, end_date, message, status) 
               VALUES (?, ?, ?, ?, ?, ?, 'new')''',
            (customer_name, customer_email, customer_phone, start_date, end_date, message)
        )
        request_id = cursor.lastrowid
        for item in items:
            article_id = item['article_id']
            quantity = item['quantity']
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, article_id, quantity)
            )
        db.commit()
        # E-Mail an Owner:
        rental_request = db.execute(
            'SELECT * FROM rental_requests WHERE id = ?', (request_id,)
        ).fetchone()
        requested_articles = []
        for item in items:
            article = db.execute(
                'SELECT * FROM articles WHERE id = ?', (item['article_id'],)
            ).fetchone()
            requested_articles.append({
                'name': article['name'],
                'quantity': item['quantity'],
                'price_per_day': float(article['price_per_day'])
            })
        rental_days = (end_date_obj - start_date_obj).days + 1
        total_price = sum(
            item['price_per_day'] * item['quantity'] * rental_days 
            for item in requested_articles
        )
        email_subject = f"Neue Mietanfrage von {customer_name}"
        email_html = f"""<html>
        <head></head>
        <body>
            <h2>Neue Mietanfrage eingegangen</h2>
            <p><strong>Kunde:</strong> {customer_name}</p>
            <p><strong>E-Mail:</strong> {customer_email}</p>
            <p><strong>Telefon:</strong> {customer_phone or 'Nicht angegeben'}</p>
            <p><strong>Zeitraum:</strong> {start_date} bis {end_date} ({rental_days} Tage)</p>
            <p><strong>Nachricht:</strong> {message or 'Keine Nachricht'}</p>
            <h3>Angefragte Artikel:</h3>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>Artikel</th>
                    <th>Menge</th>
                    <th>Preis pro Tag</th>
                    <th>Gesamtpreis</th>
                </tr>"""
        for article in requested_articles:
            article_total = article['price_per_day'] * article['quantity'] * rental_days
            email_html += f"""
                <tr>
                    <td>{article['name']}</td>
                    <td>{article['quantity']}</td>
                    <td>{article['price_per_day']:.2f} €</td>
                    <td>{article_total:.2f} €</td>
                </tr>
            """
        email_html += f"""
                <tr>
                    <td colspan="3"><strong>Gesamtpreis</strong></td>
                    <td><strong>{total_price:.2f} €</strong></td>
                </tr>
            </table>
            <p>Bitte logge dich in dein System ein, um die Anfrage zu bearbeiten.</p>
        </body>
        </html>
        """
        email_text = f"""
        Neue Mietanfrage eingegangen

        Kunde: {customer_name}
        E-Mail: {customer_email}
        Telefon: {customer_phone or 'Nicht angegeben'}
        Zeitraum: {start_date} bis {end_date} ({rental_days} Tage)
        Nachricht: {message or 'Keine Nachricht'}

        Angefragte Artikel:
        """
        for article in requested_articles:
            article_total = article['price_per_day'] * article['quantity'] * rental_days
            email_text += f"""
        - {article['name']} (Menge: {article['quantity']})
          Preis pro Tag: {article['price_per_day']:.2f} €
          Gesamtpreis: {article_total:.2f} €
            """
        email_text += f"""
        Gesamtpreis: {total_price:.2f} €
        Bitte logge dich in dein System ein, um die Anfrage zu bearbeiten.
        """
        send_email(
            recipient=current_app.config['OWNER_EMAIL'],
            subject=email_subject,
            body_html=email_html,
            body_text=email_text
        )
        return jsonify({
            "message": "Mietanfrage erfolgreich erstellt. Der Besitzer wird sich mit dir in Verbindung setzen.",
            "request_id": request_id
        }), 201
    except Exception as e:
        db.rollback()
        logger.error(f"Fehler beim Erstellen der Mietanfrage: {str(e)}")
        return jsonify({"message": "Ein Fehler ist aufgetreten. Bitte versuche es später erneut."}), 500

@bp.route('/api/rentals', methods=['GET'])
@jwt_required()
@owner_required
def get_rental_requests():
    status_filter = request.args.get('status', None)
    db = get_db()
    if status_filter:
        rental_requests = db.execute(
            'SELECT * FROM rental_requests WHERE status = ? ORDER BY request_date DESC',
            (status_filter,)
        ).fetchall()
    else:
        rental_requests = db.execute(
            'SELECT * FROM rental_requests ORDER BY request_date DESC'
        ).fetchall()
    result = []
    for req in rental_requests:
        items = db.execute(
            '''SELECT ri.*, a.name, a.price_per_day 
               FROM rental_request_items ri
               JOIN articles a ON ri.article_id = a.id
               WHERE ri.request_id = ?''',
            (req['id'],)
        ).fetchall()
        request_items = []
        for item in items:
            request_items.append({
                'article_id': item['article_id'],
                'name': item['name'],
                'quantity': item['quantity'],
                'price_per_day': float(item['price_per_day'])
            })
        def to_pydate(val):
            if isinstance(val, datetime.date):
                return val
            if isinstance(val, str):
                return datetime.date.fromisoformat(val)
            raise ValueError("Invalid date format")
        try:
            start_date = to_pydate(req['start_date'])
            end_date = to_pydate(req['end_date'])
            rental_days = (end_date - start_date).days + 1
        except Exception as e:
            logger.error(f"Fehler bei der Datumsumwandlung: {e}")
            start_date = None
            end_date = None
            rental_days = 0
        total_price = sum(
            item['price_per_day'] * item['quantity'] * rental_days 
            for item in request_items
        )
        result.append({
            'id': req['id'],
            'customer_name': req['customer_name'],
            'customer_email': req['customer_email'],
            'customer_phone': req['customer_phone'],
            'start_date': req['start_date'],
            'end_date': req['end_date'],
            'message': req['message'],
            'request_date': req['request_date'],
            'status': req['status'],
            'items': request_items,
            'rental_days': rental_days,
            'total_price': total_price
        })
    return jsonify(result), 200

@bp.route('/api/rentals/<int:request_id>', methods=['GET'])
@jwt_required()
@owner_required
def get_rental_request(request_id):
    db = get_db()
    rental_request = db.execute(
        'SELECT * FROM rental_requests WHERE id = ?', (request_id,)
    ).fetchone()
    if not rental_request:
        return jsonify({"message": "Mietanfrage nicht gefunden"}), 404
    items = db.execute(
        '''SELECT ri.*, a.name, a.price_per_day 
           FROM rental_request_items ri
           JOIN articles a ON ri.article_id = a.id
           WHERE ri.request_id = ?''',
        (request_id,)
    ).fetchall()
    request_items = []
    for item in items:
        request_items.append({
            'article_id': item['article_id'],
            'name': item['name'],
            'quantity': item['quantity'],
            'price_per_day': float(item['price_per_day'])
        })
    start_date = datetime.date.fromisoformat(rental_request['start_date'])
    end_date = datetime.date.fromisoformat(rental_request['end_date'])
    rental_days = (end_date - start_date).days + 1
    total_price = sum(
        item['price_per_day'] * item['quantity'] * rental_days 
        for item in request_items
    )
    result = {
        'id': rental_request['id'],
        'customer_name': rental_request['customer_name'],
        'customer_email': rental_request['customer_email'],
        'customer_phone': rental_request['customer_phone'],
        'start_date': rental_request['start_date'],
        'end_date': rental_request['end_date'],
        'message': rental_request['message'],
        'request_date': rental_request['request_date'],
        'status': rental_request['status'],
        'items': request_items,
        'rental_days': rental_days,
        'total_price': total_price
    }
    return jsonify(result), 200

@bp.route('/api/rentals/<int:request_id>/status', methods=['PUT'])
@jwt_required()
@owner_required
def update_rental_status(request_id):
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    new_status = request.json.get('status', None)
    allowed_statuses = ['new', 'contacted', 'fulfilled', 'cancelled']
    if not new_status or new_status not in allowed_statuses:
        return jsonify({
            "message": f"Status muss einer der folgenden sein: {', '.join(allowed_statuses)}"
        }), 400
    db = get_db()
    rental_request = db.execute(
        'SELECT * FROM rental_requests WHERE id = ?', (request_id,)
    ).fetchone()
    if not rental_request:
        return jsonify({"message": "Mietanfrage nicht gefunden"}), 404
    db.execute(
        'UPDATE rental_requests SET status = ? WHERE id = ?',
        (new_status, request_id)
    )
    db.commit()
    return jsonify({"message": "Status erfolgreich aktualisiert"}), 200

# --- Systemstatistiken (für Dashboard) ---

@bp.route('/api/stats', methods=['GET'])
@jwt_required()
@owner_required
def get_system_stats():
    db = get_db()
    total_articles = db.execute('SELECT COUNT(*) as count FROM articles').fetchone()['count']
    available_articles = db.execute(
        'SELECT COUNT(*) as count FROM articles WHERE is_available = 1 AND quantity_available > 0'
    ).fetchone()['count']
    open_requests = db.execute(
        'SELECT COUNT(*) as count FROM rental_requests WHERE status IN ("new", "contacted")'
    ).fetchone()['count']
    completed_requests = db.execute(
        'SELECT COUNT(*) as count FROM rental_requests WHERE status = "fulfilled"'
    ).fetchone()['count']
    cancelled_requests = db.execute(
        'SELECT COUNT(*) as count FROM rental_requests WHERE status = "cancelled"'
    ).fetchone()['count']
    recent_activities = db.execute(
        '''SELECT id, customer_name, status, request_date 
           FROM rental_requests 
           ORDER BY request_date DESC LIMIT 5'''
    ).fetchall()
    activities = []
    for activity in recent_activities:
        activities.append({
            'id': activity['id'],
            'customer_name': activity['customer_name'],
            'status': activity['status'],
            'request_date': activity['request_date']
        })
    return jsonify({
        'total_articles': total_articles,
        'available_articles': available_articles,
        'open_requests': open_requests,
        'completed_requests': completed_requests,
        'cancelled_requests': cancelled_requests,
        'recent_activities': activities
    }), 200

# --- Fehlerbehandlung (globale API-Fehler) ---

@bp.errorhandler(400)
def bad_request(error):
    return jsonify({"message": "Ungültige Anfrage"}), 400

@bp.errorhandler(401)
def unauthorized(error):
    return jsonify({"message": "Nicht authentifiziert"}), 401

@bp.errorhandler(403)
def forbidden(error):
    return jsonify({"message": "Zugriff verweigert"}), 403

@bp.errorhandler(404)
def not_found(error):
    return jsonify({"message": "Ressource nicht gefunden"}), 404

@bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"message": "Methode nicht erlaubt"}), 405

@bp.errorhandler(500)
def internal_server_error(error):
    logger.error(f"Interner Serverfehler: {str(error)}")
    return jsonify({"message": "Interner Serverfehler"}), 500

# (Ende)
