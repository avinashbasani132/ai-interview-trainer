from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime
from models import db, User, DSASubmission
from services.dsa_service import get_daily_problem

dsa_bp = Blueprint("dsa", __name__)

@dsa_bp.route("/daily", methods=["GET"])
def daily_problem():
    problem = get_daily_problem()
    return jsonify(problem)

@dsa_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_dsa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.json
    code = data.get("code")
    problem_id = data.get("problem_id", 1) # simple placeholder
    
    if not code:
        return jsonify({"error": "No code provided"}), 400

    # Mock evaluation for now
    score = 100.0 if len(code) > 10 else 40.0
    passed = score >= 70.0

    today = datetime.date.today()
    
    if passed:
        # Check streak logic
        if user.last_solved_date != today:
            if user.last_solved_date == today - datetime.timedelta(days=1):
                # Consecutive day
                user.current_streak += 1
            else:
                # Streak broken
                user.current_streak = 1
                
            user.last_solved_date = today
            if user.current_streak > user.max_streak:
                user.max_streak = user.current_streak
                
            user.dsa_problems_solved += 1
            db.session.commit()

        return jsonify({
            "success": True, 
            "message": "Solution Accepted!", 
            "score": score,
            "current_streak": user.current_streak
        }), 200
        
    return jsonify({
        "success": False, 
        "message": "Solution Failed Test Cases.", 
        "score": score
    }), 200
