import sys
import os
import json
import unittest.mock

# Adjust import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, ResumeInterviewSession

app = create_app('dev')

def run_tests():
    print("[*] Running automated tests for Resume-Based AI Interview...")
    with app.app_context():
        # 1. Fetch or create a test user
        user = User.query.filter_by(email="test_interview@example.com").first()
        if not user:
            user = User(email="test_interview@example.com")
            user.set_password("securepassword")
            db.session.add(user)
            db.session.commit()
            print("[*] Created test user.")

        # 2. Mock Gemini API responses
        mock_details = {
            "name": "John Doe",
            "education": ["Harvard - BS in CS (2024)"],
            "skills": ["Python", "Flask", "React"],
            "projects": [
                {
                    "title": "E-Commerce App",
                    "technologies": ["Flask", "React"],
                    "description": "A full stack web app",
                    "challenges": "Handling high traffic"
                }
            ],
            "experience": [],
            "certifications": [],
            "technologies": ["Python", "Flask", "React"],
            "achievements": [],
            "github": "github.com/johndoe",
            "linkedin": "linkedin.com/in/johndoe",
            "experience_level": "Fresh Graduate",
            "difficulty_level": "Easy",
            "analysis": {
                "score": 85,
                "strengths": ["Good projects"],
                "weaknesses": ["No cloud experience"],
                "suggestions": ["Add AWS"]
            }
        }
        mock_plan = [
            "Explain your e-commerce project architecture.",
            "Why Flask instead of Django?",
            "How do you handle state in React?",
            "What is Python's Global Interpreter Lock (GIL)?",
            "How would you deploy your e-commerce app?"
        ]
        mock_eval = {
            "score": 80,
            "technical_accuracy": 85,
            "confidence": 80,
            "communication": 75,
            "problem_solving": 80,
            "explanation_quality": 80,
            "practical_knowledge": 80,
            "feedback": "Great explanation.",
            "strengths": ["Clear details"],
            "weaknesses": [],
            "recommendation": "Explain database choice.",
            "hint": ""
        }
        mock_followup = {
            "followup_question": "Why did you choose Flask for e-commerce?",
            "internal_reasoning": "Probe database decisions."
        }
        mock_hint = "Think about the request-response cycle in Flask."

        # Mock the service methods
        with unittest.mock.patch('routes.resume_interview.ai_service.extract_resume_details_for_interview', return_value=mock_details), \
             unittest.mock.patch('routes.resume_interview.ai_service.generate_resume_interview_plan', return_value=mock_plan), \
             unittest.mock.patch('routes.resume_interview.ai_service.evaluate_resume_answer', return_value=mock_eval), \
             unittest.mock.patch('routes.resume_interview.ai_service.generate_followup_for_answer', return_value=mock_followup), \
             unittest.mock.patch('routes.resume_interview.ai_service.generate_hint_for_question', return_value=mock_hint):

            # Test database session creation
            print("[*] Creating a ResumeInterviewSession in DB...")
            session = ResumeInterviewSession(
                user_id=user.id,
                resume_name="johndoe_resume.pdf",
                extracted_details=json.dumps(mock_details),
                analysis_json=json.dumps(mock_details["analysis"]),
                plan_json=json.dumps(mock_plan),
                difficulty_level="Easy",
                current_question_idx=0,
                questions_asked=json.dumps([mock_plan[0]]),
                answers_submitted=json.dumps([]),
                scores_per_question=json.dumps([]),
                status='in_progress'
            )
            db.session.add(session)
            db.session.commit()
            session_id = session.id
            print(f"[OK] Created session ID: {session_id}")

            # Test flask routes
            with app.test_client() as client:
                from flask_jwt_extended import create_access_token
                access_token = create_access_token(identity=str(user.id))
                headers = {"Authorization": f"Bearer {access_token}"}
                
                # Test GET session state
                res = client.get(f'/api/resume-interview/session/{session_id}', headers=headers)
                assert res.status_code == 200, f"Expected 200, got {res.status_code}"
                data = res.get_json()
                assert data["resume_name"] == "johndoe_resume.pdf"
                assert data["difficulty"] == "Easy"
                print("[OK] GET session state passed.")

                # Test submit answer (main question -> follow-up triggered)
                res = client.post(
                    f'/api/resume-interview/session/{session_id}/submit-answer',
                    json={"answer": "I built it using Python Flask and React."},
                    headers=headers
                )
                assert res.status_code == 200, f"Expected 200, got {res.status_code}"
                data = res.get_json()
                assert data["followup_triggered"] is True
                assert data["next_question"] == mock_followup["followup_question"]
                print("[OK] Submit answer (main -> follow-up) passed.")

                # Test submit answer (follow-up answer -> next main question)
                res = client.post(
                    f'/api/resume-interview/session/{session_id}/submit-answer',
                    json={"answer": "I used Flask because it is lightweight."},
                    headers=headers
                )
                assert res.status_code == 200
                data = res.get_json()
                assert data["followup_triggered"] is False
                assert data["current_question_idx"] == 1
                assert data["next_question"] == mock_plan[1]
                print("[OK] Submit answer (follow-up -> main) passed.")

                # Test get hint
                res = client.get(f'/api/resume-interview/session/{session_id}/hint', headers=headers)
                assert res.status_code == 200
                data = res.get_json()
                assert data["hint"] == mock_hint
                print("[OK] Get hint passed.")

                # Test complete session
                res = client.post(f'/api/resume-interview/session/{session_id}/complete', json={"duration_seconds": 120}, headers=headers)
                assert res.status_code == 200
                data = res.get_json()
                assert data["overall_score"] == 80
                assert len(data["strong_areas"]) > 0
                print("[OK] Complete session passed.")

                # Test history retrieving
                res = client.get('/api/resume-interview/history', headers=headers)
                assert res.status_code == 200
                data = res.get_json()
                assert len(data["history"]) > 0
                print("[OK] GET history passed.")

                # Test report retrieving
                res = client.get(f'/api/resume-interview/report/{session_id}', headers=headers)
                assert res.status_code == 200
                data = res.get_json()
                assert data["overall_score"] == 80
                assert len(data["questions"]) == 3
                print("[OK] GET report passed.")

            # Clean up test session
            db.session.delete(session)
            db.session.commit()
            print("[*] Cleaned up test session.")
            print("[SUCCESS] ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
