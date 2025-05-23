import os
import datetime

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
