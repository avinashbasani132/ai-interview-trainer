from flask import Flask, jsonify, request, send_from_directory
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

    # Resolve the frontend folder (one level up from backend/)
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend'))

    # Serve frontend static files and SPA index.html
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')

    # Load configuration securely from the config dictionary
    app.config.from_object(config_by_name.get(config_name, config_by_name["dev"]))

    # Initialize Extensions
    CORS(app)
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    with app.app_context():
        db.create_all()

    # Register Blueprints (Modular Routing)
    from app.routes.auth import auth_bp
    from app.routes.resume import resume_bp
    from app.routes.interview import interview_bp
    from app.routes.resume_interview import resume_interview_bp
    from app.routes.user import user_bp
    from app.routes.media import media_bp
    from app.routes.company import company_bp
    from app.routes.roadmap import roadmap_bp
    from app.routes.community import community_bp
    from app.routes.arena import arena_bp
    from app.routes.dsa import dsa_bp
    from app.routes.chatbot import chatbot_bp
    from app.routes.certificate import certificate_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    app.register_blueprint(resume_interview_bp, url_prefix='/api/resume-interview')
    app.register_blueprint(certificate_bp)

    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(media_bp, url_prefix='/api/media')
    app.register_blueprint(dsa_bp, url_prefix='/api/dsa')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')
    app.register_blueprint(community_bp, url_prefix='/api/community')
    app.register_blueprint(arena_bp, url_prefix='/api/code')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chat')

    # Health check
    @app.route("/health", methods=["GET"])
    def health_check():
        """Basic health check endpoint ensuring the server is running securely."""
        return jsonify({
            "status": "healthy",
            "environment": config_name
        }), 200

    # Serve the frontend SPA for any non-API route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        """Serve the frontend single-page application."""
        # Let Flask serve actual static files (js/, css/, images/)
        if path and os.path.exists(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)
        # Fall back to index.html for SPA routing
        return send_from_directory(frontend_dir, 'index.html')

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
