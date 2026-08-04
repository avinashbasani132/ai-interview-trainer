from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models to ensure they are registered with SQLAlchemy
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
