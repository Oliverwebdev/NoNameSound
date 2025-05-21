import os
import re
import uuid
import datetime
import sqlite3
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify, g, abort, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import jwt

# Konfiguration
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'geheim_entwicklungsschluessel_ersetzen')
    DATABASE_PATH = os.environ.get('DATABASE_PATH', 'musikverleih.db')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_geheim_entwicklungsschluessel_ersetzen')
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.beispiel.de')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', 'benutzer@beispiel.de')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', 'passwort')
    OWNER_EMAIL = os.environ.get('OWNER_EMAIL', 'besitzer@beispiel.de')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@musikverleih.de')

# Instanziierung der Flask-App
app = Flask(__name__)
app.config.from_object(Config)

# CORS konfigurieren für Frontend-Backend-Kommunikation
CORS(app, resources={r"/api/*": {"origins": "*"}})

# JWT für Authentifizierung
jwt_manager = JWTManager(app)

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Datenbankfunktionen
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            app.config['DATABASE_PATH'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# Neues Admin-Absicherungstool einfügen
def ensure_admin_user():
    db = get_db()
    existing = db.execute("SELECT * FROM users WHERE username = 'admin'").fetchone()
    if not existing:
        password_hash = generate_password_hash("admin123")
        db.execute('''
            INSERT INTO users (username, password_hash, email, role)
            VALUES (?, ?, ?, ?)
        ''', ('admin', password_hash, 'admin@beispiel.de', 'owner'))
        db.commit()
        print("👤 Admin-User wurde explizit eingefügt.")

# CLI-Befehl verbessern
@app.cli.command('init-db')
def init_db_command():
    with open('schema.sql', 'w') as f:
        f.write(schema_sql)
    init_db()
    ensure_admin_user()  # <- wichtige neue Zeile
    os.remove('schema.sql')
    print('✅ Datenbank initialisiert und Admin-User abgesichert.')
    

# Diese Funktion fehlt in Ihrem app.py und sollte nach get_db() eingefügt werden
def init_db():
    """Initialisiert die Datenbank mit dem Schema"""
    db = get_db()
    
    # Schema-Datei ausführen
    with open('schema.sql', 'r') as f:
        db.executescript(f.read())
    
    db.commit()
    print("Datenbank initialisiert mit Schema")


# Schema als String für die Initialisierung
schema_sql = '''
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS rental_requests;
DROP TABLE IF EXISTS rental_request_items;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT 1,
    quantity_available INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    message TEXT,
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE rental_request_items (
    request_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (request_id, article_id),
    FOREIGN KEY (request_id) REFERENCES rental_requests (id),
    FOREIGN KEY (article_id) REFERENCES articles (id)
);

-- Trigger für das Aktualisieren des updated_at Felds bei Änderungen
CREATE TRIGGER update_articles_timestamp 
AFTER UPDATE ON articles
BEGIN
    UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Admin-Benutzer erstellen (Passwort: admin123)
INSERT INTO users (username, password_hash, email, role)
VALUES ('admin', 'scrypt:32768:8:1$T2R2blC0gwLmGOM7$fcb699410c5d6470c9856357856978eb8bcb0ba7cbb9a680cd71b0763a4518d25cd80687af465aaa9f9b42dad97ba92d1083c47e20cc0a1b4143d4e0917603b5', 'admin@beispiel.de', 'owner');
'''

@app.cli.command('init-db')
def init_db_command():
    """Befehl zum Initialisieren der Datenbank"""
    # Schreibe das Schema in eine temporäre Datei
    with open('schema.sql', 'w') as f:
        f.write(schema_sql)
    init_db()
    os.remove('schema.sql')  # Temporäre Datei löschen
    print('Datenbank initialisiert.')

# Middleware und Hilfsfunktionen
def owner_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_jwt_identity()
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE username = ?', (current_user,)).fetchone()
        
        if not user or user['role'] != 'owner':
            return jsonify({"message": "Nur der Besitzer hat Zugriff auf diese Funktion"}), 403
        return f(*args, **kwargs)
    return decorated_function

def validate_email(email):
    """Einfache E-Mail-Validierung"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def send_email(recipient, subject, body_html, body_text=None):
    """Sendet eine E-Mail mit HTML und optionalem Text-Inhalt"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = app.config['MAIL_DEFAULT_SENDER']
        msg['To'] = recipient
        
        if body_text:
            msg.attach(MIMEText(body_text, 'plain'))
        
        msg.attach(MIMEText(body_html, 'html'))
        
        with smtplib.SMTP(app.config['SMTP_SERVER'], app.config['SMTP_PORT']) as server:
            server.starttls()
            server.login(app.config['SMTP_USERNAME'], app.config['SMTP_PASSWORD'])
            server.send_message(msg)
        
        logger.info(f"E-Mail an {recipient} gesendet: {subject}")
        return True
    except Exception as e:
        logger.error(f"Fehler beim Senden der E-Mail: {str(e)}")
        return False

# Authentifizierung und Benutzerverwaltung
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login für den Besitzer"""
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    
    if not username or not password:
        return jsonify({"message": "Benutzername und Passwort sind erforderlich"}), 400
    
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user and check_password_hash(user['password_hash'], password):
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    
    return jsonify({"message": "Falsche Anmeldedaten"}), 401

@app.route('/api/auth/change-password', methods=['PUT'])
@jwt_required()
@owner_required
def change_password():
    """Passwort des Besitzers ändern"""
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
    db.execute('UPDATE users SET password_hash = ? WHERE username = ?', 
               (password_hash, username))
    db.commit()
    
    return jsonify({"message": "Passwort erfolgreich geändert"}), 200

# Artikelverwaltung (CRUD)
@app.route('/api/articles', methods=['GET'])
def get_articles():
    """Alle Artikel abrufen"""
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

@app.route('/api/articles/<int:article_id>', methods=['GET'])
def get_article(article_id):
    """Einen bestimmten Artikel abrufen"""
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

@app.route('/api/articles', methods=['POST'])
@jwt_required()
@owner_required
def create_article():
    """Neuen Artikel erstellen"""
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    
    required_fields = ['name', 'price_per_day']
    for field in required_fields:
        if field not in request.json:
            return jsonify({"message": f"Feld {field} ist erforderlich"}), 400
    
    name = request.json.get('name')
    description = request.json.get('description', '')
    price_per_day = request.json.get('price_per_day')
    image_url = request.json.get('image_url', '')
    is_available = request.json.get('is_available', True)
    quantity_available = request.json.get('quantity_available', 1)
    
    # Validierung
    if not isinstance(price_per_day, (int, float)) or price_per_day <= 0:
        return jsonify({"message": "Preis muss eine positive Zahl sein"}), 400
    
    if not isinstance(quantity_available, int) or quantity_available < 0:
        return jsonify({"message": "Verfügbare Menge muss eine nicht-negative Ganzzahl sein"}), 400
    
    db = get_db()
    cursor = db.execute(
        '''INSERT INTO articles 
           (name, description, price_per_day, image_url, is_available, quantity_available) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        (name, description, price_per_day, image_url, is_available, quantity_available)
    )
    db.commit()
    
    # Neuen Artikel zurückgeben
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

@app.route('/api/articles/<int:article_id>', methods=['PUT'])
@jwt_required()
@owner_required
def update_article(article_id):
    """Artikel aktualisieren"""
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    
    db = get_db()
    article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
    
    if not article:
        return jsonify({"message": "Artikel nicht gefunden"}), 404
    
    # Felder, die aktualisiert werden können
    name = request.json.get('name', article['name'])
    description = request.json.get('description', article['description'])
    price_per_day = request.json.get('price_per_day', article['price_per_day'])
    image_url = request.json.get('image_url', article['image_url'])
    is_available = request.json.get('is_available', article['is_available'])
    quantity_available = request.json.get('quantity_available', article['quantity_available'])
    
    # Validierung
    if not isinstance(price_per_day, (int, float)) or price_per_day <= 0:
        return jsonify({"message": "Preis muss eine positive Zahl sein"}), 400
    
    if not isinstance(quantity_available, int) or quantity_available < 0:
        return jsonify({"message": "Verfügbare Menge muss eine nicht-negative Ganzzahl sein"}), 400
    
    db.execute(
        '''UPDATE articles 
           SET name = ?, description = ?, price_per_day = ?, 
               image_url = ?, is_available = ?, quantity_available = ?
           WHERE id = ?''',
        (name, description, price_per_day, image_url, is_available, quantity_available, article_id)
    )
    db.commit()
    
    # Aktualisierter Artikel zurückgeben
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

@app.route('/api/articles/<int:article_id>', methods=['DELETE'])
@jwt_required()
@owner_required
def delete_article(article_id):
    """Artikel löschen"""
    db = get_db()
    article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
    
    if not article:
        return jsonify({"message": "Artikel nicht gefunden"}), 404
    
    # Prüfen, ob der Artikel in einer aktiven Mietanfrage verwendet wird
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

# Mietanfragen
@app.route('/api/rentals/request', methods=['POST'])
def create_rental_request():
    """Neue Mietanfrage erstellen"""
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    
    required_fields = ['customer_name', 'customer_email', 'start_date', 'end_date', 'items']
    for field in required_fields:
        if field not in request.json:
            return jsonify({"message": f"Feld {field} ist erforderlich"}), 400
    
    customer_name = request.json.get('customer_name')
    customer_email = request.json.get('customer_email')
    customer_phone = request.json.get('customer_phone', '')
    start_date = request.json.get('start_date')
    end_date = request.json.get('end_date')
    message = request.json.get('message', '')
    items = request.json.get('items', [])
    
    # Validierung
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
    
    # Verfügbarkeit der Artikel prüfen
    for item in items:
        if 'article_id' not in item or 'quantity' not in item:
            return jsonify({"message": "Jeder Artikel muss eine ID und eine Menge haben"}), 400
        
        article_id = item['article_id']
        quantity = item['quantity']
        
        if not isinstance(quantity, int) or quantity <= 0:
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
    
    # Transaktion starten
    try:
        # Mietanfrage erstellen
        cursor = db.execute(
            '''INSERT INTO rental_requests 
               (customer_name, customer_email, customer_phone, start_date, end_date, message, status) 
               VALUES (?, ?, ?, ?, ?, ?, 'new')''',
            (customer_name, customer_email, customer_phone, start_date, end_date, message)
        )
        request_id = cursor.lastrowid
        
        # Artikel zur Anfrage hinzufügen
        for item in items:
            article_id = item['article_id']
            quantity = item['quantity']
            
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, article_id, quantity)
            )
        
        db.commit()
        
        # E-Mail an den Besitzer senden
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
        
        # E-Mail-Inhalt erstellen
        email_subject = f"Neue Mietanfrage von {customer_name}"
        
        # Anzahl der Tage berechnen
        rental_days = (end_date_obj - start_date_obj).days + 1
        
        # Gesamtpreis berechnen
        total_price = sum(
            item['price_per_day'] * item['quantity'] * rental_days 
            for item in requested_articles
        )
        
        email_html = f"""
        <html>
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
                </tr>
        """
        
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
            
            <p>
                Bitte logge dich in dein System ein, um die Anfrage zu bearbeiten.
            </p>
        </body>
        </html>
        """
        
        # Text-Version für E-Mail-Clients, die kein HTML unterstützen
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
        
        # E-Mail senden
        send_email(
            recipient=app.config['OWNER_EMAIL'],
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

@app.route('/api/rentals', methods=['GET'])
@jwt_required()
@owner_required
def get_rental_requests():
    """Alle Mietanfragen abrufen (nur für den Besitzer)"""
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
        # Artikel für diese Anfrage abrufen
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
        
        # Berechnung der Mietdauer und des Gesamtpreises
        start_date = datetime.date.fromisoformat(req['start_date'])
        end_date = datetime.date.fromisoformat(req['end_date'])
        rental_days = (end_date - start_date).days + 1
        
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

@app.route('/api/rentals/<int:request_id>', methods=['GET'])
@jwt_required()
@owner_required
def get_rental_request(request_id):
    """Eine bestimmte Mietanfrage abrufen (nur für den Besitzer)"""
    db = get_db()
    rental_request = db.execute(
        'SELECT * FROM rental_requests WHERE id = ?', (request_id,)
    ).fetchone()
    
    if not rental_request:
        return jsonify({"message": "Mietanfrage nicht gefunden"}), 404
    
    # Artikel für diese Anfrage abrufen
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
    
    # Berechnung der Mietdauer und des Gesamtpreises
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

@app.route('/api/rentals/<int:request_id>/status', methods=['PUT'])
@jwt_required()
@owner_required
def update_rental_status(request_id):
    """Status einer Mietanfrage aktualisieren (nur für den Besitzer)"""
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
    
    # Status aktualisieren
    db.execute(
        'UPDATE rental_requests SET status = ? WHERE id = ?',
        (new_status, request_id)
    )
    db.commit()
    
    # Wenn Status "fulfilled" oder "cancelled" ist, Artikelverfügbarkeit aktualisieren
    if new_status == 'fulfilled':
        # Bei 'fulfilled' Artikelverfügbarkeit nicht ändern, da der Kunde die Artikel zurückgegeben hat
        pass
    
    return jsonify({"message": "Status erfolgreich aktualisiert"}), 200

# Fehlerbehandlung
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"message": "Ungültige Anfrage"}), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"message": "Nicht authentifiziert"}), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({"message": "Zugriff verweigert"}), 403

