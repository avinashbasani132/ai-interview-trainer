from models import db


class Company(db.Document):
    meta = {'collection': 'companies'}

    name = db.StringField(max_length=150, required=True)
    description = db.StringField()
    logo_url = db.StringField(max_length=255)
    category = db.StringField(max_length=100)     # Product, Service, Startup
    hiring_type = db.StringField(max_length=100)  # e.g. "Software Engineer"
    difficulty = db.StringField(max_length=50)    # Easy, Medium, Hard
    duration = db.StringField(max_length=50)      # e.g., "2.5 Hours"
    rounds_list = db.StringField()                # JSON string of rounds list
    is_active = db.BooleanField(default=True)


class CompanyQuestion(db.Document):
    meta = {'collection': 'company_questions', 'indexes': ['company_id']}

    company_id = db.StringField(required=True)
    round_type = db.StringField(required=True)    # MCQ, Tech, HR
    question_text = db.StringField(required=True)
