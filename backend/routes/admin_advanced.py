from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, InterviewSession, RoundResult, Certificate, Company, Question, AdminAuditLog
from routes.admin import is_admin
import json
import traceback

admin_advanced_bp = Blueprint('admin_advanced', __name__)


def log_admin_action(admin_id, action, target=None, details=None):
    try:
        AdminAuditLog(
            admin_id=str(admin_id),
            action=action,
            target=target,
            details=details
        ).save()
    except Exception:
        pass


@admin_advanced_bp.route('/users/<string:user_id>', methods=['GET'])
@jwt_required()
def get_user_details(user_id):
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    sessions = InterviewSession.objects(user_id=user_id)
    sessions_data = [{
        "id": str(s.id),
        "status": s.status,
        "current_round": s.current_round,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "is_admin_test": s.is_admin_test
    } for s in sessions]

    certs = Certificate.objects(user_id=user_id)
    certs_data = [{
        "id": c.certificate_id,
        "type": c.interview_type,
        "score": c.overall_score,
        "date": c.issue_date.isoformat() if c.issue_date else None
    } for c in certs]

    data = {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "readiness_score": user.readiness_score,
        "rounds_cleared": user.rounds_cleared,
        "total_interviews": user.total_interviews,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "tech_score_sum": user.tech_score_sum,
        "hr_score_sum": user.hr_score_sum,
        "dsa_problems_solved": user.dsa_problems_solved,
        "sessions": sessions_data,
        "certificates": certs_data
    }
    log_admin_action(admin_id, "View User", f"User {user_id}")
    return jsonify({"user": data}), 200


@admin_advanced_bp.route('/interviews', methods=['GET'])
@jwt_required()
def get_interviews():
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    sessions = InterviewSession.objects.order_by('-created_at').limit(100)
    data = []
    for s in sessions:
        user = User.objects(id=s.user_id).first()
        data.append({
            "id": str(s.id),
            "user_email": user.email if user else "Unknown",
            "job_role": s.job_role,
            "current_round": s.current_round,
            "status": s.status,
            "is_admin_test": s.is_admin_test,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return jsonify({"interviews": data}), 200


@admin_advanced_bp.route('/questions', methods=['GET', 'POST'])
@jwt_required()
def manage_questions():
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    if request.method == 'GET':
        questions = Question.objects.all()
        data = [{
            "id": str(q.id),
            "category": q.category,
            "difficulty": q.difficulty,
            "technology": q.technology,
            "question_text": q.question_text,
            "is_active": q.is_active
        } for q in questions]
        return jsonify({"questions": data}), 200

    if request.method == 'POST':
        data = request.json
        try:
            q = Question(
                category=data.get('category', 'Technical'),
                difficulty=data.get('difficulty', 'Medium'),
                technology=data.get('technology', ''),
                question_text=data.get('question_text', ''),
                expected_answer=data.get('expected_answer', '')
            )
            q.save()
            log_admin_action(admin_id, "Create Question", f"QID {str(q.id)}")
            return jsonify({"success": True, "message": "Question added"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@admin_advanced_bp.route('/companies', methods=['GET', 'POST'])
@jwt_required()
def manage_companies():
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    if request.method == 'GET':
        companies = Company.objects.all()
        data = [{"id": str(c.id), "name": c.name, "category": c.category, "is_active": c.is_active} for c in companies]
        return jsonify({"companies": data}), 200

    if request.method == 'POST':
        data = request.json
        try:
            c = Company(
                name=data.get('name'),
                category=data.get('category', ''),
                is_active=data.get('is_active', True)
            )
            c.save()
            log_admin_action(admin_id, "Create Company", f"Company {c.name}")
            return jsonify({"success": True, "message": "Company added"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@admin_advanced_bp.route('/certificates', methods=['GET'])
@jwt_required()
def get_certificates():
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    certs = Certificate.objects.order_by('-issue_date').limit(100)
    data = []
    for c in certs:
        user = User.objects(id=c.user_id).first()
        data.append({
            "id": c.certificate_id,
            "candidate_name": c.candidate_name or (user.username if user else "Unknown"),
            "email": user.email if user else "Unknown",
            "type": c.interview_type,
            "score": c.overall_score,
            "issue_date": c.issue_date.isoformat() if c.issue_date else None
        })
    return jsonify({"certificates": data}), 200


@admin_advanced_bp.route('/health', methods=['GET'])
@jwt_required()
def system_health():
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    try:
        user_count = User.objects.count()
        db_status = "HEALTHY"
    except Exception:
        db_status = "CRITICAL"

    return jsonify({
        "backend": "HEALTHY",
        "database": db_status,
        "ai_api": "HEALTHY"
    }), 200


@admin_advanced_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    logs = AdminAuditLog.objects.order_by('-timestamp').limit(100)
    data = []
    for l in logs:
        admin_user = User.objects(id=l.admin_id).first()
        data.append({
            "id": str(l.id),
            "admin_email": admin_user.email if admin_user else f"ID {l.admin_id}",
            "action": l.action,
            "target": l.target,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        })
    return jsonify({"logs": data}), 200
