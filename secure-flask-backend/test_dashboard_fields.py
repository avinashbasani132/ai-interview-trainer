from app import create_app
from models import db, User, InterviewSession, LearningRecommendation, DSAProblem, ResumeData
import traceback

app = create_app()

with app.app_context():
    try:
        user_id = 1
        user = User.query.get(user_id)
        if not user:
            print("User not found")
        else:
            print(f"User email: {user.email}")
            active_session = InterviewSession.query.filter_by(user_id=user_id).order_by(InterviewSession.created_at.desc()).first()
            print(f"Active session: {active_session}")
            
            recs = LearningRecommendation.query.filter_by(user_id=user_id).order_by(LearningRecommendation.created_at.desc()).limit(3).all()
            print(f"Recs: {recs}")
            
            dsa = DSAProblem.query.first()
            print(f"DSA: {dsa}")
            
            latest_resume = ResumeData.query.filter_by(user_id=user_id).order_by(ResumeData.created_at.desc()).first()
            print(f"Latest resume score: {latest_resume.score if latest_resume else None}")
            
            print(f"Achievements: {user.achievements}")
            print(f"Streak: {user.current_streak}")
            print(f"Last solved: {user.last_solved_date.isoformat() if user.last_solved_date else None}")
            print("ML Prediction inputs:")
            print("tech attempts:", user.tech_attempts)
            print("hr attempts:", user.hr_attempts)
            print("aptitude attempts:", user.aptitude_attempts)
            print("Success")
    except Exception as e:
        with open('traceback.log', 'w', encoding='utf-8') as f:
            f.write(traceback.format_exc())
