from flask import Blueprint, request, jsonify
from models import db, InterviewSession, RoundResult, User
from services.ai_service import ai_service
from flask_jwt_extended import jwt_required, get_jwt_identity

interview_bp = Blueprint('interview', __name__)

MAX_ATTEMPTS = 2

@interview_bp.route('/start', methods=['POST'])
@jwt_required()
def start_interview():
    """Initializes a new interview session starting at Round 1"""
    user_id = get_jwt_identity()
    
    try:
        new_session = InterviewSession(user_id=user_id, current_round=1, attempt_count=1)
        db.session.add(new_session)
        db.session.commit()
        return jsonify({"message": "Interview started", "session_id": new_session.id, "round": 1}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to start interview"}), 500

@interview_bp.route('/evaluate', methods=['POST'])
@jwt_required()
def evaluate_round():
    """Evaluates the round utilizing AI, checking eliminate protocols."""
    data = request.get_json()
    user_id = get_jwt_identity()
    session_id = data.get('session_id')
    question = data.get('question', '')
    user_answer = data.get('answer', '')
    
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    if session.status != 'in_progress':
        return jsonify({"error": f"Session is {session.status}"}), 400

    round_types = {1: "MCQ Screening", 2: "Technical AI", 3: "Coding", 4: "HR"}
    round_name = round_types.get(session.current_round, "Unknown")
    
    # 1. Ask Gemini to evaluate the answer
    evaluation = ai_service.evaluate_answer(question, user_answer, round_name)
    score = evaluation.get("score", 0)

    # 2. Record the result
    result = RoundResult(
        session_id=session.id,
        round_type=round_name,
        score=score,
        feedback_json=str(evaluation)
    )
    db.session.add(result)

    # 3. Elimination and Progression Logic
    if score >= 70:
        # Pass
        if session.current_round >= 4:
            session.status = 'completed'
        else:
            session.current_round += 1
            session.attempt_count = 1
    else:
        # Fail
        session.attempt_count += 1
        if session.attempt_count > MAX_ATTEMPTS:
            # Failed twice -> Back to Round 1!
            if session.current_round > 1:
                session.current_round = 1
                session.attempt_count = 1
            else:
                session.status = 'failed'

    # Update global user readiness score randomly based on progress for now
    user = User.query.get(user_id)
    if user:
        user.readiness_score = (user.readiness_score + score) / 2

    # 4. Commit everything
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
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
    """ Handles dynamic conversation interview logic for 5-10 questions in a session. """
    data = request.get_json()
    user_id = get_jwt_identity()
    session_id = data.get('session_id')
    current_question = data.get('question', '')
    user_answer = data.get('answer', '')
    context = data.get('context', []) # e.g. [{"role": "Interviewer", "content": "Tell me about..."}]
    question_count = data.get('question_count', 1) 
    
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    try:
        # Evaluate current answer
        round_types = {1: "MCQ Screening", 2: "Technical AI", 3: "Coding", 4: "HR"}
        round_name = round_types.get(session.current_round, "Unknown")
        
        evaluation = ai_service.evaluate_answer(current_question, user_answer, round_name)
        
        # Save result
        result = RoundResult(
            session_id=session.id,
            round_type=f"{round_name} - Q{question_count}",
            score=evaluation.get("score", 0),
            feedback_json=str(evaluation)
        )
        db.session.add(result)
        db.session.commit()
        
        # Determine next step. Let's say max 5 questions per round
        is_complete = question_count >= 5
        
        next_question = None
        if not is_complete:
            # Generate the next intelligent follow-up
            context.append({"role": "user", "content": user_answer})
            followup_data = ai_service.generate_followup_question(current_question, user_answer, round_name, context)
            next_question = followup_data.get('followup_question', "Can you elaborate further?")
            
        else:
            # Progress Round if complete
            # Logic similar to evaluate_round but simplified for chat flow
            if session.current_round >= 4:
                session.status = 'completed'
            else:
                session.current_round += 1
            db.session.commit()
            
        return jsonify({
            "evaluation": evaluation,
            "next_question": next_question,
            "is_complete": is_complete,
            "round": session.current_round
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed conversational check: {str(e)}"}), 500

@interview_bp.route('/resume-interview', methods=['POST'])
@jwt_required()
def resume_interview():
    """Generates interview questions based on extracted resume skills"""
    data = request.get_json()
    skills = data.get('skills', [])
    
    if not skills:
        return jsonify({"error": "No skills provided to generate questions"}), 400
        
    skills_str = ", ".join(skills)
    
    try:
        # Use AI Service custom generator
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
    db.session.add(new_session)
    
    from models import AptitudeQuestion
    from sqlalchemy.sql.expression import func
    questions = AptitudeQuestion.query.order_by(func.random()).limit(25).all()
    q_list = [{
        "id": q.id,
        "topic": q.topic,
        "text": q.question_text,
        "options": {
            "A": q.option_a,
            "B": q.option_b,
            "C": q.option_c,
            "D": q.option_d,
        }
    } for q in questions]
    
    db.session.commit()
    
    return jsonify({
        "session_id": new_session.id,
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
    
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
         return jsonify({"error": "Session not found"}), 404
         
    from models import AptitudeQuestion
    correct = 0
    wrong = 0
    feedback_details = []
    
    for q_id_str, user_ans in answers.items():
        q_id = int(q_id_str)
        q = AptitudeQuestion.query.get(q_id)
        if not q: continue
        
        if q.correct_option.upper() == user_ans.upper():
            correct += 1
        else:
            wrong += 1
            if q.topic:
                feedback_details.append(q.topic)
            
    total_q = correct + wrong
    if total_q == 0:
         score = 0
    else:
         score = (correct / total_q) * 100
         
    feedback = "Good attempt. "
    if score >= 60:
         feedback += "Passed the Aptitude round! "
         session.current_round = 2
         session.attempt_count = 1
    else:
         feedback += "Failed the Aptitude round. Needs improvement "
         if feedback_details:
             import collections
             topics = [t for t, count in collections.Counter(feedback_details).most_common(2)]
             feedback += "especially in " + ", ".join(topics) + "."
         session.attempt_count += 1
         
    # Update user score
    user = User.query.get(user_id)
    if user:
        user.readiness_score = (user.readiness_score + score) / 2
        
    result = RoundResult(
         session_id=session.id,
         round_type="MCQ Screening",
         score=score,
         feedback_json=feedback
    )
    db.session.add(result)
    db.session.commit()
    
    return jsonify({
         "score": score,
         "correct": correct,
         "wrong": wrong,
         "total": len(answers),
         "feedback": feedback,
         "status": "PASS" if score >= 60 else "FAIL"
    }), 200
