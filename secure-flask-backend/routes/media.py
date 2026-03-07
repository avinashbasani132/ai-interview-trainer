import os
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, InterviewSession, RoundResult, User
from services.ai_service import ai_service
from werkzeug.utils import secure_filename

media_bp = Blueprint('media', __name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'hr')

# Ensure directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'webm', 'mp4', 'ogg', 'wav'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@media_bp.route('/upload-hr-video', methods=['POST'])
@jwt_required()
def upload_hr_video():
    user_id = get_jwt_identity()
    session_id = request.form.get('session_id')
    
    if 'video' not in request.files:
        return jsonify({"error": "No media file found"}), 400
        
    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if not session_id:
        return jsonify({"error": "Session ID required"}), 400

    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    if file and allowed_file(file.filename):
        # Save file securely
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"hr_{user_id}_{session_id}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # In a real app, use AI to transcribe audio/video to text
        # Here we mock the transcription for the Gemini text prompt evaluation
        mock_transcription = "I am a strong communicator who listens actively and collaborates well with my team. I resolve conflicts by understanding all perspectives and finding common ground."
        
        question = "Please record a short video answering: How do you handle conflict in a team?"
        
        # 1. Ask Gemini to evaluate the communication (using mocked text for simplicity)
        evaluation = ai_service.evaluate_answer(question, mock_transcription, "HR Video Round - Communication Focus")
        score = evaluation.get("score", 0)

        # 2. Record the result
        result = RoundResult(
            session_id=session.id,
            round_type="HR Media",
            score=score,
            feedback_json=str(evaluation)
        )
        db.session.add(result)
        
        # 3. Update Progression (Assuming HR is Round 3 out of 3)
        if score >= 70:
            session.status = 'completed'
            session.current_round += 1
        else:
            session.attempt_count += 1
            if session.attempt_count > 2:
                session.status = 'failed'
                
        user = User.query.get(user_id)
        if user:
            user.readiness_score = (user.readiness_score + score) / 2

        db.session.commit()

        return jsonify({
            "message": "Upload and evaluation successful",
            "evaluation": evaluation,
            "status": session.status,
            "attempts": session.attempt_count,
            "file_saved": filename
        }), 200

    return jsonify({"error": "Invalid file type"}), 400
