from datetime import datetime
from models import db

class LearningRecommendation(db.Model):
    __tablename__ = 'learning_recommendations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    suggestion = db.Column(db.Text, nullable=False)
    resource_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class LearningRoadmap(db.Model):
    __tablename__ = 'learning_roadmaps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    step_name = db.Column(db.String(100), nullable=False)
    step_order = db.Column(db.Integer, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
