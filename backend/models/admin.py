from datetime import datetime
from models import db


class AdminAuditLog(db.Document):
    meta = {'collection': 'admin_audit_logs'}

    admin_id = db.StringField(required=True)
    action = db.StringField(max_length=100, required=True)
    target = db.StringField(max_length=255)
    details = db.StringField()
    timestamp = db.DateTimeField(default=datetime.utcnow)


class SystemSetting(db.Document):
    meta = {'collection': 'system_settings', 'indexes': [{'fields': ['setting_key'], 'unique': True}]}

    setting_key = db.StringField(max_length=100, unique=True, required=True)
    setting_value = db.StringField(required=True)
    updated_at = db.DateTimeField(default=datetime.utcnow)


class Question(db.Document):
    meta = {'collection': 'questions_bank'}

    category = db.StringField(max_length=100, required=True)
    difficulty = db.StringField(max_length=50, required=True)
    technology = db.StringField(max_length=100)
    company_id = db.StringField()
    job_role = db.StringField(max_length=100)
    question_text = db.StringField(required=True)
    expected_answer = db.StringField()
    evaluation_criteria = db.StringField()
    is_active = db.BooleanField(default=True)
    created_at = db.DateTimeField(default=datetime.utcnow)
