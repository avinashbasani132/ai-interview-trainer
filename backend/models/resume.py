from datetime import datetime
from models import db

class ResumeData(db.Model):
    __tablename__ = 'resume_data'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # ── File Info ────────────────────────────────────────────────────────────
    filename = db.Column(db.String(255), nullable=True)
    file_type = db.Column(db.String(10), nullable=True)
    resume_version = db.Column(db.Integer, nullable=True, default=1)

    # ── Extracted Content ─────────────────────────────────────────────────────
    extracted_text = db.Column(db.Text, nullable=False)
    extracted_skills = db.Column(db.Text, nullable=True)
    skills_by_category_json = db.Column(db.Text, nullable=True)
    soft_skills_json = db.Column(db.Text, nullable=True)

    # ── Scores ───────────────────────────────────────────────────────────────
    score = db.Column(db.Float, nullable=True)
    ats_breakdown_json = db.Column(db.Text, nullable=True)

    # ── Contact & Sections ───────────────────────────────────────────────────
    contact_info_json = db.Column(db.Text, nullable=True)
    sections_json = db.Column(db.Text, nullable=True)

    # ── Analysis Results ─────────────────────────────────────────────────────
    missing_sections_json = db.Column(db.Text, nullable=True)
    suggestions_json = db.Column(db.Text, nullable=True)
    missing_skills_json = db.Column(db.Text, nullable=True)
    strengths_json = db.Column(db.Text, nullable=True)
    weaknesses_json = db.Column(db.Text, nullable=True)

    # ── Grammar & Formatting ─────────────────────────────────────────────────
    grammar_analysis_json = db.Column(db.Text, nullable=True)
    ats_compatibility_json = db.Column(db.Text, nullable=True)

    # ── Keywords ─────────────────────────────────────────────────────────────
    keyword_matches_json = db.Column(db.Text, nullable=True)
    missing_keywords_json = db.Column(db.Text, nullable=True)
    keyword_density = db.Column(db.Float, nullable=True)

    # ── Readiness ────────────────────────────────────────────────────────────
    job_readiness_json = db.Column(db.Text, nullable=True)
    interview_readiness = db.Column(db.String(50), nullable=True)
    interview_readiness_reason = db.Column(db.Text, nullable=True)

    # ── Interview Questions ───────────────────────────────────────────────────
    interview_questions_json = db.Column(db.Text, nullable=True)

    # ── Learning Roadmap ─────────────────────────────────────────────────────
    learning_roadmap_json = db.Column(db.Text, nullable=True)

    # ── Meta ─────────────────────────────────────────────────────────────────
    experience_level = db.Column(db.String(100), nullable=True)
    quantified_achievements = db.Column(db.Integer, nullable=True, default=0)
    certifications_count = db.Column(db.Integer, nullable=True, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
