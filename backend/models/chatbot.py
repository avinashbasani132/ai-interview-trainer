from datetime import datetime
from models import db


class ChatMessage(db.Document):
    """Stores AI Career Assistant chat history per user."""
    meta = {'collection': 'chat_messages', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)
    role = db.StringField(max_length=20, required=True)   # 'user' or 'assistant'
    content = db.StringField(required=True)
    created_at = db.DateTimeField(default=datetime.utcnow)
