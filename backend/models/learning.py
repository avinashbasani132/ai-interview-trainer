from datetime import datetime
from models import db


class LearningRecommendation(db.Document):
    meta = {'collection': 'learning_recommendations', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)
    topic = db.StringField(max_length=100, required=True)
    suggestion = db.StringField(required=True)
    resource_url = db.StringField(max_length=255)
    created_at = db.DateTimeField(default=datetime.utcnow)


class LearningRoadmap(db.Document):
    meta = {'collection': 'learning_roadmaps', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)
    step_name = db.StringField(max_length=100, required=True)
    step_order = db.IntField(required=True)
    is_completed = db.BooleanField(default=False)
