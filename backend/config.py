import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from a .env file
load_dotenv()

# Base directory of this file (backend/)
basedir = os.path.abspath(os.path.dirname(__file__))


def _build_mongo_settings(uri: str | None) -> dict:
    """
    Build MongoEngine connection settings from a URI string.
    Falls back to a local MongoDB instance for development.
    """
    if uri:
        return {
            "host": uri,
            "db": "interview_trainer"
        }
    # Default local development MongoDB
    return {
        "host": "localhost",
        "port": 27017,
        "db": "interview_trainer"
    }


class Config:
    """Base configuration with shared variables."""
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-for-dev-only")

    # JWT Auth Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-fallback-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    # MongoDB Connection (Flask-MongoEngine)
    MONGODB_SETTINGS = _build_mongo_settings(os.getenv("MONGODB_URI"))

    # AI API Keys — supports both env var names
    API_KEY = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")


class DevelopmentConfig(Config):
    """Configuration optimized for local development."""
    DEBUG = True
    ENV = "development"


class ProductionConfig(Config):
    """Configuration hardened for live production deployments."""
    DEBUG = False
    ENV = "production"


# Helper mapping to seamlessly switch configurations
config_by_name = {
    "dev": DevelopmentConfig,
    "prod": ProductionConfig
}
