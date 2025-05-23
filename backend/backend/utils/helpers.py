from functools import wraps
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_access_token
)
from ..utils.db import get_db
from flask import jsonify, current_app
import logging
import re

logger = logging.getLogger(__name__)

def validate_email(email):
    """Einfache E-Mail-Validierung"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_text(text, max_length=255, strip_html=True):
    """Säubert einen String: entfernt HTML, trimmt, setzt max Länge."""
    if not isinstance(text, str):
        return ""
    clean = text.strip()
    if strip_html:
        clean = re.sub(r'<[^>]+>', '', clean)
    if max_length:
        clean = clean[:max_length]
    return clean

def validate_positive_number(val):
    try:
        return float(val) > 0
    except Exception:
        return False

def validate_int(val, min_val=0):
    try:
        v = int(val)
        return v >= min_val
    except Exception:
        return False

def send_email(recipient, subject, body_html, body_text=None):
    """Sendet eine E-Mail mit HTML und optionalem Text-Inhalt"""
    try:
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        import smtplib

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = current_app.app.config['MAIL_DEFAULT_SENDER']
        msg['To'] = recipient
        
        if body_text:
            msg.attach(MIMEText(body_text, 'plain'))
        
        msg.attach(MIMEText(body_html, 'html'))
        
        with smtplib.SMTP(current_app.config['SMTP_SERVER'], current_app.config['SMTP_PORT']) as server:
            server.starttls()
            server.login(current_app.config['SMTP_USERNAME'], current_app.config['SMTP_PASSWORD'])
            server.send_message(msg)
        
        logger.info(f"E-Mail an {recipient} gesendet: {subject}")
        return True
    except Exception as e:
        logger.error(f"Fehler beim Senden der E-Mail: {str(e)}")
        return False

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
