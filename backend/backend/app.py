import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Eigene Imports
from .config import Config, schema_sql
from .utils.db import get_db, init_db, ensure_admin_user, close_db
from .utils.helpers import validate_email, send_email, owner_required
from .routes.api import bp

# .env laden
load_dotenv()

# Flask-App anlegen
app = Flask(__name__)
app.config.from_object(Config)

# --- JWT NUR AUS COOKIES LESEN (XSS-IMMUN) ---
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False        # True für HTTPS-Deployments!
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'      # Oder 'Strict'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Auf True für PROD+CSRF

jwt_manager = JWTManager(app)

# CORS-Konfiguration – Cookies erlauben!
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",
    "https://nonamesound-frontend.onrender.com"
]}}, supports_credentials=True)

# Logging mit Rotation (für Produktion robust!)
log_handler = RotatingFileHandler('app.log', maxBytes=1024*1024, backupCount=5)
log_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_handler.setFormatter(formatter)
app.logger.addHandler(log_handler)
app.logger.setLevel(logging.INFO)

# API-Blueprint registrieren
app.register_blueprint(bp)

# DB-Teardown für Flask-Context
app.teardown_appcontext(close_db)

# CLI-Command zum Initialisieren der DB (einmalig ausführen: flask init-db)
@app.cli.command("init-db")
def init_db_command():
    """Initialisiert die Datenbank und erstellt einen Admin-User"""
    with open('schema.sql', 'w') as f:
        f.write(schema_sql)
    init_db()
    ensure_admin_user()
    os.remove('schema.sql')
    print('✅ Datenbank initialisiert und Admin-User abgesichert.')

# Healthcheck-Route
@app.route("/healthz")
def healthz():
    return "OK", 200

# Starte die App (nur wenn direkt ausgeführt, nicht beim Import)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
