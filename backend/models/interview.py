from datetime import datetime
from models import db


class InterviewSession(db.Document):
    meta = {'collection': 'interview_sessions', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)
    resume_id = db.StringField()
    company_id = db.StringField()
    current_round = db.IntField(default=1)   # 1: MCQ, 2: Tech, 3: HR, 4: Coding
    attempt_count = db.IntField(default=1)
    status = db.StringField(default='in_progress')  # in_progress, completed, failed
    job_role = db.StringField(default='Software Engineer')
    difficulty = db.StringField(default='Medium')
    is_admin_test = db.BooleanField(default=False)
    created_at = db.DateTimeField(default=datetime.utcnow)


class RoundResult(db.Document):
    meta = {'collection': 'round_results', 'indexes': ['session_id']}

    session_id = db.StringField(required=True)
    round_type = db.StringField(required=True)
    score = db.FloatField(required=True)
    feedback_json = db.StringField()
    timestamp = db.DateTimeField(default=datetime.utcnow)


class InterviewQuestion(db.Document):
    meta = {'collection': 'interview_questions', 'indexes': ['session_id']}

    session_id = db.StringField(required=True)
    round_type = db.StringField(required=True)
    question_text = db.StringField(required=True)
    options_json = db.StringField()
    user_answer = db.StringField()
    ai_feedback = db.StringField()
    score = db.FloatField()
    created_at = db.DateTimeField(default=datetime.utcnow)


class ResumeInterviewSession(db.Document):
    meta = {'collection': 'resume_interview_sessions', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)
    resume_name = db.StringField(required=True)
    extracted_details = db.StringField(required=True)  # JSON string
    analysis_json = db.StringField(required=True)       # JSON string
    plan_json = db.StringField(required=True)           # JSON string
    difficulty_level = db.StringField(required=True)

    # State tracking
    current_question_idx = db.IntField(default=0)
    questions_asked = db.StringField(default='[]')      # JSON list
    answers_submitted = db.StringField(default='[]')    # JSON list
    scores_per_question = db.StringField(default='[]')  # JSON list

    # Results
    status = db.StringField(default='in_progress')
    duration_seconds = db.IntField(default=0)
    overall_score = db.FloatField(default=0.0)
    technical_score = db.FloatField(default=0.0)
    communication_score = db.FloatField(default=0.0)
    confidence_score = db.FloatField(default=0.0)
    project_knowledge_score = db.FloatField(default=0.0)
    coding_readiness_score = db.FloatField(default=0.0)
    weak_areas = db.StringField(default='[]')           # JSON list
    strong_areas = db.StringField(default='[]')         # JSON list
    improvement_suggestions = db.StringField(default='[]')  # JSON list

    created_at = db.DateTimeField(default=datetime.utcnow)
