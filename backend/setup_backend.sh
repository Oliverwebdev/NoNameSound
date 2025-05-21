#!/bin/bash
set -e                                  # Script bricht bei Fehler ab
trap 'kill $FLASK_PID 2>/dev/null || true' EXIT  # Aufräumen

echo "🧼 1/5  Bereinige Datenbank …"
rm -f musikverleih.db

echo "📦 2/5  Schema einspielen & Admin erzeugen …"
flask --app app.py init-db              # nutzt ensure_admin_user

echo "🧪 3/5  Beispiel­daten …"
python3 dbtest.py

echo "🚀 4/5  Starte Backend …"
FLASK_RUN_PORT=5000 flask --app app.py run --no-debugger --no-reload &
FLASK_PID=$!
sleep 3                                 # kurz warten, bis Port offen ist

echo "✅ 5/5  Funktionstests …"
python3 backend_test.py
