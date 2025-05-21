import sqlite3
import datetime

DATABASE_PATH = 'musikverleih.db'

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def insert_article_if_not_exists(db, name, data):
    existing = db.execute('SELECT id FROM articles WHERE name = ?', (name,)).fetchone()
    if not existing:
        db.execute(
            '''INSERT INTO articles 
               (name, description, price_per_day, image_url, is_available, quantity_available) 
               VALUES (?, ?, ?, ?, ?, ?)''',
            data
        )

def populate_db():
    db = get_db()

    # Artikel
    articles = [
        ('Akustische Gitarre', 'Martin D-28 Akustikgitarre', 15.00, 'https://example.com/guitar.jpg', 1, 2),
        ('E-Bass', 'Fender Precision Bass, 4-Saiter, schwarz', 20.00, 'https://example.com/bass.jpg', 1, 1),
        ('Drumset', 'Sonor Force 3005 Schlagzeug', 30.00, 'https://example.com/drums.jpg', 1, 1),
        ('Keyboard', 'Yamaha PSR-E373 Keyboard', 18.00, 'https://example.com/keyboard.jpg', 1, 3),
        ('PA-Anlage', '2x 300W Lautsprecher + Mischpult', 45.00, 'https://example.com/pa.jpg', 1, 1),
        ('Mikrofon', 'Shure SM58 Gesangsmikrofon', 8.00, 'https://example.com/mic.jpg', 1, 5),
        ('DJ-Controller', 'Pioneer DDJ-400 mit Rekordbox', 25.00, 'https://example.com/dj.jpg', 1, 2),
        ('Effektprozessor', 'Boss GT-1000 Multieffekt', 12.00, 'https://example.com/fx.jpg', 1, 2)
    ]

    for article in articles:
        insert_article_if_not_exists(db, article[0], article)

    # Mietanfragen
    today = datetime.date.today()
    demo_rentals = [
        ('max@example.com', 'Max Mustermann', '0123456789', today + datetime.timedelta(days=3), today + datetime.timedelta(days=6), 'Bandprobe', 'new'),
        ('anna@example.com', 'Anna Schmidt', '0987654321', today + datetime.timedelta(days=10), today + datetime.timedelta(days=12), 'Geburtstag', 'contacted'),
        ('tom@example.com', 'Tom Johnson', '01234567890', today - datetime.timedelta(days=10), today - datetime.timedelta(days=5), 'Schulkonzert', 'fulfilled'),
        ('lisa@example.com', 'Lisa Müller', '0123987456', today - datetime.timedelta(days=20), today - datetime.timedelta(days=18), 'Hochzeit', 'cancelled')
    ]

    for email, name, phone, start, end, message, status in demo_rentals:
        exists = db.execute(
            '''SELECT id FROM rental_requests 
               WHERE customer_email = ? AND start_date = ?''',
            (email, start.isoformat())
        ).fetchone()
        if not exists:
            cursor = db.execute(
                '''INSERT INTO rental_requests 
                   (customer_name, customer_email, customer_phone, start_date, end_date, message, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (name, email, phone, start.isoformat(), end.isoformat(), message, status)
            )
            request_id = cursor.lastrowid

            # Beispielartikel zuweisen (immer erste 2 Artikel)
            articles = db.execute('SELECT id FROM articles LIMIT 2').fetchall()
            for a in articles:
                db.execute(
                    'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                    (request_id, a['id'], 1)
                )

    db.commit()
    db.close()
    print("✅ Datenbank erfolgreich befüllt – ohne Duplikate.")

if __name__ == '__main__':
    populate_db()
