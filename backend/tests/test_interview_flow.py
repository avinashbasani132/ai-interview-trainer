import sys
import os
import json
import unittest.mock

# Adjust import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, InterviewSession, AptitudeQuestion, RoundResult

app = create_app('dev')

def run_tests():
    print("[*] Running automated tests for Career Path Interview...")
    with app.app_context():
        # 1. Fetch or create a test user
        user = User.query.filter_by(email="test_interview@example.com").first()
        if not user:
            user = User(email="test_interview@example.com")
            user.set_password("securepassword")
            db.session.add(user)
            db.session.commit()
            print("[*] Created test user.")

        # Seed an aptitude question if none exist
        q = AptitudeQuestion.query.first()
        if not q:
            q = AptitudeQuestion(
                topic="Math",
                question_text="What is 2+2?",
                option_a="3",
                option_b="4",
                option_c="5",
                option_d="6",
                correct_option="B"
            )
            db.session.add(q)
            db.session.commit()
            print("[*] Seeded test aptitude question.")

        with app.test_client() as client:
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity=str(user.id))
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Test start interview
            res = client.post('/api/interview/start', headers=headers)
            print("Start Interview Status:", res.status_code)
            assert res.status_code == 201, f"Expected 201, got {res.status_code}"
            session_id = res.get_json()["session_id"]
            
            # Test start aptitude
            res = client.post('/api/interview/aptitude/start', headers=headers)
            print("Start Aptitude Status:", res.status_code)
            assert res.status_code == 200, f"Expected 200, got {res.status_code}"
            
            # Test submit aptitude
            res = client.post(
                '/api/interview/aptitude/submit',
                json={
                    "session_id": session_id,
                    "answers": {
                        str(q.id): "B"
                    }
                },
                headers=headers
            )
            print("Submit Aptitude Status:", res.status_code)
            print("Submit Aptitude Response:", res.get_data(as_text=True))
            assert res.status_code == 200, f"Expected 200, got {res.status_code}"

            print("[SUCCESS] ALL INTERVIEW FLOW TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
