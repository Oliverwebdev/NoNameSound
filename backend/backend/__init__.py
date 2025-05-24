# from flask import Flask
# from flask_cors import CORS
# from flask_jwt_extended import JWTManager
# from dotenv import load_dotenv
# from .config import Config, schema_sql
# from .utils.db import get_db, init_db, ensure_admin_user, close_db
# from .utils.helpers import validate_email, send_email, owner_required
# from .routes.api import bp

# import os, logging

# load_dotenv()

# app = Flask(__name__)
# app.config.from_object(Config)

# # Korrekte, einheitliche CORS-Konfiguration
# CORS(app, resources={r"/api/*": {"origins": [
#     "http://localhost:5173",
#     "https://nonamesound-frontend.onrender.com"
# ]}}, supports_credentials=True)

# # JWT
# jwt_manager = JWTManager(app)

# # Logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#     handlers=[logging.FileHandler("app.log"), logging.StreamHandler()]
# )

# # Register routes + DB cleanup
# app.register_blueprint(bp)
# app.teardown_appcontext(close_db)

# # Optional: CLI zum DB-Init
# @app.cli.command('init-db')
# def init_db_command():
#     with open('schema.sql', 'w') as f:
#         f.write(schema_sql)
#     init_db()
#     ensure_admin_user()
#     os.remove('schema.sql')
#     print("✅ Datenbank initialisiert.")
