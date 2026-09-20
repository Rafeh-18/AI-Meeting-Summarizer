import os
from datetime import timedelta


BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)


class Config:

    GROQ_API_KEY = os.getenv(
        "GROQ_API_KEY"
    )


    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER",
        os.path.join(BASE_DIR, "uploads")
    )


    MAX_CONTENT_LENGTH = 500 * 1024 * 1024

    ALLOWED_EXTENSIONS = {
        "mp3",
        "wav",
        "m4a",
        "mp4",
        "mov",
        "webm",
        "ogg"
    }


    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "dev-secret-change-me"
    )


    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://clario:clario@localhost:5432/clario_db"
    )


    SQLALCHEMY_TRACK_MODIFICATIONS = False


    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "dev-jwt-secret-change-me"
    )


    JWT_TOKEN_LOCATION = ["cookies"]

    JWT_ACCESS_COOKIE_NAME = "access_token"

    JWT_REFRESH_COOKIE_NAME = "refresh_token"

    JWT_COOKIE_SECURE = (
        os.getenv("FLASK_ENV") == "production"
    )

    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")

    JWT_COOKIE_CSRF_PROTECT = True

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=1
    )

    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=30
    )


    CORS_ORIGIN = os.getenv(
        "CORS_ORIGIN",
        "http://localhost:5173"
    )