@app.errorhandler(404)
def not_found(error):
    return jsonify({"message": "Ressource nicht gefunden"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"message": "Methode nicht erlaubt"}), 405

@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"Interner Serverfehler: {str(error)}")
    return jsonify({"message": "Interner Serverfehler"}), 500

# Rate Limiting Middleware
@app.before_request
def limit_login_attempts():
    """Einfaches Rate Limiting für Login-Anfragen"""
    if request.endpoint == 'login':
        ip = request.remote_addr
        current_time = datetime.datetime.now()
        
        # Hier könnte eine komplexere Implementierung mit Redis oder einer anderen Datenbank erfolgen
        # Für Einfachheit verwenden wir hier ein Dictionary im Speicher
        if not hasattr(app, 'login_attempts'):
            app.login_attempts = {}
        
        # Alte Einträge entfernen (älter als 15 Minuten)
        for stored_ip in list(app.login_attempts.keys()):
            attempts = app.login_attempts[stored_ip]
            if (current_time - attempts['timestamp']).total_seconds() > 900:  # 15 Minuten
                del app.login_attempts[stored_ip]
        
        if ip in app.login_attempts:
            attempts = app.login_attempts[ip]
            # Wenn zu viele Versuche in kurzer Zeit
            if attempts['count'] >= 5 and (current_time - attempts['timestamp']).total_seconds() < 900:
                abort(429)  # Too Many Requests
            
            # Zähler erhöhen und Zeit aktualisieren
            attempts['count'] += 1
            attempts['timestamp'] = current_time
        else:
            app.login_attempts[ip] = {'count': 1, 'timestamp': current_time}

