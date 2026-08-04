import os
import sys
import json
import unittest.mock
import io

# Adjust import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, InterviewSession, AptitudeQuestion, DSAProblem, ResumeData

app = create_app('dev')

# Mock text that represents a real resume
MOCK_RESUME_TEXT = """
Avinash Basani
Email: avinash@example.com
Phone: +91 9999999999
GitHub: github.com/avinashbasani132
LinkedIn: linkedin.com/in/avinashbasani

EDUCATION:
Bachelor of Technology in Computer Science - CGPA 8.5 (2024)

SKILLS:
Python, Flask, JavaScript, React, SQL, Docker, Git, REST APIs, HTML, CSS

PROJECTS:
1. AI Interview Trainer
- Technologies: Flask, React, SQLite, Gemini API
- Built a web app to help candidates practice interview rounds. Implemented real-time evaluations.
2. E-Commerce Backend
- Technologies: Python, PostgreSQL, Docker
- Created a high-throughput shopping cart REST API with JWT authorization.

EXPERIENCE:
Software Engineering Intern at TechCorp (Jan 2024 - Present)
- Developing backend services with Python Flask and maintaining Docker containers.
"""

def run_integration_tests():
    print("=" * 60)
    print("RUNNING MASTER INTEGRATION TESTS FOR ALL FEATURES")
    print("=" * 60)

    with app.app_context():
        # Setup clean test environment
        test_email = "master_tester@example.com"
        test_pass = "SecurePass123!"
        
        # Clean up existing test user if any
        user = User.query.filter_by(email=test_email).first()
        if user:
            from models import ResumeInterviewSession, LearningRecommendation
            InterviewSession.query.filter_by(user_id=user.id).delete()
            ResumeInterviewSession.query.filter_by(user_id=user.id).delete()
            ResumeData.query.filter_by(user_id=user.id).delete()
            LearningRecommendation.query.filter_by(user_id=user.id).delete()
            db.session.delete(user)
            db.session.commit()
            print("[*] Cleaned up existing master test user.")

        # Seed aptitude question
        q = AptitudeQuestion.query.first()
        if not q:
            q = AptitudeQuestion(
                topic="Quantitative Aptitude",
                question_text="If 5 workers build a house in 10 days, how long for 10 workers?",
                option_a="5 days",
                option_b="10 days",
                option_c="20 days",
                option_d="2 days",
                correct_option="A"
            )
            db.session.add(q)
            db.session.commit()
            print("[*] Seeded aptitude question.")

        # Seed DSA problem
        dsa = DSAProblem.query.first()
        if not dsa:
            dsa = DSAProblem(
                title="Two Sum",
                difficulty="Easy",
                description="Find two numbers that add up to a target."
            )
            db.session.add(dsa)
            db.session.commit()
            print("[*] Seeded DSA problem.")

        # Mocking extract_text globally for both blueprints
        with unittest.mock.patch('routes.resume.extract_text', return_value=MOCK_RESUME_TEXT), \
             unittest.mock.patch('routes.resume_interview.extract_text', return_value=MOCK_RESUME_TEXT):
            
            with app.test_client() as client:
                # ─── 1. REGISTER ───
                print("\n[Testing] 1. Auth: User Registration...")
                res = client.post('/api/auth/register', json={
                    "email": test_email,
                    "password": test_pass
                })
                print("Register Status:", res.status_code)
                assert res.status_code in [200, 201], f"Register failed: {res.get_data(as_text=True)}"
                print("[OK] User registered successfully.")

                # ─── 2. LOGIN ───
                print("\n[Testing] 2. Auth: User Login...")
                res = client.post('/api/auth/login', json={
                    "email": test_email,
                    "password": test_pass
                })
                print("Login Status:", res.status_code)
                assert res.status_code == 200, f"Login failed: {res.get_data(as_text=True)}"
                token = res.get_json()["data"]["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                print("[OK] User logged in and retrieved JWT access token.")

                # ─── 3. DASHBOARD ───
                print("\n[Testing] 3. Dashboard API...")
                res = client.get('/api/user/dashboard', headers=headers)
                print("Dashboard Status:", res.status_code)
                assert res.status_code == 200, f"Dashboard failed: {res.get_data(as_text=True)}"
                dash_data = res.get_json()
                assert "job_readiness_score" in dash_data, "Missing job_readiness_score in dashboard response"
                print("[OK] Dashboard fields loaded successfully. Predicted job readiness score:", dash_data.get("job_readiness_score"))

                # ─── 4. RESUME UPLOAD ───
                print("\n[Testing] 4. Resume OCR & Analysis...")
                mock_file = io.BytesIO(b"dummy pdf bytes" * 10)
                res = client.post(
                    '/api/resume/upload-resume',
                    data={'resume': (mock_file, 'resume.pdf')},
                    content_type='multipart/form-data',
                    headers=headers
                )
                print("Resume Upload Status:", res.status_code)
                assert res.status_code == 200, f"Resume upload failed: {res.get_data(as_text=True)}"
                resume_res = res.get_json()
                assert "extracted_skills" in resume_res, f"Missing extracted_skills, response: {resume_res}"
                print("[OK] Resume uploaded and analyzed by Gemini. Extracted skills:", resume_res.get("extracted_skills"))

                # ─── 5. CAREER PATH INTERVIEW FLOW (STANDARD ROUNDS) ───
                print("\n[Testing] 5. Standard Career Path Interview Rounds...")
                # Start standard career interview
                res = client.post('/api/interview/start', headers=headers)
                print("Start Career Interview Status:", res.status_code)
                assert res.status_code == 201
                session_id = res.get_json()["session_id"]

                # Start aptitude
                res = client.post('/api/interview/aptitude/start', headers=headers)
                print("Start Aptitude Status:", res.status_code)
                assert res.status_code == 200
                
                # Submit aptitude answers
                res = client.post('/api/interview/aptitude/submit', json={
                    "session_id": session_id,
                    "answers": {
                        str(q.id): "A"
                    }
                }, headers=headers)
                print("Submit Aptitude Status:", res.status_code)
                assert res.status_code == 200
                print("[OK] Aptitude round submitted and evaluated successfully.")

                # ─── 6. RESUME-BASED INTERVIEW FLOW ───
                print("\n[Testing] 6. Resume-Based Dynamic Interview...")
                mock_resume_file = io.BytesIO(b"dummy resume bytes" * 10)
                res = client.post(
                    '/api/resume-interview/upload',
                    data={'resume': (mock_resume_file, 'resume_profile.pdf')},
                    content_type='multipart/form-data',
                    headers=headers
                )
                print("Resume Upload for Interview Status:", res.status_code)
                assert res.status_code == 201, f"Resume upload for interview failed: {res.get_data(as_text=True)}"
                data = res.get_json()
                res_session_id = data["session_id"]
                
                # Get session state
                res = client.get(f'/api/resume-interview/session/{res_session_id}', headers=headers)
                print("Get Resume Interview State Status:", res.status_code)
                assert res.status_code == 200
                
                # Get hint for current question
                res = client.get(f'/api/resume-interview/session/{res_session_id}/hint', headers=headers)
                print("Get Question Hint Status:", res.status_code)
                assert res.status_code == 200
                
                # Submit candidate response (main question response)
                res = client.post(f'/api/resume-interview/session/{res_session_id}/submit-answer', json={
                    "answer": "Yes, I built a microservice with Flask and optimized query speeds by 40% using Redis caching."
                }, headers=headers)
                print("Submit Answer Status:", res.status_code)
                assert res.status_code == 200
                
                # Complete the resume interview
                res = client.post(f'/api/resume-interview/session/{res_session_id}/complete', json={}, headers=headers)
                print("Complete Resume Session Status:", res.status_code)
                assert res.status_code == 200
                
                # Fetch report
                res = client.get(f'/api/resume-interview/report/{res_session_id}', headers=headers)
                print("Fetch Report Status:", res.status_code)
                assert res.status_code == 200
                print("[OK] Resume-based interview flow completed and report generated successfully.")

                # ─── 7. DSA CODING ARENA ───
                print("\n[Testing] 7. DSA Coding Arena Execution...")
                res = client.post('/api/code/run', json={
                    "code": "print('hello world')",
                    "language": "python",
                    "problem_id": dsa.id
                }, headers=headers)
                print("DSA Execute Status:", res.status_code)
                assert res.status_code == 200
                run_data = res.get_json()
                assert "hello world" in run_data.get("output", "").lower()
                print("[OK] DSA python script compiled and ran successfully. Output:", run_data.get("output").strip())

                # ─── 8. ROADMAP ───
                print("\n[Testing] 8. Learning Roadmap...")
                res = client.get('/api/roadmap/', headers=headers)
                print("Get Roadmap Status:", res.status_code)
                assert res.status_code == 200
                print("[OK] Personalized career roadmap loaded successfully.")

                # ─── 9. CHATBOT ───
                print("\n[Testing] 9. Context-Aware AI Chatbot...")
                res = client.post('/api/chat/message', json={
                    "message": "Give me career advice on python backend engineering"
                }, headers=headers)
                print("Chatbot Message Status:", res.status_code)
                assert res.status_code == 200
                print("[OK] Chatbot messaging is working.")

                # Clean up user and all related tables to satisfy NOT NULL foreign keys
                user = User.query.filter_by(email=test_email).first()
                if user:
                    user_id = user.id
                    from models import ResumeInterviewSession, LearningRecommendation
                    InterviewSession.query.filter_by(user_id=user_id).delete()
                    ResumeInterviewSession.query.filter_by(user_id=user_id).delete()
                    ResumeData.query.filter_by(user_id=user_id).delete()
                    LearningRecommendation.query.filter_by(user_id=user_id).delete()
                    
                    db.session.delete(user)
                    db.session.commit()
                    print("\n[*] Cleaned up master test user and related sessions from database.")

                print("=" * 60)
                print("ALL MASTER INTEGRATION TESTS PASSED SUCCESSFULLY!")
                print("=" * 60)

if __name__ == "__main__":
    run_integration_tests()
