from datetime import datetime
from models import db


class Certificate(db.Document):
    meta = {'collection': 'certificates', 'indexes': ['user_id', 'verification_token']}

    certificate_id = db.StringField(primary_key=True)  # e.g. AIT-2026-000001
    user_id = db.StringField(required=True)
    interview_id = db.StringField()
    interview_type = db.StringField(required=True)  # 'Technical', 'HR', 'Resume-Based', 'Full Assessment'
    overall_score = db.FloatField(required=True)
    completion_date = db.DateTimeField(default=datetime.utcnow)
    issue_date = db.DateTimeField(default=datetime.utcnow)
    verification_token = db.StringField(unique=True, required=True)
    pdf_path = db.StringField()
    candidate_name = db.StringField()
