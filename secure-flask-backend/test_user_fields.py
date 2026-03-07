from app import create_app
from models import db, User, Achievement, CommunityPost

app = create_app()

with app.app_context():
    try:
        user = User.query.first()
        print("User username:", user.username)
        print("User total interviews:", user.total_interviews)
        
        ach = Achievement.query.first()
        print("Achievements:", ach)
    except Exception as e:
        import traceback
        with open('traceback_user.log', 'w', encoding='utf-8') as f:
            f.write(traceback.format_exc())
