import requests
import json

BASE_URL = "http://localhost:5000/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

def test_login():
    print("[🔐] Login testen...")
    r = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDENTIALS)
    assert r.status_code == 200, "Login fehlgeschlagen"
    return r.json()["access_token"]

def test_create_article(token):
    print("[📦] Artikel erstellen...")
    headers = {"Authorization": f"Bearer {token}"}
    article_data = {
        "name": "Testmikrofon",
        "description": "Super Sound",
        "price_per_day": 12.5,
        "quantity_available": 3
    }
    r = requests.post(f"{BASE_URL}/articles", json=article_data, headers=headers)
    assert r.status_code == 201, "Artikel konnte nicht erstellt werden"
    return r.json()["id"]

def test_get_articles():
    print("[📄] Artikel abrufen...")
    r = requests.get(f"{BASE_URL}/articles")
    assert r.status_code == 200, "Artikelabruf fehlgeschlagen"
    return r.json()

def test_create_rental_request(article_id):
    print("[📝] Mietanfrage senden...")
    rental_data = {
        "customer_name": "Testkunde",
        "customer_email": "kunde@test.de",
        "start_date": "2025-06-01",
        "end_date": "2025-06-03",
        "items": [{"article_id": article_id, "quantity": 1}]
    }
    r = requests.post(f"{BASE_URL}/rentals/request", json=rental_data)
    assert r.status_code == 201, "Mietanfrage fehlgeschlagen"
    return r.json()["request_id"]

def test_get_stats(token):
    print("[📊] Systemstatistiken abrufen...")
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/stats", headers=headers)
    assert r.status_code == 200, "Statistiken konnten nicht geladen werden"
    return r.json()

def main():
    token = test_login()
    article_id = test_create_article(token)
    test_get_articles()
    request_id = test_create_rental_request(article_id)
    stats = test_get_stats(token)

    print("\n✅ ALLE TESTS ERFOLGREICH ABGESCHLOSSEN.")
    print(f"🔎 Systemstatistiken:\n{json.dumps(stats, indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    main()

