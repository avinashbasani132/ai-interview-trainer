import io
import json
import logging
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity


from models import ResumeInterviewSession, User, ResumeData
from services.docx_parser import extract_text
from services.ai_service import ai_service

logger = logging.getLogger(__name__)
resume_interview_bp = Blueprint('resume_interview', __name__)

ALLOWED_EXTENSIONS = {'.pdf', '.docx'}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def _safe_json_loads(val, default):
    try:
        return json.loads(val) if val else default
    except Exception:
        return default

# ─── API Routes ──────────────────────────────────────────────────────────────

@resume_interview_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume_for_interview():
    """
    Step 1: Upload resume, extract text, run profile extraction & decide difficulty,
    generate interview plan, start session.
    """
    user_id = get_jwt_identity()

    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided. Attach file with field name 'resume'."}), 400

    file = request.files['resume']
    filename = (file.filename or '').strip()

    if not filename:
        return jsonify({"error": "No file selected."}), 400

    # Sanitize filename
    filename = re.sub(r'[^\w\-_\. ]', '_', filename)
    filename_lower = filename.lower()
    ext = next((e for e in ALLOWED_EXTENSIONS if filename_lower.endswith(e)), None)
    if not ext:
        return jsonify({"error": "Invalid file type. Only .pdf and .docx files are accepted."}), 400

    file_bytes = file.read()

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return jsonify({"error": "File too large. Maximum allowed size is 10 MB."}), 400
    if len(file_bytes) < 50:
        return jsonify({"error": "File is empty or too small."}), 400

    try:
        # Extract raw text
        text = extract_text(io.BytesIO(file_bytes), filename)
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        return jsonify({"error": "Failed to read file. It may be corrupted or in an invalid format."}), 422

    if not text.strip() or len(text.strip()) < 30:
        return jsonify({"error": "Resume text is empty or too short."}), 422

    try:
        # Step 2: Extract structured profile & analysis using Gemini
        details = ai_service.extract_resume_details_for_interview(text)
        
        # Handle case where Gemini returns empty analysis
        if "analysis" not in details:
            details["analysis"] = {
                "score": 70,
                "strengths": ["Parsed skills profile"],
                "weaknesses": ["General experience profile"],
                "suggestions": ["Add more quantified metrics"]
            }
            
        difficulty = details.get("difficulty_level", "Easy")

        # Step 4: Generate tailored 5 main questions
        plan = ai_service.generate_resume_interview_plan(details)

        if not plan or len(plan) < 5:
            # Fallback plan
            plan = [
                "Could you walk me through the key projects and technologies mentioned in your resume?",
                "What was the most challenging technical problem you solved, and what architecture did you use?",
                "How did you test your applications, and what database decisions did you make?",
                "Explain your experience with the programming languages and frameworks listed on your resume.",
                "How do you handle team collaboration and project deployment in your previous roles?"
            ]

        # Step 5: Start AI Interview Session
        new_session = ResumeInterviewSession(
            user_id=user_id,
            resume_name=filename,
            extracted_details=json.dumps(details),
            analysis_json=json.dumps(details["analysis"]),
            plan_json=json.dumps(plan),
            difficulty_level=difficulty,
            current_question_idx=0,
            questions_asked=json.dumps([plan[0]]),  # Seed first question
            answers_submitted=json.dumps([]),
            scores_per_question=json.dumps([]),
            status='in_progress'
        )
        new_session.save()

        return jsonify({
            "session_id": str(new_session.id),
            "resume_name": filename,
            "difficulty": difficulty,
            "experience_level": details.get("experience_level", "Fresh Graduate"),
            "details": details,
            "plan": plan,
            "first_question": plan[0]
        }), 201

    except Exception as e:
        logger.error(f"Failed to start resume interview: {e}")
        return jsonify({"error": "Failed to generate interview plan. Please try again."}), 500


