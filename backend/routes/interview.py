import collections
from flask import Blueprint, request, jsonify
from models import InterviewSession, RoundResult, User
from services.ai_service import ai_service
from flask_jwt_extended import jwt_required, get_jwt_identity

interview_bp = Blueprint('interview', __name__)

MAX_ATTEMPTS = 2


@interview_bp.route('/start', methods=['POST'])
@jwt_required()
def start_interview():
    """Initializes a new interview session starting at Round 1."""
    user_id = get_jwt_identity()
    try:
        new_session = InterviewSession(user_id=user_id, current_round=1, attempt_count=1)
        new_session.save()
        return jsonify({"message": "Interview started", "session_id": str(new_session.id), "round": 1}), 201
    except Exception as e:
        return jsonify({"error": "Failed to start interview"}), 500


@interview_bp.route('/evaluate', methods=['POST'])
@jwt_required()
def evaluate_round():
    """Evaluates the round utilizing AI, checking elimination protocols."""
    data = request.get_json()
    user_id = get_jwt_identity()
    session_id = data.get('session_id')
    question = data.get('question', '')
    user_answer = data.get('answer', '')

    session = InterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    if session.status != 'in_progress':
        return jsonify({"error": f"Session is {session.status}"}), 400

    round_types = {1: "MCQ Screening", 2: "Technical AI", 3: "Coding", 4: "HR"}
    round_name = round_types.get(session.current_round, "Unknown")

    evaluation = ai_service.evaluate_answer(question, user_answer, round_name)
    score = evaluation.get("score", 0)

    RoundResult(
        session_id=str(session.id),
        round_type=round_name,
        score=score,
        feedback_json=str(evaluation)
    ).save()

    if score >= 70:
        if session.current_round >= 4:
            session.status = 'completed'
        else:
            session.current_round += 1
            session.attempt_count = 1
    else:
        session.attempt_count += 1
        if session.attempt_count > MAX_ATTEMPTS:
            if session.current_round > 1:
                session.current_round = 1
                session.attempt_count = 1
            else:
                session.status = 'failed'

    user = User.objects(id=user_id).first()
    if user:
        user.readiness_score = (user.readiness_score + score) / 2
        user.save()

    try:
        session.save()
    except Exception as e:
        return jsonify({"error": "Database error saving result"}), 500

    return jsonify({
        "evaluation": evaluation,
        "next_round": session.current_round,
        "attempts": session.attempt_count,
        "status": session.status,
    }), 200


@interview_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat_interview():
    """Handles dynamic conversation interview logic for 5-10 questions in a session."""
    data = request.get_json()
    user_id = get_jwt_identity()
    session_id = data.get('session_id')
    current_question = data.get('question', '')
    user_answer = data.get('answer', '')
    context = data.get('context', [])
    question_count = data.get('question_count', 1)

    session = InterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        round_types = {1: "MCQ Screening", 2: "Technical AI", 3: "Coding", 4: "HR"}
        round_name = round_types.get(session.current_round, "Unknown")

        evaluation = ai_service.evaluate_answer(current_question, user_answer, round_name)

        RoundResult(
            session_id=str(session.id),
            round_type=f"{round_name} - Q{question_count}",
            score=evaluation.get("score", 0),
            feedback_json=str(evaluation)
        ).save()

        is_complete = question_count >= 5

        next_question = None
        if not is_complete:
            context.append({"role": "user", "content": user_answer})
            followup_data = ai_service.generate_followup_question(current_question, user_answer, round_name, context)
            next_question = followup_data.get('followup_question', "Can you elaborate further?")
        else:
            if session.current_round >= 4:
                session.status = 'completed'
            else:
                session.current_round += 1
            session.save()

        return jsonify({
            "evaluation": evaluation,
            "next_question": next_question,
            "is_complete": is_complete,
            "round": session.current_round
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed conversational check: {str(e)}"}), 500


@interview_bp.route('/resume-interview', methods=['POST'])
@jwt_required()
def resume_interview():
    """Generates interview questions based on extracted resume skills."""
    data = request.get_json()
    skills = data.get('skills', [])

    if not skills:
        skills = ["Software Engineering", "Core CS Fundamentals", "System Design"]

    skills_str = ", ".join(skills)

    try:
        questions = ai_service.generate_resume_questions(skills_str, count=6)
        return jsonify({"questions": questions}), 200
    except Exception as e:
        return jsonify({"questions": [
            f"Explain your experience with {skills[0] if skills else 'your listed technologies'}.",
            "Can you describe a challenging project you built?",
            "How do you stay updated with new technologies?"
        ]}), 200


@interview_bp.route('/aptitude/start', methods=['POST'])
@jwt_required()
def start_aptitude():
    user_id = get_jwt_identity()
    new_session = InterviewSession(user_id=user_id, current_round=1, attempt_count=1)
    new_session.save()

    from models import AptitudeQuestion
    # MongoDB: use aggregate sample for random ordering
    import random
    all_questions = list(AptitudeQuestion.objects.all())
    questions = random.sample(all_questions, min(25, len(all_questions)))

    q_list = [{
        "id": str(q.id),
        "topic": q.topic,
        "text": q.question_text,
        "options": {
            "A": q.option_a,
            "B": q.option_b,
            "C": q.option_c,
            "D": q.option_d,
        }
    } for q in questions]

    return jsonify({
        "session_id": str(new_session.id),
        "questions": q_list,
        "duration_minutes": 30
    }), 200


@interview_bp.route('/aptitude/submit', methods=['POST'])
@jwt_required()
def submit_aptitude():
    data = request.get_json()
    user_id = get_jwt_identity()
    session_id = data.get('session_id')
    answers = data.get('answers', {})

    session = InterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    from models import AptitudeQuestion
    correct = 0
    wrong = 0
    feedback_details = []

    for q_id_str, user_ans in answers.items():
        q = AptitudeQuestion.objects(id=q_id_str).first()
        if not q:
            continue
        if q.correct_option.upper() == user_ans.upper():
            correct += 1
        else:
            wrong += 1
            if q.topic:
                feedback_details.append(q.topic)

    total_q = correct + wrong
    score = (correct / total_q * 100) if total_q > 0 else 0

    feedback = "Good attempt. "
    if score >= 60:
        feedback += "Passed the Aptitude round! "
        session.current_round = 2
        session.attempt_count = 1
    else:
        feedback += "Failed the Aptitude round. Needs improvement "
        if feedback_details:
            topics = [t for t, _ in collections.Counter(feedback_details).most_common(2)]
            feedback += "especially in " + ", ".join(topics) + "."
        session.attempt_count += 1

    user = User.objects(id=user_id).first()
    if user:
        user.readiness_score = (user.readiness_score + score) / 2
        user.save()

    RoundResult(
        session_id=str(session.id),
        round_type="MCQ Screening",
        score=score,
        feedback_json=feedback
    ).save()
    session.save()

    return jsonify({
        "score": score,
        "correct": correct,
        "wrong": wrong,
        "total": len(answers),
        "feedback": feedback,
        "status": "PASS" if score >= 60 else "FAIL"
    }), 200
