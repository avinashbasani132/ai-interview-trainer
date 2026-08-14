from datetime import datetime
from models import db


class CommunityPost(db.Document):
    meta = {'collection': 'community_posts'}

    user_id = db.StringField(required=True)
    title = db.StringField(max_length=255, required=True)
    content = db.StringField(required=True)
    upvotes = db.IntField(default=0)
    created_at = db.DateTimeField(default=datetime.utcnow)


class CommunityReply(db.Document):
    meta = {'collection': 'community_replies', 'indexes': ['post_id']}

    post_id = db.StringField(required=True)
    user_id = db.StringField(required=True)
    content = db.StringField(required=True)
    upvotes = db.IntField(default=0)
    created_at = db.DateTimeField(default=datetime.utcnow)
