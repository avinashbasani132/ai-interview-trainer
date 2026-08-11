import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, InterviewSession, RoundResult

admin_bp = Blueprint('admin', __name__)

def is_admin(user_id):
    try:
        user = User.query.get(int(user_id))
        return user and user.is_admin
    except (ValueError, TypeError):
        return False

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    total_users = User.query.count()
    total_sessions = InterviewSession.query.count()
    active_sessions = InterviewSession.query.filter_by(status='in_progress').count()
    total_rounds_cleared = db.session.query(db.func.sum(User.rounds_cleared)).scalar() or 0

    return jsonify({
        "total_users": total_users,
        "total_sessions": total_sessions,
        "active_sessions": active_sessions,
        "total_rounds_cleared": total_rounds_cleared
    }), 200

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        users = User.query.all()
        users_data = []
        for user in users:
            users_data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
                "readiness_score": user.readiness_score,
                "rounds_cleared": user.rounds_cleared,
                "total_interviews": user.total_interviews,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None
            })

        return jsonify({"users": users_data}), 200
    except Exception as e:
        with open("error_log_admin.txt", "a") as f:
            f.write(f"Error in /users: {str(e)}\n")
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/bypass-round', methods=['POST'])
@jwt_required()
def bypass_round():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        target_round = data.get('round', 1)

        # Create a new session specifically for testing this round, or update an existing one
        session = InterviewSession.query.filter_by(user_id=user_id, status='in_progress', is_admin_test=True).first()
        if not session:
            session = InterviewSession(user_id=user_id, current_round=target_round, attempt_count=1, is_admin_test=True) # type: ignore
            db.session.add(session)
        else:
            session.current_round = target_round
            session.attempt_count = 1
        
        db.session.commit()
        return jsonify({"message": f"Successfully bypassed to round {target_round}", "session_id": session.id, "round": target_round}), 200
    except Exception as e:
        db.session.rollback()
        with open("error_log_admin.txt", "a") as f:
            f.write(f"Error in /bypass-round: {str(e)}\n")
        return jsonify({"error": str(e)}), 500

