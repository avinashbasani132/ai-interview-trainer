from datetime import datetime
from models import db

class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    interview_id = db.Column(db.Integer, nullable=True)
    interview_type = db.Column(db.String(50), nullable=False)  # 'Technical', 'HR', 'Resume-Based', 'Full Assessment'
    overall_score = db.Column(db.Float, nullable=False)
    completion_date = db.Column(db.DateTime, default=datetime.utcnow)
    issue_date = db.Column(db.DateTime, default=datetime.utcnow)
    verification_token = db.Column(db.String(100), unique=True, nullable=False)
    pdf_path = db.Column(db.String(255), nullable=True)
