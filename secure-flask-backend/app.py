from flask import Flask, jsonify, render_template
from config import config_by_name
from models import db
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.dsa import dsa_bp


def create_app(config_name="dev"):
    """
    Application Factory Pattern.
    Creates and configures the Flask application cleanly without global state.
    """

    app = Flask(__name__)

    # Load configuration securely from the config dictionary
    app.config.from_object(config_by_name.get(config_name, config_by_name["dev"]))

    # Initialize Extensions
    CORS(app)
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    # Register Blueprints (Modular Routing)
    from routes.auth import auth_bp
    from routes.resume import resume_bp
    from routes.interview import interview_bp
    from routes.user import user_bp
    from routes.media import media_bp
    from routes.company import company_bp
    from routes.roadmap import roadmap_bp
    from routes.community import community_bp
    from routes.arena import arena_bp

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

    # Home page
    @app.route("/", methods=["GET"])
    def index():
        """Serves the Vanilla JS Single Page Application (SPA)."""
        return render_template("index.html")

    # Health check
    @app.route("/health", methods=["GET"])
    def health_check():
        """Basic health check endpoint ensuring the server is running securely."""
        return jsonify({
            "status": "healthy",
            "environment": config_name
        }), 200

    # Rounds page
    @app.route("/rounds")
    def rounds():
        return render_template("rounds.html")

    # Error handler
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "An internal error occurred"}), 500

    return app


# Start Flask server
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)