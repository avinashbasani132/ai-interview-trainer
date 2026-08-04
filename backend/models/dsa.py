from datetime import datetime
from models import db

class DSAProblem(db.Model):
    __tablename__ = 'dsa_problems'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    topic = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(20), default="Medium") 
    example_input = db.Column(db.Text, nullable=True)
    example_output = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DSASubmission(db.Model):
    __tablename__ = 'dsa_submissions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    problem_id = db.Column(db.Integer, db.ForeignKey('dsa_problems.id'), nullable=False)
    code_submitted = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(50), default="python")
    score = db.Column(db.Float, nullable=False)
    feedback_json = db.Column(db.Text, nullable=True) 
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
