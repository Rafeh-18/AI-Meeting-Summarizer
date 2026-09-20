from flask import Flask
from app.config import Config
from app.extensions import db, jwt, bcrypt, cors
from dotenv import load_dotenv
import os
from pathlib import Path
from app.models import user, meeting, chat_message

# Load .env from project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH)


def create_app():

    app = Flask(__name__)

    # Load config
    app.config.from_object(Config)
    print("CORS_ORIGIN:", app.config["CORS_ORIGIN"])
    # Force Groq key into Flask config
    app.config["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

    print("ENV PATH:", ENV_PATH)
    print("GROQ KEY LOADED:", bool(app.config["GROQ_API_KEY"]))

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # CORS
    cors.init_app(
        app,
        supports_credentials=True,
        origins=[
            app.config["CORS_ORIGIN"],
        ]
    )

    # Routes
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(
        auth_bp,
        url_prefix="/api"
    )

    from app.routes.meetings_routes import meetings_bp
    app.register_blueprint(
        meetings_bp,
        url_prefix="/api"
    )

    # Database
    with app.app_context():
        from app.models import user, meeting
        db.create_all()

    @app.errorhandler(404)
    def not_found(e):
        return {
            "error": "Not found"
        }, 404

    return app