@app.errorhandler(429)
def too_many_requests(error):
    return jsonify({
        "message": "Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut."
    }), 429

# Systemstatistiken
@app.route('/api/stats', methods=['GET'])
@jwt_required()
@owner_required
def get_system_stats():
    """Systemstatistiken abrufen (nur für den Besitzer)"""
    db = get_db()
    
    # Gesamtzahl der Artikel
    total_articles = db.execute('SELECT COUNT(*) as count FROM articles').fetchone()['count']
    
    # Verfügbare Artikel
    available_articles = db.execute(
        'SELECT COUNT(*) as count FROM articles WHERE is_available = 1 AND quantity_available > 0'
    ).fetchone()['count']
    
    # Offene Anfragen
    open_requests = db.execute(
        'SELECT COUNT(*) as count FROM rental_requests WHERE status IN ("new", "contacted")'
    ).fetchone()['count']
    
    # Abgeschlossene Anfragen
    completed_requests = db.execute(
        'SELECT COUNT(*) as count FROM rental_requests WHERE status = "fulfilled"'
    ).fetchone()['count']
    
    # Stornierte Anfragen
    cancelled_requests = db.execute(
        'SELECT COUNT(*) as count FROM rental_requests WHERE status = "cancelled"'
    ).fetchone()['count']
    
    # Letzte Aktivitäten - die letzten 5 Anfragen
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

# Wenn die App direkt ausgeführt wird
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