@resume_interview_bp.route('/select-existing', methods=['POST'])
@jwt_required()
def start_interview_with_existing_resume():
    """
    Start a new interview session using an already uploaded resume from user history.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    resume_id = data.get('resume_id')

    if not resume_id:
        return jsonify({"error": "Missing resume_id"}), 400

    resume = ResumeData.objects(id=resume_id, user_id=user_id).first()
    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    try:
        # Extract text & generate plan
        text = resume.extracted_text
        details = ai_service.extract_resume_details_for_interview(text)
        difficulty = details.get("difficulty_level", "Easy")
        plan = ai_service.generate_resume_interview_plan(details)

        new_session = ResumeInterviewSession(
            user_id=user_id,
            resume_name=resume.filename or "resume.pdf",
            extracted_details=json.dumps(details),
            analysis_json=json.dumps(details.get("analysis", {})),
            plan_json=json.dumps(plan),
            difficulty_level=difficulty,
            current_question_idx=0,
            questions_asked=json.dumps([plan[0]]),
            answers_submitted=json.dumps([]),
            scores_per_question=json.dumps([]),
            status='in_progress'
        )
        new_session.save()

        return jsonify({
            "session_id": str(new_session.id),
            "resume_name": resume.filename,
            "difficulty": difficulty,
            "experience_level": details.get("experience_level", "Fresh Graduate"),
            "details": details,
            "plan": plan,
            "first_question": plan[0]
        }), 201

    except Exception as e:
        logger.error(f"Failed to start existing resume interview: {e}")
        return jsonify({"error": "Failed to create session with selected resume."}), 500


@resume_interview_bp.route('/session/<string:session_id>', methods=['GET'])
@jwt_required()
def get_session_state(session_id):
    user_id = get_jwt_identity()
    session = ResumeInterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({
        "id": str(session.id),
        "resume_name": session.resume_name,
        "difficulty": session.difficulty_level,
        "current_question_idx": session.current_question_idx,
        "questions_asked": _safe_json_loads(session.questions_asked, []),
        "answers_submitted": _safe_json_loads(session.answers_submitted, []),
        "scores_per_question": _safe_json_loads(session.scores_per_question, []),
        "status": session.status,
        "created_at": session.created_at.isoformat()
    }), 200


@resume_interview_bp.route('/session/<string:session_id>/submit-answer', methods=['POST'])
@jwt_required()
def submit_answer(session_id):
    """
    Submits answer, evaluates it, and generates either a follow-up question
    or progresses to the next main question.
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    answer = data.get('answer', '').strip()

    if not answer:
        return jsonify({"error": "Answer cannot be empty."}), 400

    session = ResumeInterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session.status != 'in_progress':
        return jsonify({"error": "Session is already completed."}), 400

    try:
        # Load arrays
        questions = _safe_json_loads(session.questions_asked, [])
        answers = _safe_json_loads(session.answers_submitted, [])
        scores = _safe_json_loads(session.scores_per_question, [])
        plan = _safe_json_loads(session.plan_json, [])
        details = _safe_json_loads(session.extracted_details, {})

        current_q = questions[-1]  # The question being answered

        # Evaluate answer via Gemini
        evaluation = ai_service.evaluate_resume_answer(current_q, answer, details)
        
        # Save response and evaluation
        answers.append(answer)
        scores.append(evaluation)
        
        session.answers_submitted = json.dumps(answers)
        session.scores_per_question = json.dumps(scores)

        # Check if we should ask a follow-up or move to next main question
        # Flow: Main question -> Follow-up -> Next main question
        total_questions_asked = len(questions)

        is_complete = False
        next_q = None
        followup_triggered = False

        if total_questions_asked == (2 * session.current_question_idx + 1):
            # This was a main question, so generate a follow-up question
            followup_triggered = True
            
            # Prepare conversation history context
            context = []
            for i in range(len(answers)):
                context.append({"role": "user", "content": answers[i]})
                if i < len(questions) - 1:
                    context.append({"role": "assistant", "content": questions[i]})

            followup_data = ai_service.generate_followup_for_answer(current_q, answer, context, details)
            next_q = followup_data.get("followup_question", "Could you elaborate more on how that was configured?")
            questions.append(next_q)
            session.questions_asked = json.dumps(questions)
        else:
            # This was a follow-up question, move to the next main question in plan
            session.current_question_idx += 1
            if session.current_question_idx < 5:
                next_q = plan[session.current_question_idx]
                questions.append(next_q)
                session.questions_asked = json.dumps(questions)
            else:
                is_complete = True

        session.save()

        return jsonify({
            "evaluation": evaluation,
            "next_question": next_q,
            "followup_triggered": followup_triggered,
            "current_question_idx": session.current_question_idx,
            "is_complete": is_complete
        }), 200

    except Exception as e:
        logger.error(f"Answer submission failed: {e}")
        return jsonify({"error": "Failed to process answer evaluation."}), 500


@resume_interview_bp.route('/session/<string:session_id>/hint', methods=['GET'])
@jwt_required()
def get_hint(session_id):
    """
    Generates a subtle, guiding hint for the current question without giving away the full answer.
    """
    user_id = get_jwt_identity()
    session = ResumeInterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        questions = _safe_json_loads(session.questions_asked, [])
        details = _safe_json_loads(session.extracted_details, {})
        current_q = questions[-1]

        hint = ai_service.generate_hint_for_question(current_q, details)
        return jsonify({"hint": hint}), 200
    except Exception as e:
        logger.error(f"Hint generation failed: {e}")
        return jsonify({"hint": "Try describing your experience or project implementation step-by-step."}), 200


