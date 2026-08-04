from models import db

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(100), nullable=True)  # Product, Service, Startup
    hiring_type = db.Column(db.String(100), nullable=True) # e.g. "Software Engineer"
    difficulty = db.Column(db.String(50), nullable=True)  # Easy, Medium, Hard
    duration = db.Column(db.String(50), nullable=True)    # e.g., "2.5 Hours"
    rounds_list = db.Column(db.Text, nullable=True)        # JSON string of rounds list
    sessions = db.relationship('InterviewSession', backref='company', lazy=True)

class CompanyQuestion(db.Model):
    __tablename__ = 'company_questions'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    round_type = db.Column(db.String(50), nullable=False) # MCQ, Tech, HR
    question_text = db.Column(db.Text, nullable=False)
