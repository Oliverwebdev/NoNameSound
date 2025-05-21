import sqlite3
import datetime

# Pfad zur Datenbank
DATABASE_PATH = 'musikverleih.db'

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def populate_db():
    db = get_db()
    
    # Einige Beispielartikel erstellen
    articles = [
        (
            'Akustische Gitarre', 
            'Martin D-28 Akustikgitarre, hervorragender Klang und Zustand', 
            15.00, 
            'https://example.com/guitar.jpg',
            1,  # is_available
            2   # quantity_available
        ),
        (
            'E-Bass', 
            'Fender Precision Bass, 4-Saiter, schwarz', 
            20.00, 
            'https://example.com/bass.jpg',
            1,  # is_available
            1   # quantity_available
        ),
        (
            'Drumset', 
            'Komplettes Sonor Force 3005 Schlagzeug mit Hardware', 
            30.00, 
            'https://example.com/drums.jpg',
            1,  # is_available
            1   # quantity_available
        ),
        (
            'Keyboard', 
            'Yamaha PSR-E373 Keyboard mit 61 Tasten und Begleitautomatik', 
            18.00, 
            'https://example.com/keyboard.jpg',
            1,  # is_available
            3   # quantity_available
        ),
        (
            'PA-Anlage', 
            'Kompakte PA-Anlage mit 2x 300W Lautsprechern und Mischpult', 
            45.00, 
            'https://example.com/pa.jpg',
            1,  # is_available
            1   # quantity_available
        ),
        (
            'Mikrofon', 
            'Shure SM58 Gesangsmikrofon mit Kabel', 
            8.00, 
            'https://example.com/mic.jpg',
            1,  # is_available
            5   # quantity_available
        ),
        (
            'DJ-Controller', 
            'Pioneer DDJ-400 DJ-Controller mit Rekordbox Software', 
            25.00, 
            'https://example.com/dj.jpg',
            1,  # is_available
            2   # quantity_available
        ),
        (
            'Effektprozessor', 
            'Boss GT-1000 Gitarren-Multieffektprozessor', 
            12.00, 
            'https://example.com/fx.jpg',
            1,  # is_available
            2   # quantity_available
        )
    ]
    
    # Artikel in die Datenbank einfügen
    for article in articles:
        db.execute(
            '''INSERT INTO articles 
               (name, description, price_per_day, image_url, is_available, quantity_available) 
               VALUES (?, ?, ?, ?, ?, ?)''',
            article
        )
    
    # Einige Beispiel-Mietanfragen erstellen
    today = datetime.date.today()
    tomorrow = today + datetime.timedelta(days=1)
    next_week = today + datetime.timedelta(days=7)
    
    rental_requests = [
        (
            'Max Mustermann',
            'max@example.com',
            '0123456789',
            (today + datetime.timedelta(days=3)).isoformat(),  # start_date (in 3 Tagen)
            (today + datetime.timedelta(days=6)).isoformat(),  # end_date (in 6 Tagen)
            'Benötige die Ausrüstung für eine kleine Bandprobe',
            'new'  # status
        ),
        (
            'Anna Schmidt',
            'anna@example.com',
            '0987654321',
            (today + datetime.timedelta(days=10)).isoformat(),  # start_date (in 10 Tagen)
            (today + datetime.timedelta(days=12)).isoformat(),  # end_date (in 12 Tagen)
            'Für eine Geburtstagsfeier mit Live-Musik',
            'contacted'  # status
        ),
        (
            'Tom Johnson',
            'tom@example.com',
            '01234567890',
            (today - datetime.timedelta(days=10)).isoformat(),  # start_date (vor 10 Tagen)
            (today - datetime.timedelta(days=5)).isoformat(),  # end_date (vor 5 Tagen)
            'Schulkonzert',
            'fulfilled'  # status
        ),
        (
            'Lisa Müller',
            'lisa@example.com',
            '0123987456',
            (today - datetime.timedelta(days=20)).isoformat(),  # start_date (vor 20 Tagen)
            (today - datetime.timedelta(days=18)).isoformat(),  # end_date (vor 18 Tagen)
            'Hochzeit',
            'cancelled'  # status
        )
    ]
    
    # Mietanfragen in die Datenbank einfügen
    for request in rental_requests:
        cursor = db.execute(
            '''INSERT INTO rental_requests 
               (customer_name, customer_email, customer_phone, start_date, end_date, message, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            request
        )
        request_id = cursor.lastrowid
        
        # Zufällige Artikel zu jeder Anfrage hinzufügen
        # Für die Einfachheit nehmen wir die ersten 2-3 Artikel für jede Anfrage
        if request_id == 1:  # Max Mustermann
            # Gitarre und Mikrofon
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 1, 1)  # 1 Gitarre
            )
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 6, 2)  # 2 Mikrofone
            )
        elif request_id == 2:  # Anna Schmidt
            # Komplette Band-Ausrüstung
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 1, 1)  # 1 Gitarre
            )
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 2, 1)  # 1 Bass
            )
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 3, 1)  # 1 Drumset
            )
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 5, 1)  # 1 PA-Anlage
            )
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 6, 3)  # 3 Mikrofone
            )
        elif request_id == 3:  # Tom Johnson
            # DJ-Setup
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 7, 1)  # 1 DJ-Controller
            )
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 5, 1)  # 1 PA-Anlage
            )
        elif request_id == 4:  # Lisa Müller
            # Keyboard und Mikrofon
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 4, 1)  # 1 Keyboard
            )
            db.execute(
                'INSERT INTO rental_request_items (request_id, article_id, quantity) VALUES (?, ?, ?)',
                (request_id, 6, 1)  # 1 Mikrofon
            )
    
    # Änderungen bestätigen
    db.commit()
    db.close()
    
    print("Datenbank erfolgreich mit Testdaten befüllt!")

if __name__ == '__main__':
    populate_db()