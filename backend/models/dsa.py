from datetime import datetime
from models import db


class DSAProblem(db.Document):
    meta = {'collection': 'dsa_problems'}

    title = db.StringField(max_length=200, required=True)
    topic = db.StringField(max_length=100)
    description = db.StringField(required=True)
    difficulty = db.StringField(default="Medium")
    example_input = db.StringField()
    example_output = db.StringField()
    created_at = db.DateTimeField(default=datetime.utcnow)


class DSASubmission(db.Document):
    meta = {'collection': 'dsa_submissions', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)
    problem_id = db.StringField(required=True)
    code_submitted = db.StringField(required=True)
    language = db.StringField(default="python")
    score = db.FloatField(required=True)
    feedback_json = db.StringField()
    timestamp = db.DateTimeField(default=datetime.utcnow)
