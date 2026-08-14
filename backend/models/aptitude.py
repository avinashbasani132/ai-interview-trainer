from models import db


class AptitudeQuestion(db.Document):
    meta = {'collection': 'aptitude_questions'}

    topic = db.StringField(max_length=100, required=True)
    question_text = db.StringField(required=True)
    option_a = db.StringField(max_length=255, required=True)
    option_b = db.StringField(max_length=255, required=True)
    option_c = db.StringField(max_length=255, required=True)
    option_d = db.StringField(max_length=255, required=True)
    correct_option = db.StringField(max_length=1, required=True)  # A, B, C, D
    explanation = db.StringField()
