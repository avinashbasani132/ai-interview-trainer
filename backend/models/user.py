from datetime import datetime
import bcrypt
from models import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    readiness_score = db.Column(db.Float, default=0.0)
    job_readiness_score = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # New V3 Tracking Stats
    total_interviews = db.Column(db.Integer, default=0)
    rounds_cleared = db.Column(db.Integer, default=0)
    failed_attempts = db.Column(db.Integer, default=0)
    dsa_problems_solved = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)

    # Admin Portal Role
    is_admin = db.Column(db.Boolean, default=False)

    # Streak System
    current_streak = db.Column(db.Integer, default=0)
    max_streak = db.Column(db.Integer, default=0)
    last_solved_date = db.Column(db.Date, nullable=True)
    
    # Analytics Stats (success rates)
    tech_score_sum = db.Column(db.Float, default=0.0)
    hr_score_sum = db.Column(db.Float, default=0.0)
    aptitude_score_sum = db.Column(db.Float, default=0.0)
    tech_attempts = db.Column(db.Integer, default=0)
    hr_attempts = db.Column(db.Integer, default=0)
    aptitude_attempts = db.Column(db.Integer, default=0)
    
    # Relationships
    sessions = db.relationship('InterviewSession', backref='user', lazy=True)
    resumes = db.relationship('ResumeData', backref='user', lazy=True)
    learning_recommendations = db.relationship('LearningRecommendation', backref='user', lazy=True)
    achievements = db.relationship('Achievement', backref='user', lazy=True)
    community_posts = db.relationship('CommunityPost', backref='author', lazy=True)
    community_replies = db.relationship('CommunityReply', backref='author', lazy=True)
    certificates = db.relationship('Certificate', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_name = db.Column(db.String(100), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
