import json
import collections
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Company, InterviewSession, RoundResult, InterviewQuestion, DSAProblem, User
from services.ai_service import ai_service

company_bp = Blueprint('company', __name__)


@company_bp.route('/list', methods=['GET'])
@jwt_required()
def list_companies():
    """List all supported companies with full layout metadata."""
    companies = Company.objects.all()
    res = []
    for c in companies:
        rounds_list = []
        if c.rounds_list:
            try:
                rounds_list = json.loads(c.rounds_list)
            except Exception:
                pass
        res.append({
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "logo_url": c.logo_url,
            "category": c.category,
            "hiring_type": c.hiring_type,
            "difficulty": c.difficulty,
            "duration": c.duration,
            "rounds": rounds_list
        })
    return jsonify({"companies": res}), 200


@company_bp.route('/start', methods=['POST'])
@jwt_required()
def start_company_interview():
    """Starts a company-specific 5-round interview session."""
    user_id = get_jwt_identity()
    data = request.json or {}
    company_id = data.get("company_id")
    job_role = data.get("job_role", "Software Engineer")
    difficulty = data.get("difficulty", "Medium")

    if not company_id:
        return jsonify({"error": "Company ID required"}), 400

    company = Company.objects(id=company_id).first()
    if not company:
        return jsonify({"error": "Company not found"}), 404

    try:
        # Cancel active in_progress sessions for this company
        for s in InterviewSession.objects(user_id=user_id, company_id=company_id, status='in_progress'):
            s.status = 'failed'
            s.save()

        new_session = InterviewSession(
            user_id=user_id,
            company_id=company_id,
            current_round=1,
            attempt_count=1,
            job_role=job_role,
            difficulty=difficulty
        )
        new_session.save()
        return jsonify({
            "message": f"Started {company.name} interview",
            "session_id": str(new_session.id),
            "round": 1
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@company_bp.route('/session/<string:session_id>/state', methods=['GET'])
@jwt_required()
def get_session_state(session_id):
    """Retrieves current progression state and company pattern."""
    user_id = get_jwt_identity()
    session = InterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    company = Company.objects(id=session.company_id).first() if session.company_id else None
    company_name = company.name if company else "General"
    logo_url = company.logo_url if company else None

    rounds_list = ["Aptitude", "Technical MCQ", "Coding", "Technical AI", "HR"]
    if company and company.rounds_list:
        try:
            rounds_list = json.loads(company.rounds_list)
        except Exception:
            pass

    return jsonify({
        "session_id": str(session.id),
        "company_name": company_name,
        "logo_url": logo_url,
        "current_round": session.current_round,
        "attempt_count": session.attempt_count,
        "status": session.status,
        "rounds_list": rounds_list
    }), 200


@company_bp.route('/session/<string:session_id>/round/<int:round_num>/questions', methods=['GET'])
@jwt_required()
def get_round_questions(session_id, round_num):
    """Generates or fetches company-specific round questions."""
    user_id = get_jwt_identity()
    session = InterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    company = Company.objects(id=session.company_id).first() if session.company_id else None
    if not company:
        return jsonify({"error": "This route is only for Company interviews"}), 400

    round_names = {1: "Aptitude", 2: "Technical MCQ", 3: "Coding", 4: "Technical AI", 5: "HR"}
    round_name = round_names.get(round_num, "Aptitude")

    existing_qs = list(InterviewQuestion.objects(session_id=str(session.id), round_type=round_name))
    if existing_qs:
        res_qs = []
        for q in existing_qs:
            opts = {}
            if q.options_json:
                try:
                    opts = json.loads(q.options_json)
                except Exception:
                    pass
            res_qs.append({
                "id": str(q.id),
                "topic": q.round_type,
                "question_text": q.question_text,
                "options": opts,
                "user_answer": q.user_answer
            })
        return jsonify({"questions": res_qs}), 200

    try:
        if round_num in [1, 2]:
            mcqs = ai_service.generate_company_mcqs(company.name, round_name, job_role=session.job_role, difficulty=session.difficulty)
            saved_qs = []
            for m in mcqs:
                opts = {
                    "A": m.get("option_a", ""),
                    "B": m.get("option_b", ""),
                    "C": m.get("option_c", ""),
                    "D": m.get("option_d", "")
                }
                q = InterviewQuestion(
                    session_id=str(session.id),
                    round_type=round_name,
                    question_text=m.get("question_text", ""),
                    options_json=json.dumps(opts),
                    ai_feedback=m.get("correct_option", "A")
                )
                q.save()
                saved_qs.append(q)

            return jsonify({"questions": [{
                "id": str(q.id),
                "topic": round_name,
                "question_text": q.question_text,
                "options": json.loads(q.options_json),
                "user_answer": None
            } for q in saved_qs]}), 200

        elif round_num == 3:
            prob = ai_service.generate_company_coding_problem(company.name, job_role=session.job_role, difficulty=session.difficulty)
            q = InterviewQuestion(
                session_id=str(session.id),
                round_type=round_name,
                question_text=prob.get("description", ""),
                options_json=json.dumps({
                    "title": prob.get("title", "DSA Problem"),
                    "difficulty": prob.get("difficulty", "Medium"),
                    "example_input": prob.get("example_input", ""),
                    "example_output": prob.get("example_output", "")
                })
            )
            q.save()
            return jsonify({"questions": [{
                "id": str(q.id),
                "topic": round_name,
                "question_text": q.question_text,
                "options": json.loads(q.options_json),
                "user_answer": None
            }]}), 200

        elif round_num in [4, 5]:
            question_text = ai_service.generate_company_first_question(company.name, round_name, session.job_role, session.difficulty)
            q = InterviewQuestion(
                session_id=str(session.id),
                round_type=round_name,
                question_text=question_text
            )
            q.save()
            return jsonify({"questions": [{
                "id": str(q.id),
                "topic": round_name,
                "question_text": q.question_text,
                "options": {},
                "user_answer": None
            }]}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to generate questions: {str(e)}"}), 500


@company_bp.route('/session/<string:session_id>/submit-answers', methods=['POST'])
@jwt_required()
def submit_company_round_answers(session_id):
    """Evaluates answers for the current company round and progresses status."""
    user_id = get_jwt_identity()
    data = request.json or {}
    answers = data.get("answers", {})

    session = InterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    company = Company.objects(id=session.company_id).first() if session.company_id else None
    if not company:
        return jsonify({"error": "Company not found"}), 404

    round_num = session.current_round
    round_names = {1: "Aptitude", 2: "Technical MCQ", 3: "Coding", 4: "Technical AI", 5: "HR"}
    round_name = round_names.get(round_num, "Aptitude")

    try:
        score = 0.0
        feedback = ""
        passed = False
        questions = list(InterviewQuestion.objects(session_id=str(session.id), round_type=round_name))

        if round_num in [1, 2]:
            correct = 0
            total = len(questions)
            feedback_details = []
            for q in questions:
                user_ans = answers.get(str(q.id)) or ""
                q.user_answer = user_ans
                correct_ans = q.ai_feedback or "A"
                if user_ans.upper() == correct_ans.upper():
                    correct += 1
                    q.score = 100.0
                else:
                    q.score = 0.0
                    feedback_details.append(q.question_text[:30])
                q.save()

            score = (correct / total * 100.0) if total > 0 else 0.0
            pass_threshold = 60.0 if round_num == 1 else 70.0
            passed = score >= pass_threshold
            feedback = f"Scored {score:.1f}% ({correct}/{total} correct)."
            if not passed and feedback_details:
                feedback += f" Gaps identified in: {', '.join(feedback_details[:2])}."

        elif round_num == 3:
            q = questions[0] if questions else None
            if q:
                user_code = answers.get(str(q.id)) or ""
                q.user_answer = user_code
                eval_res = ai_service.evaluate_answer(q.question_text, user_code, "Coding Arena")
                score = float(eval_res.get("score", 0))
                q.score = score
                q.ai_feedback = eval_res.get("feedback", "")
                q.save()
                feedback = eval_res.get("recommendation", "")
                passed = score >= 70.0

        elif round_num in [4, 5]:
            q = questions[-1] if questions else None
            if q:
                user_ans = answers.get(str(q.id)) or ""
                q.user_answer = user_ans
                context = []
                for q_prev in questions:
                    if q_prev.user_answer:
                        context.append({"role": "system", "content": q_prev.question_text})
                        context.append({"role": "user", "content": q_prev.user_answer})

                eval_res = ai_service.evaluate_company_conversational_answer(
                    company.name, round_name, q.question_text, user_ans,
                    context=context, job_role=session.job_role, difficulty=session.difficulty
                )
                score = float(eval_res.get("score", 0))
                q.score = score
                q.ai_feedback = eval_res.get("feedback", "")
                q.save()
                feedback = eval_res.get("recommendation", "")

                if len(questions) < 3:
                    followup_data = ai_service.generate_followup_question(q.question_text, user_ans, round_name, context)
                    next_q_text = followup_data.get('followup_question', "Can you explain that further?")
                    next_q = InterviewQuestion(
                        session_id=str(session.id),
                        round_type=round_name,
                        question_text=next_q_text
                    )
                    next_q.save()
                    return jsonify({
                        "score": score,
                        "passed": True,
                        "is_complete": False,
                        "next_question": {
                            "id": str(next_q.id),
                            "topic": round_name,
                            "question_text": next_q.question_text,
                            "options": {},
                            "user_answer": None
                        },
                        "feedback": feedback
                    }), 200
                else:
                    all_scores = [q_item.score for q_item in questions if q_item.score is not None]
                    if not all_scores:
                        all_scores = [score]
                    avg_score = sum(all_scores) / len(all_scores)
                    passed = avg_score >= 70.0
                    score = avg_score

        # Record round result
        RoundResult(
            session_id=str(session.id),
            round_type=round_name,
            score=score,
            feedback_json=json.dumps({"feedback": feedback, "passed": passed})
        ).save()

        # Progression logic
        if passed:
            if round_num >= 5:
                session.status = 'completed'
            else:
                session.current_round += 1
                session.attempt_count = 1
        else:
            session.attempt_count += 1
            if session.attempt_count > 2:
                session.current_round = 1
                session.attempt_count = 1
                session.status = 'failed'

        user = User.objects(id=user_id).first()
        if user:
            user.readiness_score = (user.readiness_score + score) / 2
            user.save()

        session.save()
        return jsonify({
            "score": score,
            "passed": passed,
            "is_complete": True,
            "next_round": session.current_round,
            "status": session.status,
            "feedback": feedback
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed submitting answer: {str(e)}"}), 500


@company_bp.route('/session/<string:session_id>/summary', methods=['GET'])
@jwt_required()
def get_company_interview_summary(session_id):
    """Synthesizes the complete hiring profile and logs metrics."""
    user_id = get_jwt_identity()
    session = InterviewSession.objects(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    company = Company.objects(id=session.company_id).first() if session.company_id else None
    if not company:
        return jsonify({"error": "This session is not a company placement interview"}), 400

    results = RoundResult.objects(session_id=str(session.id))
    results_list = [{
        "round_type": r.round_type,
        "score": r.score,
        "details": r.feedback_json
    } for r in results]

    try:
        summary = ai_service.generate_company_interview_summary(company.name, results_list)
        return jsonify({
            "company_name": company.name,
            "logo_url": company.logo_url,
            "summary": summary
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@company_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_company_stats():
    """Fetches user aggregated company placement metrics."""
    user_id = get_jwt_identity()

    sessions = list(InterviewSession.objects(user_id=user_id, company_id__ne=None))

    practiced_ids = list(set([s.company_id for s in sessions if s.company_id]))
    companies_practiced = len(practiced_ids)

    completed_sessions = [s for s in sessions if s.status == 'completed']
    completed_companies = len(set([s.company_id for s in completed_sessions if s.company_id]))

    best_score = 0.0
    scores_by_company = collections.defaultdict(list)

    for s in sessions:
        rr_scores = [r.score for r in RoundResult.objects(session_id=str(s.id))]
        if rr_scores:
            avg_score = sum(rr_scores) / len(rr_scores)
            scores_by_company[s.company_id].append(avg_score)
            if avg_score > best_score:
                best_score = avg_score

    latest_company = "N/A"
    latest_date = None
    latest_session = InterviewSession.objects(user_id=user_id, company_id__ne=None).order_by('-created_at').first()
    if latest_session:
        comp = Company.objects(id=latest_session.company_id).first()
        if comp:
            latest_company = comp.name
            latest_date = latest_session.created_at.strftime('%b %d, %Y')

    fav_company = "N/A"
    comp_counts = collections.Counter([s.company_id for s in sessions if s.company_id])
    if comp_counts:
        fav_id = comp_counts.most_common(1)[0][0]
        fav_comp_obj = Company.objects(id=fav_id).first()
        if fav_comp_obj:
            fav_company = fav_comp_obj.name

    return jsonify({
        "completed_companies": completed_companies,
        "best_score": round(best_score, 1),
        "latest_interview": f"{latest_company} ({latest_date})" if latest_date else "N/A",
        "companies_practiced": companies_practiced,
        "highest_company_score": round(best_score, 1),
        "favorite_company": fav_company
    }), 200
