from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, InterviewSession
from app import _log_error


admin_bp = Blueprint('admin', __name__)


def is_admin(user_id):
    try:
        user = User.objects(id=user_id).first()
        return user and user.is_admin
    except Exception:
        return False


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    total_users = User.objects.count()
    total_sessions = InterviewSession.objects.count()
    active_sessions = InterviewSession.objects(status='in_progress').count()
    total_rounds_cleared = sum(u.rounds_cleared for u in User.objects.only('rounds_cleared'))

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

        users = User.objects.all()
        users_data = [{
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "readiness_score": user.readiness_score,
            "rounds_cleared": user.rounds_cleared,
            "total_interviews": user.total_interviews,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        } for user in users]

        return jsonify({"users": users_data}), 200
    except Exception as e:
        _log_error(f"Error in /users: {str(e)}", "error_log_admin.txt")
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

        session = InterviewSession.objects(user_id=user_id, status='in_progress', is_admin_test=True).first()
        if not session:
            session = InterviewSession(
                user_id=user_id,
                current_round=target_round,
                attempt_count=1,
                is_admin_test=True
            )
        else:
            session.current_round = target_round
            session.attempt_count = 1

        session.save()
        return jsonify({
            "message": f"Successfully bypassed to round {target_round}",
            "session_id": str(session.id),
            "round": target_round
        }), 200
    except Exception as e:
        _log_error(f"Error in /bypass-round: {str(e)}", "error_log_admin.txt")
        return jsonify({"error": str(e)}), 500
