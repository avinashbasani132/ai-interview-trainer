from datetime import datetime
from models import db

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    resume_id = db.Column(db.Integer, db.ForeignKey('resume_data.id'), nullable=True) 
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    current_round = db.Column(db.Integer, default=1) # 1: MCQ, 2: Tech, 3: HR, 4: Coding
    attempt_count = db.Column(db.Integer, default=1)
    status = db.Column(db.String(50), default='in_progress') # in_progress, completed, failed
    job_role = db.Column(db.String(100), nullable=True, default='Software Engineer')
    difficulty = db.Column(db.String(50), nullable=True, default='Medium')
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

class ResumeInterviewSession(db.Model):
    __tablename__ = 'resume_interview_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    resume_name = db.Column(db.String(255), nullable=False)
    extracted_details = db.Column(db.Text, nullable=False)  # JSON string
    analysis_json = db.Column(db.Text, nullable=False)      # JSON string
    plan_json = db.Column(db.Text, nullable=False)          # JSON string
    difficulty_level = db.Column(db.String(50), nullable=False)
    
    # State tracking
    current_question_idx = db.Column(db.Integer, default=0)
    questions_asked = db.Column(db.Text, default='[]')      # JSON list
    answers_submitted = db.Column(db.Text, default='[]')    # JSON list
    scores_per_question = db.Column(db.Text, default='[]')  # JSON list
    
    # Results
    status = db.Column(db.String(50), default='in_progress')
    duration_seconds = db.Column(db.Integer, default=0)
    overall_score = db.Column(db.Float, default=0.0)
    technical_score = db.Column(db.Float, default=0.0)
    communication_score = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    project_knowledge_score = db.Column(db.Float, default=0.0)
    coding_readiness_score = db.Column(db.Float, default=0.0)
    weak_areas = db.Column(db.Text, default='[]')           # JSON list
    strong_areas = db.Column(db.Text, default='[]')         # JSON list
    improvement_suggestions = db.Column(db.Text, default='[]') # JSON list
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
