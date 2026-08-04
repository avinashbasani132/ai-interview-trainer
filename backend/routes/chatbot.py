"""
chatbot.py — AI Career Assistant API Routes
============================================
Role: Senior Flask Engineer + Senior API Designer

Endpoints:
  POST   /api/chat/message     Send a message, get AI response
  GET    /api/chat/history     Fetch chat history for user
  DELETE /api/chat/clear       Clear all chat history
  GET    /api/chat/suggestions Get personalized suggested questions
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ChatMessage
from services.chatbot_service import generate_chat_response, get_suggested_questions

logger = logging.getLogger(__name__)
chatbot_bp = Blueprint('chatbot', __name__)

MAX_MESSAGE_LENGTH = 4000
HISTORY_LIMIT = 50       # Messages to return to frontend
CONTEXT_HISTORY = 10     # Messages to feed into AI prompt


# ── POST /api/chat/message ────────────────────────────────────────────────────

@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """
    Accepts a user message, builds context from DB, calls AI, saves both
    user message and assistant reply, returns the AI response.
    Optionally accepts resume_text/ats_score from chatbot.js file upload
    to provide context-aware answers even before DB resume is available.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body is required."}), 400

    user_message = (data.get('message') or '').strip()
    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    if len(user_message) > MAX_MESSAGE_LENGTH:
        return jsonify({"error": f"Message too long. Max {MAX_MESSAGE_LENGTH} characters."}), 400

    # Optional resume context passed from frontend (Step 7 – resume integration)
    extra_context = {}
    if data.get('resume_text'):
        extra_context['resume_text'] = str(data['resume_text'])[:8000]  # cap size
    if data.get('resume_name'):
        extra_context['resume_name'] = str(data['resume_name'])
    if data.get('ats_score') is not None:
        extra_context['ats_score'] = data['ats_score']

    # Fetch recent history for AI context
    try:
        recent = ChatMessage.query.filter_by(user_id=user_id)\
            .order_by(ChatMessage.created_at.desc())\
            .limit(CONTEXT_HISTORY).all()
        history = [{'role': m.role, 'content': m.content} for m in reversed(recent)]
    except Exception as e:
        logger.error(f"History fetch error: {e}")
        history = []

    # Generate AI response
    try:
        ai_response = generate_chat_response(user_message, user_id, history, extra_context)
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return jsonify({"error": "AI service unavailable. Please try again."}), 503

    # Save both messages
    try:
        user_msg = ChatMessage(user_id=user_id, role='user', content=user_message)
        bot_msg  = ChatMessage(user_id=user_id, role='assistant', content=ai_response)
        db.session.add(user_msg)
        db.session.add(bot_msg)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Chat save error: {e}")
        # Still return the response even if save fails

    return jsonify({
        "success": True,
        "response": ai_response,
        "role": "assistant"
    }), 200



# ── GET /api/chat/history ─────────────────────────────────────────────────────

@chatbot_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Returns the user's chat history (latest N messages)."""
    user_id = int(get_jwt_identity())

    try:
        messages = ChatMessage.query.filter_by(user_id=user_id)\
            .order_by(ChatMessage.created_at.asc())\
            .limit(HISTORY_LIMIT).all()

        history = [{
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat()
        } for m in messages]

        return jsonify({"history": history, "count": len(history)}), 200

    except Exception as e:
        logger.error(f"History GET error: {e}")
        return jsonify({"history": [], "count": 0}), 200


# ── DELETE /api/chat/clear ────────────────────────────────────────────────────

@chatbot_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_history():
    """Deletes all chat messages for the current user."""
    user_id = int(get_jwt_identity())

    try:
        deleted = ChatMessage.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        return jsonify({"success": True, "deleted": deleted}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Clear history error: {e}")
        return jsonify({"error": "Failed to clear history."}), 500


# ── GET /api/chat/suggestions ─────────────────────────────────────────────────

@chatbot_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    """Returns personalized suggested questions for this user."""
    user_id = int(get_jwt_identity())
    suggestions = get_suggested_questions(user_id)
    return jsonify({"suggestions": suggestions}), 200
