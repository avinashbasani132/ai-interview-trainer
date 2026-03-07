from flask import Blueprint, request, jsonify
from models import db, ResumeData
from services.ai_service import ai_service
from flask_jwt_extended import jwt_required, get_jwt_identity
import io
import json

resume_bp = Blueprint('resume', __name__)

@resume_bp.route('/upload-resume', methods=['POST'])
@jwt_required()
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
        
    file = request.files['resume']
    if file.filename == '' or not file.filename.endswith('.pdf'):
        return jsonify({"error": "Must provide a valid .pdf file"}), 400

    try:
        # Pass file securely into AI Service
        file_bytes = io.BytesIO(file.read())
        parsed_data = ai_service.parse_resume(file_bytes)
        
        # Save results safely to the database
        user_id = get_jwt_identity()
        resume_record = ResumeData(
            user_id=user_id,
            extracted_text="Text extracted securely", # Placeholder to save DB space
            extracted_skills=json.dumps(parsed_data.get("skills", [])),
            score=parsed_data.get("resume_score", 0),
            suggestions_json=json.dumps(parsed_data.get("suggestions", [])),
            missing_skills_json=json.dumps(parsed_data.get("missing_skills", [])),
            strengths_json=json.dumps(parsed_data.get("strengths", [])),
            weaknesses_json=json.dumps(parsed_data.get("weaknesses", []))
        )
        db.session.add(resume_record)
        db.session.commit()
        
        return jsonify({
            "message": "Resume uploaded successfully",
            "resume_score": parsed_data.get("resume_score", 0),
            "suggestions": parsed_data.get("suggestions", []),
            "missing_skills": parsed_data.get("missing_skills", []),
            "strengths": parsed_data.get("strengths", []),
            "weaknesses": parsed_data.get("weaknesses", []),
            "extracted_skills": parsed_data.get("skills", []),
            "projects": parsed_data.get("projects", []),
            "technologies": parsed_data.get("technologies", []),
            "experience_level": parsed_data.get("experience_level", "Unknown")
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to process resume: {str(e)}"}), 500
