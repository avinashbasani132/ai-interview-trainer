from datetime import datetime
import bcrypt
from models import db


class User(db.Document):
    meta = {'collection': 'users', 'indexes': ['email']}

    username = db.StringField(max_length=80, unique=True, sparse=True)
    email = db.StringField(max_length=120, unique=True, required=True)
    password_hash = db.StringField(max_length=256, required=True)
    readiness_score = db.FloatField(default=0.0)
    job_readiness_score = db.FloatField(default=0.0)
    created_at = db.DateTimeField(default=datetime.utcnow)
    last_login = db.DateTimeField()

    # V3 Tracking Stats
    total_interviews = db.IntField(default=0)
    rounds_cleared = db.IntField(default=0)
    failed_attempts = db.IntField(default=0)
    dsa_problems_solved = db.IntField(default=0)
    average_score = db.FloatField(default=0.0)

    # Admin Role
    is_admin = db.BooleanField(default=False)

    # Streak System
    current_streak = db.IntField(default=0)
    max_streak = db.IntField(default=0)
    last_solved_date = db.DateField()

    # Analytics Stats
    tech_score_sum = db.FloatField(default=0.0)
    hr_score_sum = db.FloatField(default=0.0)
    aptitude_score_sum = db.FloatField(default=0.0)
    tech_attempts = db.IntField(default=0)
    hr_attempts = db.IntField(default=0)
    aptitude_attempts = db.IntField(default=0)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode('utf-8'), self.password_hash.encode('utf-8')
        )


class Achievement(db.Document):
    meta = {'collection': 'achievements', 'indexes': ['user_id']}

    user_id = db.StringField(required=True)   # stores str(user.id)
    badge_name = db.StringField(max_length=100, required=True)
    earned_at = db.DateTimeField(default=datetime.utcnow)
