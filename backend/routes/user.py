from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, InterviewSession, RoundResult, DSAProblem, LearningRecommendation
from services.ml_prediction import predict_job_readiness

user_bp = Blueprint('user', __name__)


@user_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get active session
    active_session = InterviewSession.objects(user_id=user_id).order_by('-created_at').first()

    current_round = active_session.current_round if active_session else 1
    session_status = active_session.status if active_session else "not_started"
    attempts_remaining = max(0, 2 - (active_session.attempt_count if active_session else 0))

    # Get weak topics from learning recommendations
    recs = LearningRecommendation.objects(user_id=user_id).order_by('-created_at').limit(3)
    weak_topics = [rec.topic for rec in recs]

    # Daily DSA problem
    dsa = DSAProblem.objects.first()
    daily_dsa = None
    if dsa:
        daily_dsa = {
            "id": str(dsa.id),
            "title": dsa.title,
            "difficulty": dsa.difficulty,
            "description": dsa.description
        }

    # ML Job Readiness Prediction
    prediction_data = predict_job_readiness(
        tech_score=(user.tech_score_sum / max(1, user.tech_attempts)),
        hr_score=(user.hr_score_sum / max(1, user.hr_attempts)),
        aptitude_score=(user.aptitude_score_sum / max(1, user.aptitude_attempts)),
        dsa_solved=user.dsa_problems_solved,
        resume_score=0
    )

    from models import ResumeData
    latest_resume = ResumeData.objects(user_id=user_id).order_by('-created_at').first()
    if latest_resume and latest_resume.score:
        prediction_data = predict_job_readiness(
            tech_score=(user.tech_score_sum / max(1, user.tech_attempts)),
            hr_score=(user.hr_score_sum / max(1, user.hr_attempts)),
            aptitude_score=(user.aptitude_score_sum / max(1, user.aptitude_attempts)),
            dsa_solved=user.dsa_problems_solved,
            resume_score=latest_resume.score
        )

    # Fetch achievements
    from models import Achievement
    achievements = Achievement.objects(user_id=user_id)

    dashboard_data = {
        "msg": "Dashboard data loaded",
        "readiness_score": user.readiness_score,
        "job_readiness_score": user.job_readiness_score,
        "current_round": current_round,
        "session_status": session_status,
        "attempts_remaining": attempts_remaining,
        "weak_topics": weak_topics,
        "daily_dsa": daily_dsa,
        "email": user.email,
        "is_admin": user.is_admin,
        "total_interviews": user.total_interviews,
        "rounds_cleared": user.rounds_cleared,
        "failed_attempts": user.failed_attempts,
        "average_score": user.average_score,
        "achievements": [a.badge_name for a in achievements],
        "current_streak": user.current_streak,
        "max_streak": user.max_streak,
        "last_solved_date": user.last_solved_date.isoformat() if user.last_solved_date else None,
        "ml_job_prediction": prediction_data
    }

    return jsonify(dashboard_data), 200


@user_bp.route('/history', methods=['GET'])
@jwt_required()
def get_user_history():
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    sessions = InterviewSession.objects(user_id=user_id)
    session_ids = [str(s.id) for s in sessions]

    results = RoundResult.objects(session_id__in=session_ids).order_by('-timestamp')

    history = []
    for r in results:
        try:
            feedback = eval(r.feedback_json) if r.feedback_json else {}
        except Exception:
            feedback = {}

        history.append({
            "id": str(r.id),
            "round_type": r.round_type,
            "score": r.score,
            "date": r.timestamp.isoformat(),
            "status": "Pass" if r.score >= 70 else "Fail",
            "feedback_summary": feedback.get('recommendation', 'No feedback available')
        })

    return jsonify({"history": history}), 200


@user_bp.route('/analytics/performance', methods=['GET'])
@jwt_required()
def get_performance_analytics():
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tech_success = (user.tech_score_sum / user.tech_attempts) if user.tech_attempts > 0 else 0
    hr_success = (user.hr_score_sum / user.hr_attempts) if user.hr_attempts > 0 else 0
    aptitude_success = (user.aptitude_score_sum / user.aptitude_attempts) if user.aptitude_attempts > 0 else 0

    return jsonify({
        "success_rates": {
            "Technical Round": round(tech_success, 1),
            "HR Round": round(hr_success, 1),
            "Aptitude Test": round(aptitude_success, 1)
        },
        "overall_readiness": user.readiness_score
    }), 200


@user_bp.route('/analytics/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    top_users = User.objects.order_by('-job_readiness_score', '-rounds_cleared').limit(10)

    leaderboard = []
    for idx, u in enumerate(top_users):
        leaderboard.append({
            "rank": idx + 1,
            "username": u.username or f"User_{str(u.id)[-6:]}",
            "readiness_score": round(u.job_readiness_score if u.job_readiness_score > 0 else u.readiness_score, 1),
            "rounds_cleared": u.rounds_cleared
        })

    return jsonify({"leaderboard": leaderboard}), 200
