import sqlite3
from flask import g, current_app
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_access_token
)



def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE_PATH'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db



def init_db():
    """Initialisiert die Datenbank mit dem Schema"""
    db = get_db()
    
    # Schema-Datei ausführen
    with open('schema.sql', 'r') as f:
        db.executescript(f.read())
    
    db.commit()
    print("Datenbank initialisiert mit Schema")

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

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()
