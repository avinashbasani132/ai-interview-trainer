import os
import sys
import traceback
import argparse
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from waitress import serve


def _log_error(message: str, filename: str = "error_log.txt") -> None:
    """
    Write error messages to a log file.
    On Render (read-only filesystem), logs are written to /tmp/.
    Locally, logs are written to the current working directory.
    """
    try:
        log_dir = "/tmp" if os.getenv("RENDER") else "."
        log_path = os.path.join(log_dir, filename)
        with open(log_path, "a") as f:
            f.write(message + "\n")
    except Exception:
        pass  # Never crash the app because of a logging failure


# Add current directory to path to ensure correct package resolution
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from config import config_by_name
from models import db


def create_app(config_name="dev"):
    """
    Application Factory Pattern.
    Creates and configures the Flask application with MongoDB via MongoEngine.
    """
    app = Flask(
        __name__,
        static_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend-react/dist')),
        template_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend-react/dist')),
        static_url_path=''
    )

    # Load configuration from the config dictionary
    app.config.from_object(config_by_name.get(config_name, config_by_name["dev"]))

    # Initialize Extensions
    CORS(app)
    db.init_app(app)   # Flask-MongoEngine — no create_all() needed (schemaless)
    JWTManager(app)

    # Register Blueprints (Modular Routing)
    from routes.auth import auth_bp
    from routes.resume import resume_bp
    from routes.interview import interview_bp
    from routes.resume_interview import resume_interview_bp
    from routes.user import user_bp
    from routes.media import media_bp
    from routes.company import company_bp
    from routes.roadmap import roadmap_bp
    from routes.community import community_bp
    from routes.arena import arena_bp
    from routes.dsa import dsa_bp
    from routes.chatbot import chatbot_bp
    from routes.certificate import certificate_bp
    from routes.admin import admin_bp
    from routes.admin_advanced import admin_advanced_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    app.register_blueprint(resume_interview_bp, url_prefix='/api/resume-interview')
    app.register_blueprint(certificate_bp)
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(admin_advanced_bp, url_prefix='/api/admin')

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
        """Basic health check endpoint."""
        return jsonify({
            "status": "healthy",
            "environment": config_name,
            "database": "mongodb"
        }), 200

    # Favicon support without 404 logs
    @app.route('/favicon.ico')
    def favicon():
        fav_path = os.path.join(app.static_folder, 'favicon.ico')
        if os.path.exists(fav_path):
            return send_from_directory(app.static_folder, 'favicon.ico')
        return '', 204

    # Logout mappings to prevent 404 logs
    @app.route('/logout', methods=['GET', 'POST'])
    @app.route('/api/logout', methods=['GET', 'POST'])
    @app.route('/api/auth/logout', methods=['GET', 'POST'])
    def auth_logout_redirect():
        return jsonify({"success": True, "message": "Logout successful"}), 200

    # Specific common SPA route redirects
    @app.route('/login', methods=['GET'])
    @app.route('/register', methods=['GET'])
    @app.route('/dashboard', methods=['GET'])
    @app.route('/admin', methods=['GET'])
    def spa_redirect():
        return render_template('index.html')

    # Serve the frontend SPA for any non-API route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        """Serve the frontend single-page application."""
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return render_template('index.html')

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        _log_error(f"404 Error: {request.url}")
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        _log_error(f"405 Error: {request.method} {request.url}")
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(error):
        _log_error(f"500 Error: {traceback.format_exc()}")
        return jsonify({"error": "An internal error occurred", "details": str(error)}), 500

    return app


def parse_args():
    """Safely parses command-line arguments."""
    parser = argparse.ArgumentParser(description="Secure Flask Application Runner")
    parser.add_argument(
        "--mode",
        type=str,
        choices=["dev", "prod"],
        default="dev",
        help="Run mode: 'dev' for local testing or 'prod' for secure deployment."
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PORT", 8000)),
        help="Port to run the application on (default: $PORT or 8000)."
    )
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    print(f"[*] Starting application in {args.mode.upper()} mode on port {args.port}...")
    app = create_app(config_name=args.mode)

    if args.mode == "dev":
        print("[!] Running Flask built-in server (Not for Production).")
        app.run(host="127.0.0.1", port=args.port, debug=True)
    elif args.mode == "prod":
        print("[*] Running secure WSGI Waitress server.")
        serve(app, host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    main()
