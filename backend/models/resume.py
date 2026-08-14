from datetime import datetime
from models import db


class ResumeData(db.Document):
    meta = {'collection': 'resume_data', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)

    # File Info
    filename = db.StringField()
    file_type = db.StringField(max_length=10)
    resume_version = db.IntField(default=1)

    # Extracted Content
    extracted_text = db.StringField(required=True)
    extracted_skills = db.StringField()
    skills_by_category_json = db.StringField()
    soft_skills_json = db.StringField()

    # Scores
    score = db.FloatField()
    ats_breakdown_json = db.StringField()

    # Contact & Sections
    contact_info_json = db.StringField()
    sections_json = db.StringField()

    # Analysis Results
    missing_sections_json = db.StringField()
    suggestions_json = db.StringField()
    missing_skills_json = db.StringField()
    strengths_json = db.StringField()
    weaknesses_json = db.StringField()

    # Grammar & Formatting
    grammar_analysis_json = db.StringField()
    ats_compatibility_json = db.StringField()

    # Keywords
    keyword_matches_json = db.StringField()
    missing_keywords_json = db.StringField()
    keyword_density = db.FloatField()

    # Readiness
    job_readiness_json = db.StringField()
    interview_readiness = db.StringField(max_length=50)
    interview_readiness_reason = db.StringField()

    # Interview Questions
    interview_questions_json = db.StringField()

    # Learning Roadmap
    learning_roadmap_json = db.StringField()

    # Meta
    experience_level = db.StringField(max_length=100)
    quantified_achievements = db.IntField(default=0)
    certifications_count = db.IntField(default=0)
    created_at = db.DateTimeField(default=datetime.utcnow)
