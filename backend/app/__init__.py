from flask import Flask, jsonify, request
import traceback
from app.core.config import config_by_name
from app.models import db
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

def create_app(config_name="dev"):
    """
    Application Factory Pattern.
    Creates and configures the Flask application cleanly without global state.
    """

    # Backend now serves purely as a JSON API
    app = Flask(__name__)

    # Load configuration securely from the config dictionary
    app.config.from_object(config_by_name.get(config_name, config_by_name["dev"]))

    # Initialize Extensions
    CORS(app)
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    # Register Blueprints (Modular Routing)
    from app.routes.auth import auth_bp
    from app.routes.resume import resume_bp
    from app.routes.interview import interview_bp
    from app.routes.user import user_bp
    from app.routes.media import media_bp
    from app.routes.company import company_bp
    from app.routes.roadmap import roadmap_bp
    from app.routes.community import community_bp
    from app.routes.arena import arena_bp
    from app.routes.dsa import dsa_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(media_bp, url_prefix='/api/media')
    app.register_blueprint(dsa_bp, url_prefix='/api/dsa')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')
    app.register_blueprint(community_bp, url_prefix='/api/community')
    app.register_blueprint(arena_bp, url_prefix='/api/code')

    # Health check
    @app.route("/health", methods=["GET"])
    def health_check():
        """Basic health check endpoint ensuring the server is running securely."""
        return jsonify({
            "status": "healthy",
            "environment": config_name
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        # Note: error_log.txt will now be in the project root if we run manage.py from there
        with open("error_log.txt", "a") as f:
            f.write(f"404 Error: {request.url}\n")
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        with open("error_log.txt", "a") as f:
            f.write(f"405 Error: {request.method} {request.url}\n")
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(error):
        with open("error_log.txt", "a") as f:
            f.write(f"500 Error: {traceback.format_exc()}\n")
        return jsonify({"error": "An internal error occurred", "details": str(error)}), 500

    return app
