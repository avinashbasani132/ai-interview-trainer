from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True) # added username for leaderboard
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    readiness_score = db.Column(db.Float, default=0.0)
    job_readiness_score = db.Column(db.Float, default=0.0) # Overall Score
    
    # New V3 Tracking Stats
    total_interviews = db.Column(db.Integer, default=0)
    rounds_cleared = db.Column(db.Integer, default=0)
    failed_attempts = db.Column(db.Integer, default=0)
    dsa_problems_solved = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)

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

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    resume_id = db.Column(db.Integer, db.ForeignKey('resume_data.id'), nullable=True) 
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True) # Company mode link
    current_round = db.Column(db.Integer, default=1) # 1: MCQ, 2: Tech, 3: HR, 4: Coding
    attempt_count = db.Column(db.Integer, default=1)
    status = db.Column(db.String(50), default='in_progress') # in_progress, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    results = db.relationship('RoundResult', backref='session', lazy=True)

class RoundResult(db.Model):
    __tablename__ = 'round_results'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    round_type = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)
    feedback_json = db.Column(db.Text, nullable=True) 
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class ResumeData(db.Model):
    __tablename__ = 'resume_data'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    extracted_text = db.Column(db.Text, nullable=False)
    extracted_skills = db.Column(db.Text, nullable=True) 
    score = db.Column(db.Float, nullable=True) # AI Resume Score (0-100)
    suggestions_json = db.Column(db.Text, nullable=True) # JSON list
    missing_skills_json = db.Column(db.Text, nullable=True) # JSON list
    strengths_json = db.Column(db.Text, nullable=True) # ATS Strengths
    weaknesses_json = db.Column(db.Text, nullable=True) # ATS Weaknesses
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class LearningRecommendation(db.Model):
    __tablename__ = 'learning_recommendations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    suggestion = db.Column(db.Text, nullable=False)
    resource_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class InterviewQuestion(db.Model):
    __tablename__ = 'interview_questions'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    round_type = db.Column(db.String(50), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    options_json = db.Column(db.Text, nullable=True) 
    user_answer = db.Column(db.Text, nullable=True)
    ai_feedback = db.Column(db.Text, nullable=True) 
    score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DSAProblem(db.Model):
    __tablename__ = 'dsa_problems'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    topic = db.Column(db.String(100), nullable=True) # e.g. Arrays, Trees
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

# ---------------- NEW PLATFORM MODELS ----------------

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    sessions = db.relationship('InterviewSession', backref='company', lazy=True)

class CompanyQuestion(db.Model):
    __tablename__ = 'company_questions'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    round_type = db.Column(db.String(50), nullable=False) # MCQ, Tech, HR
    question_text = db.Column(db.Text, nullable=False)

class AptitudeQuestion(db.Model):
    __tablename__ = 'aptitude_questions'
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(255), nullable=False)
    option_b = db.Column(db.String(255), nullable=False)
    option_c = db.Column(db.String(255), nullable=False)
    option_d = db.Column(db.String(255), nullable=False)
    correct_option = db.Column(db.String(1), nullable=False) # A, B, C, D
    explanation = db.Column(db.Text, nullable=True)

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_name = db.Column(db.String(100), nullable=False) # e.g., "7 Day Streak", "DSA Master"
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

class CommunityPost(db.Model):
    __tablename__ = 'community_posts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    upvotes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    replies = db.relationship('CommunityReply', backref='post', lazy=True)

class CommunityReply(db.Model):
    __tablename__ = 'community_replies'
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('community_posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    upvotes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class LearningRoadmap(db.Model):
    __tablename__ = 'learning_roadmaps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    step_name = db.Column(db.String(100), nullable=False)
    step_order = db.Column(db.Integer, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