@resume_interview_bp.route('/session/<string:session_id>/complete', methods=['POST'])
@jwt_required()
def complete_interview(session_id):
    """
    Finalizes the interview, aggregates scores, defines strong/weak areas, and records suggestions.
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    duration = data.get('duration_seconds', 0)

    session = ResumeInterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        scores = _safe_json_loads(session.scores_per_question, [])

        if not scores:
            return jsonify({"error": "No answers evaluated yet."}), 400

        # Aggregate scores
        overall_sum = sum(s.get('score', 0) for s in scores)
        tech_sum = sum(s.get('technical_accuracy', 0) for s in scores)
        comm_sum = sum(s.get('communication', 0) for s in scores)
        conf_sum = sum(s.get('confidence', 0) for s in scores)
        prob_sum = sum(s.get('problem_solving', 0) for s in scores)
        prac_sum = sum(s.get('practical_knowledge', 0) for s in scores)

        n = len(scores)
        session.overall_score = overall_sum / n
        session.technical_score = tech_sum / n
        session.communication_score = comm_sum / n
        session.confidence_score = conf_sum / n
        session.project_knowledge_score = prob_sum / n
        session.coding_readiness_score = prac_sum / n
        session.duration_seconds = duration
        session.status = 'completed'

        # Analyze strengths and weaknesses dynamically from per-question feedback
        all_strengths = []
        all_weaknesses = []
        all_recommendations = []

        for s in scores:
            all_strengths.extend(s.get('strengths', []))
            all_weaknesses.extend(s.get('weaknesses', []))
            rec = s.get('recommendation')
            if rec:
                all_recommendations.append(rec)

        # Deduplicate
        session.strong_areas = json.dumps(list(set(all_strengths))[:5])
        session.weak_areas = json.dumps(list(set(all_weaknesses))[:5])
        session.improvement_suggestions = json.dumps(list(set(all_recommendations))[:5])

        session.save()

        # Update global user readiness score
        user = User.objects(id=user_id).first()
        if user:
            user.readiness_score = (user.readiness_score + session.overall_score) / 2
            user.save()

        return jsonify({
            "message": "Interview completed successfully",
            "overall_score": session.overall_score,
            "technical_score": session.technical_score,
            "communication_score": session.communication_score,
            "confidence_score": session.confidence_score,
            "project_knowledge": session.project_knowledge_score,
            "coding_readiness": session.coding_readiness_score,
            "strong_areas": json.loads(session.strong_areas),
            "weak_areas": json.loads(session.weak_areas),
            "suggestions": json.loads(session.improvement_suggestions)
        }), 200

    except Exception as e:
        logger.error(f"Session completion failed: {e}")
        return jsonify({"error": "Failed to complete interview session."}), 500


@resume_interview_bp.route('/history', methods=['GET'])
@jwt_required()
def get_interview_history():
    """
    Returns list of all past resume-based interview sessions for the logged-in user.
    """
    user_id = get_jwt_identity()
    sessions = ResumeInterviewSession.objects(user_id=user_id, status='completed').order_by('-created_at')

    history = [{
        "id": str(s.id),
        "resume_name": s.resume_name,
        "difficulty": s.difficulty_level,
        "overall_score": s.overall_score,
        "status": s.status,
        "date": s.created_at.isoformat(),
        "duration_seconds": s.duration_seconds
    } for s in sessions]

    return jsonify({"history": history}), 200


@resume_interview_bp.route('/report/<string:session_id>', methods=['GET'])
@jwt_required()
def get_interview_report(session_id):
    """
    Returns detailed feedback report of a completed resume-based interview session.
    """
    user_id = get_jwt_identity()
    session = ResumeInterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({
        "id": str(session.id),
        "resume_name": session.resume_name,
        "difficulty": session.difficulty_level,
        "overall_score": session.overall_score,
        "technical_score": session.technical_score,
        "communication_score": session.communication_score,
        "confidence_score": session.confidence_score,
        "project_knowledge": session.project_knowledge_score,
        "coding_readiness": session.coding_readiness_score,
        "duration_seconds": session.duration_seconds,
        "date": session.created_at.isoformat(),
        "strong_areas": _safe_json_loads(session.strong_areas, []),
        "weak_areas": _safe_json_loads(session.weak_areas, []),
        "suggestions": _safe_json_loads(session.improvement_suggestions, []),
        "questions": _safe_json_loads(session.questions_asked, []),
        "answers": _safe_json_loads(session.answers_submitted, []),
        "evaluations": _safe_json_loads(session.scores_per_question, [])
    }), 200
