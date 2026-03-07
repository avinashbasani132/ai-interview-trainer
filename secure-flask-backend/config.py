import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from a .env file into the system
load_dotenv()

class Config:
    """Base configuration with shared variables."""
    # Ensure a highly randomized, unguessable string is utilized in production
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-for-dev-only")
    
    # JWT Auth Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-fallback-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Database Configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Store critical API integrations safely
    API_KEY = os.getenv("API_KEY")

class DevelopmentConfig(Config):
    """Configuration optimized for local development."""
    DEBUG = True
    ENV = "development"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///dev.db")

class ProductionConfig(Config):
    """Configuration hardened for live production deployments."""
    DEBUG = False
    ENV = "production"
    # Provide a sturdy DB URL like postgresql in production .env
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///prod.db")

# Helper mapping to seamlessly switch configurations
config_by_name = {
    "dev": DevelopmentConfig,
    "prod": ProductionConfig
}
