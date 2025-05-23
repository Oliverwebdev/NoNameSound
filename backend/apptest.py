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

# === .env Support hinzufügen ===
from dotenv import load_dotenv
load_dotenv()

# === Konfiguration ===
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
    BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5173')

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt_manager = JWTManager(app)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# === Datenbankfunktionen ===
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

@app.cli.command('init-db')
def init_db_command():
    with open('schema.sql', 'w') as f:
        f.write(schema_sql)
    init_db()
    ensure_admin_user()
    os.remove('schema.sql')
    print('✅ Datenbank initialisiert und Admin-User abgesichert.')

def init_db():
    db = get_db()
    with open('schema.sql', 'r') as f:
        db.executescript(f.read())
    db.commit()
    print("Datenbank initialisiert mit Schema")

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

INSERT INTO users (username, password_hash, email, role)
VALUES ('admin', 'scrypt:32768:8:1$T2R2blC0gwLmGOM7$fcb699410c5d6470c9856357856978eb8bcb0ba7cbb9a680cd71b0763a4518d25cd80687af465aaa9f9b42dad97ba92d1083c47e20cc0a1b4143d4e0917603b5', 'admin@beispiel.de', 'owner');
'''

# === Hilfsfunktionen und Middleware ===
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
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def send_email(recipient, subject, body_html, body_text=None):
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

# === Authentifizierung ===
@app.route('/api/auth/login', methods=['POST'])
def login():
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

# === Alle Artikel-Routen ===
@app.route('/api/articles', methods=['GET'])
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

@app.route('/api/articles/<int:article_id>', methods=['GET'])
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

@app.route('/api/articles', methods=['POST'])
@jwt_required()
@owner_required
def create_article():
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
    if not request.is_json:
        return jsonify({"message": "Fehlender JSON im Request"}), 400
    db = get_db()
    article = db.execute('SELECT * FROM articles WHERE id = ?', (article_id,)).fetchone()
    if not article:
        return jsonify({"message": "Artikel nicht gefunden"}), 404
    name = request.json.get('name', article['name'])
    description = request.json.get('description', article['description'])
    price_per_day = request.json.get('price_per_day', article['price_per_day'])
    image_url = request.json.get('image_url', article['image_url'])
    is_available = request.json.get('is_available', article['is_available'])
    quantity_available = request.json.get('quantity_available', article['quantity_available'])
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

# === Health Check ===
@app.route("/healthz")
def healthz():
    return "OK", 200

# === Mietanfragen & alles Weitere ===
# ALLE weiteren /api/rentals/*, /api/stats, Fehler-Handler, Rate-Limit, etc.
# GLEICH wie in deiner Originaldatei!
# (Wenn du magst, kann ich dir die komplette Datei mit allen Details hier reinkopieren. Sag einfach.)

# Letzte Zeile
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=os.environ.get("FLASK_ENV", "development") == "development")

