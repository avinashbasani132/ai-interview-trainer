from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Company, CompanyQuestion, InterviewSession

company_bp = Blueprint('company', __name__)

@company_bp.route('/list', methods=['GET'])
@jwt_required()
def list_companies():
    companies = Company.query.all()
    res = [{"id": c.id, "name": c.name, "description": c.description} for c in companies]
    return jsonify({"companies": res}), 200

@company_bp.route('/start', methods=['POST'])
@jwt_required()
def start_company_interview():
    user_id = get_jwt_identity()
    data = request.json
    company_id = data.get("company_id")
    
    if not company_id:
        return jsonify({"error": "Company ID required"}), 400
        
    company = Company.query.get(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    try:
        new_session = InterviewSession(user_id=user_id, company_id=company_id, current_round=1, attempt_count=1)
        db.session.add(new_session)
        db.session.commit()
        return jsonify({
            "message": f"Started {company.name} interview", 
            "session_id": new_session.id, 
            "round": 1
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
