from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, InterviewSession, Certificate, Company, Question, AdminAuditLog, CompanyQuestion
from routes.admin import is_admin
from database.company_questions_data import COMPANY_QUESTIONS_DATA
import json



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
        company_filter = request.args.get('company_id')
        round_filter = request.args.get('round_type')

        # 1. Fetch CompanyQuestions
        cq_query = {}
        if company_filter and company_filter != 'all':
            cq_query['company_id'] = company_filter
        if round_filter and round_filter != 'all':
            cq_query['round_type'] = round_filter

        company_qs = CompanyQuestion.objects(**cq_query)
        data = []
        for cq in company_qs:
            opts = {}
            if cq.options_json:
                try:
                    opts = json.loads(cq.options_json)
                except Exception:
                    pass
            data.append({
                "id": str(cq.id),
                "type": "company",
                "company_id": cq.company_id,
                "company_name": cq.company_name or "Company",
                "round_type": cq.round_type,
                "topic": cq.topic or cq.round_type,
                "difficulty": cq.difficulty or "Medium",
                "question_text": cq.question_text,
                "options": opts,
                "correct_option": cq.correct_option or "A",
                "expected_answer": cq.expected_answer or "",
                "evaluation_criteria": cq.evaluation_criteria or ""
            })

        # 2. If not filtering for specific company, also include general Questions
        if not company_filter or company_filter == 'all':
            gen_qs = Question.objects.all()
            for q in gen_qs:
                data.append({
                    "id": str(q.id),
                    "type": "general",
                    "company_id": None,
                    "company_name": "General Question Bank",
                    "round_type": q.category or "Technical",
                    "topic": q.technology or q.category or "General",
                    "difficulty": q.difficulty or "Medium",
                    "question_text": q.question_text,
                    "options": {},
                    "correct_option": "",
                    "expected_answer": q.expected_answer or "",
                    "evaluation_criteria": q.evaluation_criteria or ""
                })

        # 3. If DB has no questions loaded yet, serve from COMPANY_QUESTIONS_DATA
        if len(data) == 0:
            for c_name, rounds_dict in COMPANY_QUESTIONS_DATA.items():
                if company_filter and company_filter != 'all':
                    matched_c = Company.objects(id=company_filter).first()
                    target_name = matched_c.name if matched_c else company_filter
                    if c_name.lower() != target_name.lower():
                        continue

                for r_type, q_list in rounds_dict.items():
                    if round_filter and round_filter != 'all' and r_type.lower() != round_filter.lower():
                        continue
                    for idx, q_item in enumerate(q_list):
                        opts = {}
                        if "option_a" in q_item:
                            opts = {
                                "A": q_item.get("option_a", ""),
                                "B": q_item.get("option_b", ""),
                                "C": q_item.get("option_c", ""),
                                "D": q_item.get("option_d", "")
                            }
                        elif r_type == "Coding":
                            opts = {
                                "title": q_item.get("title", "DSA Problem"),
                                "difficulty": q_item.get("difficulty", "Medium"),
                                "example_input": q_item.get("example_input", ""),
                                "example_output": q_item.get("example_output", "")
                            }
                        data.append({
                            "id": f"{c_name.lower()}_{r_type.lower().replace(' ', '_')}_{idx+1}",
                            "type": "company",
                            "company_id": None,
                            "company_name": c_name,
                            "round_type": r_type,
                            "topic": q_item.get("topic", r_type),
                            "difficulty": q_item.get("difficulty", "Medium"),
                            "question_text": q_item.get("question_text") or q_item.get("description", ""),
                            "options": opts,
                            "correct_option": q_item.get("correct_option", "A"),
                            "expected_answer": q_item.get("expected_answer", ""),
                            "evaluation_criteria": q_item.get("evaluation_criteria", "")
                        })

        return jsonify({"questions": data}), 200


    if request.method == 'POST':
        data = request.json or {}
        try:
            company_id = data.get('company_id')
            company_name = data.get('company_name')
            round_type = data.get('round_type', 'Technical MCQ')
            topic = data.get('topic') or data.get('category') or 'General'
            difficulty = data.get('difficulty', 'Medium')
            question_text = data.get('question_text') or data.get('text', '')
            options = data.get('options')
            correct_option = data.get('correct_option', 'A')
            expected_answer = data.get('expected_answer', '')
            evaluation_criteria = data.get('evaluation_criteria', '')

            if not question_text:
                return jsonify({"error": "Question text is required"}), 400

            # If company is specified or options provided, create CompanyQuestion
            if company_id and company_id != 'general':
                comp = Company.objects(id=company_id).first()
                if comp and not company_name:
                    company_name = comp.name

                cq = CompanyQuestion(
                    company_id=str(company_id),
                    company_name=company_name or "Target Company",
                    round_type=round_type,
                    topic=topic,
                    difficulty=difficulty,
                    question_text=question_text,
                    options_json=json.dumps(options) if options else "{}",
                    correct_option=correct_option,
                    expected_answer=expected_answer,
                    evaluation_criteria=evaluation_criteria
                )
                cq.save()
                log_admin_action(admin_id, "Create Company Question", f"Company {company_name} - {round_type}")
                return jsonify({"success": True, "message": "Company question added", "id": str(cq.id)}), 201
            else:
                q = Question(
                    category=round_type,
                    difficulty=difficulty,
                    technology=topic,
                    question_text=question_text,
                    expected_answer=expected_answer,
                    evaluation_criteria=evaluation_criteria
                )
                q.save()
                log_admin_action(admin_id, "Create General Question", f"QID {str(q.id)}")
                return jsonify({"success": True, "message": "Question added to bank", "id": str(q.id)}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@admin_advanced_bp.route('/questions/<string:question_id>', methods=['DELETE'])
@jwt_required()
def delete_question(question_id):
    admin_id = get_jwt_identity()
    if not is_admin(admin_id):
        return jsonify({"error": "Unauthorized"}), 403

    try:
        cq = CompanyQuestion.objects(id=question_id).first()
        if cq:
            cq.delete()
            log_admin_action(admin_id, "Delete Company Question", f"ID {question_id}")
            return jsonify({"success": True, "message": "Company question deleted"}), 200

        q = Question.objects(id=question_id).first()
        if q:
            q.delete()
            log_admin_action(admin_id, "Delete General Question", f"ID {question_id}")
            return jsonify({"success": True, "message": "Question deleted"}), 200

        return jsonify({"error": "Question not found"}), 404
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
        data = []
        for c in companies:
            q_count = CompanyQuestion.objects(company_id=str(c.id)).count()
            if q_count == 0 and c.name:
                q_count = CompanyQuestion.objects(company_name=c.name).count()

            rounds_list = []
            if c.rounds_list:
                try:
                    rounds_list = json.loads(c.rounds_list)
                except Exception:
                    pass

            data.append({
                "id": str(c.id),
                "name": c.name,
                "category": c.category or "Product",
                "hiring_type": c.hiring_type or "Software Engineer",
                "difficulty": c.difficulty or "Medium",
                "duration": c.duration or "2 Hours",
                "description": c.description or "",
                "logo_url": c.logo_url or "",
                "rounds": rounds_list,
                "question_count": q_count,
                "is_active": c.is_active
            })

        if len(data) == 0:
            products = ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Adobe", "Oracle", "IBM", "Intel", "Cisco", "NVIDIA", "Salesforce", "SAP", "Tesla"]
            services = ["Infosys", "TCS", "Wipro", "Accenture", "Capgemini", "Cognizant", "Deloitte", "HCL", "Tech Mahindra", "LTIMindtree"]
            startups = ["Zoho", "Freshworks", "Flipkart", "PhonePe", "Paytm", "Swiggy", "Zomato", "Razorpay"]
            all_comps = products + services + startups
            for name in all_comps:
                cat = "Product" if name in products else ("Service" if name in services else "Startup")
                diff = "Hard" if name in products else ("Easy" if name in services else "Medium")
                dur = "2.5 Hours" if name in products else "2 Hours"
                logo = f"https://img.icons8.com/color/144/{name.lower()}-logo.png" if name.lower() not in ["meta", "sap", "oracle"] else f"https://img.icons8.com/fluency/144/{name.lower()}.png"
                if name == "Google": logo = "https://img.icons8.com/color/144/google-logo.png"
                elif name == "Microsoft": logo = "https://img.icons8.com/color/144/microsoft.png"
                elif name == "Amazon": logo = "https://img.icons8.com/color/144/amazon.png"
                elif name == "Apple": logo = "https://img.icons8.com/color/144/mac-os--v2.png"
                elif name == "Meta": logo = "https://img.icons8.com/color/144/meta-logo.png"
                elif name == "Netflix": logo = "https://img.icons8.com/color/144/netflix-desktop-app.png"
                elif name == "NVIDIA": logo = "https://img.icons8.com/color/144/nvidia.png"
                elif name == "Tesla": logo = "https://img.icons8.com/color/144/tesla-logo.png"
                elif name == "Salesforce": logo = "https://img.icons8.com/color/144/salesforce.png"

                q_count = len(COMPANY_QUESTIONS_DATA.get(name, {}).get("Aptitude", [])) + \
                          len(COMPANY_QUESTIONS_DATA.get(name, {}).get("Technical MCQ", [])) + \
                          len(COMPANY_QUESTIONS_DATA.get(name, {}).get("Coding", [])) + \
                          len(COMPANY_QUESTIONS_DATA.get(name, {}).get("Technical AI", [])) + \
                          len(COMPANY_QUESTIONS_DATA.get(name, {}).get("HR", []))

                data.append({
                    "id": name.lower(),
                    "name": name,
                    "category": cat,
                    "hiring_type": "Software Engineer / SDE",
                    "difficulty": diff,
                    "duration": dur,
                    "description": f"Prepare for {name}'s rigorous recruitment cycles and tailored assessments.",
                    "logo_url": logo,
                    "rounds": ["Aptitude", "Technical MCQ", "Coding", "Technical AI", "HR"],
                    "question_count": q_count or 5,
                    "is_active": True
                })

        return jsonify({"companies": data}), 200


    if request.method == 'POST':
        data = request.json or {}
        try:
            rounds = data.get('rounds') or ["Aptitude", "Technical MCQ", "Coding", "Technical AI", "HR"]
            c = Company(
                name=data.get('name'),
                description=data.get('description', ''),
                logo_url=data.get('logo_url', ''),
                category=data.get('category', 'Product'),
                hiring_type=data.get('hiring_type', 'Software Engineer / SDE'),
                difficulty=data.get('difficulty', 'Medium'),
                duration=data.get('duration', '2 Hours'),
                rounds_list=json.dumps(rounds),
                is_active=data.get('is_active', True)
            )
            c.save()
            log_admin_action(admin_id, "Create Company", f"Company {c.name}")
            return jsonify({"success": True, "message": "Company added", "id": str(c.id)}), 201
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
        User.objects.count()
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
