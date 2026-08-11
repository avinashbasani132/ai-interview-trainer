import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from models import db, User

def promote_user(email):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"Error: User with email {email} not found.")
            return
        
        user.is_admin = True
        db.session.commit()
        print(f"Success: User {email} has been promoted to Admin.")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python promote_admin.py <user_email>")
    else:
        promote_user(sys.argv[1])
