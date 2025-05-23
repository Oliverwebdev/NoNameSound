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
from dotenv import load_dotenv
load_dotenv() 

# Konfiguration
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', )
    DATABASE_PATH = os.environ.get('DATABASE_PATH', )
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', )
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
    SMTP_SERVER = os.environ.get('SMTP_SERVER', )
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', )
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', )
    OWNER_EMAIL = os.environ.get('OWNER_EMAIL', )
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', )
    BASE_URL         = os.environ.get('BASE_URL')


# Instanziierung der Flask-App
app = Flask(__name__)
app.config.from_object(Config)

# CORS konfigurieren für Frontend-Backend-Kommunikation
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",  # lokal für Dev
    "https://nonamesound-frontend.onrender.com"
]}})


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

from .config import Config, schema_sql
from .utils.db import get_db, init_db, ensure_admin_user, close_db
from .utils.helpers import validate_email, send_email, owner_required
from .routes.api import bp

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "https://nonamesound-frontend.onrender.com"]}})
jwt_manager = JWTManager(app)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app.register_blueprint(bp)
app.teardown_appcontext(close_db)
@app.cli.command('init-db')
def init_db_command():
    with open('schema.sql', 'w') as f:
        f.write(schema_sql)
    init_db()
    ensure_admin_user()  # <- wichtige neue Zeile
    os.remove('schema.sql')
    print('✅ Datenbank initialisiert und Admin-User abgesichert.')
@app.cli.command('init-db')
def init_db_command():
    """Befehl zum Initialisieren der Datenbank"""
    # Schreibe das Schema in eine temporäre Datei
    with open('schema.sql', 'w') as f:
        f.write(schema_sql)
    init_db()
    os.remove('schema.sql')  # Temporäre Datei löschen
    print('Datenbank initialisiert.')
