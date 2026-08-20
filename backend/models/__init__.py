"""
models/__init__.py
==================
Database initialization using pure MongoEngine (Flask 3.x compatible).
Provides a 'db' object with init_app() support and all MongoEngine field types.
"""
import mongoengine
from mongoengine import (
    Document,
    StringField, IntField, FloatField, BooleanField,
    DateTimeField, DateField, ListField, DictField,
    ReferenceField
)


class MongoEngineDB:
    """
    Thin wrapper around mongoengine that provides Flask-style init_app() support.
    Compatible with Flask 3.x (no dependency on flask.json.JSONEncoder).
    
    Usage in models:
        from models import db
        class User(db.Document):
            email = db.StringField(required=True)
    """

    # Expose MongoEngine document base class
    Document = Document

    # Expose all field types as class attributes so models can use db.StringField() etc.
    StringField = staticmethod(StringField)
    IntField = staticmethod(IntField)
    FloatField = staticmethod(FloatField)
    BooleanField = staticmethod(BooleanField)
    DateTimeField = staticmethod(DateTimeField)
    DateField = staticmethod(DateField)
    ListField = staticmethod(ListField)
    DictField = staticmethod(DictField)
    ReferenceField = staticmethod(ReferenceField)

    def init_app(self, app):
        """
        Connect MongoEngine to the Flask app using MONGODB_SETTINGS from config.
        Called by the app factory after Flask and extensions are initialized.
        """
        settings = app.config.get('MONGODB_SETTINGS', {})
        host = settings.get('host', 'localhost')
        port = settings.get('port', 27017)
        db_name = settings.get('db', 'interview_trainer')

        # If host is a full URI string (e.g. mongodb+srv://...), connect via URI
        if host.startswith('mongodb'):
            try:
                import certifi
                mongoengine.connect(host=host, db=db_name, uuidRepresentation='standard', tlsCAFile=certifi.where())
            except Exception:
                mongoengine.connect(host=host, db=db_name, uuidRepresentation='standard')
        else:
            mongoengine.connect(
                db=db_name,
                host=host,
                port=port,
                uuidRepresentation='standard'
            )



db = MongoEngineDB()

# Import all models so they are registered with MongoEngine
from models.user import User, Achievement
from models.interview import InterviewSession, RoundResult, InterviewQuestion, ResumeInterviewSession
from models.resume import ResumeData
from models.certificate import Certificate
from models.learning import LearningRecommendation, LearningRoadmap
from models.dsa import DSAProblem, DSASubmission
from models.company import Company, CompanyQuestion
from models.aptitude import AptitudeQuestion
from models.community import CommunityPost, CommunityReply
from models.chatbot import ChatMessage
from models.admin import AdminAuditLog, SystemSetting, Question

__all__ = [
    "db", "MongoEngineDB", "User", "Achievement", "InterviewSession",
    "RoundResult", "InterviewQuestion", "ResumeInterviewSession", "ResumeData",
    "Certificate", "LearningRecommendation", "LearningRoadmap", "DSAProblem",
    "DSASubmission", "Company", "CompanyQuestion", "AptitudeQuestion",
    "CommunityPost", "CommunityReply", "ChatMessage", "AdminAuditLog",
    "SystemSetting", "Question"
]

