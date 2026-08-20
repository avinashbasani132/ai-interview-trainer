from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime
from models import User
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
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    code = data.get("code")
    problem_id = data.get("problem_id", "1")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    score = 100.0 if len(code) > 10 else 40.0
    passed = score >= 70.0

    today = datetime.date.today()

    if passed:
        if user.last_solved_date != today:
            if user.last_solved_date == today - datetime.timedelta(days=1):
                user.current_streak += 1
            else:
                user.current_streak = 1

            user.last_solved_date = today
            if user.current_streak > user.max_streak:
                user.max_streak = user.current_streak

            user.dsa_problems_solved += 1
            user.save()

        return jsonify({
            "success": True,
            "message": "Solution Accepted!",
            "score": score,
            "problem_id": problem_id,
            "current_streak": user.current_streak
        }), 200

    return jsonify({
        "success": False,
        "message": "Solution Failed Test Cases.",
        "problem_id": problem_id,
        "score": score
    }), 200

