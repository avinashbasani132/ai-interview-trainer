import sys
import os
import json


# Adjust import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, ResumeInterviewSession, Certificate

app = create_app('dev')

def run_tests():
    print("=" * 60)
    print("RUNNING AUTOMATED TESTS FOR INTERVIEW CERTIFICATE SYSTEM")
    print("=" * 60)
    
    with app.app_context():
        # Setup test client
        client = app.test_client()

        # Clean up existing test data
        test_email = "test_cert@example.com"
        existing_user = User.query.filter_by(email=test_email).first()
        if existing_user:
            Certificate.query.filter_by(user_id=existing_user.id).delete()
            ResumeInterviewSession.query.filter_by(user_id=existing_user.id).delete()
            db.session.delete(existing_user)
            db.session.commit()

        # 1. Register user
        reg_res = client.post('/api/auth/register', json={
            "email": test_email,
            "password": "certpassword123"
        })
        assert reg_res.status_code == 201, f"Reg failed: {reg_res.status_code}"
        print("[OK] User registered.")

        # 2. Login user
        login_res = client.post('/api/auth/login', json={
            "email": test_email,
            "password": "certpassword123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.status_code}"
        token = json.loads(login_res.data)['data']['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        print("[OK] User logged in & retrieved JWT.")

        # Get user ID
        user = User.query.filter_by(email=test_email).first()
        user_id = user.id

        # 3. Create a completed session with a high passing score (85%)
        passing_session = ResumeInterviewSession(
            user_id=user_id,
            resume_name="John_Doe_CV.pdf",
            extracted_details=json.dumps({"skills": ["Python", "Flask", "React", "Docker"]}),
            analysis_json="{}",
            plan_json="[]",
            difficulty_level="Medium",
            status="completed",
            duration_seconds=1200,
            overall_score=85.0
        )
        db.session.add(passing_session)

        # 4. Create a completed session with a failing score (65%)
        failing_session = ResumeInterviewSession(
            user_id=user_id,
            resume_name="John_Doe_CV.pdf",
            extracted_details=json.dumps({"skills": ["HTML", "CSS"]}),
            analysis_json="{}",
            plan_json="[]",
            difficulty_level="Easy",
            status="completed",
            duration_seconds=800,
            overall_score=65.0
        )
        db.session.add(failing_session)

        # 5. Create an in-progress session (score 90%, but not completed)
        incomplete_session = ResumeInterviewSession(
            user_id=user_id,
            resume_name="John_Doe_CV.pdf",
            extracted_details=json.dumps({"skills": ["Python"]}),
            analysis_json="{}",
            plan_json="[]",
            difficulty_level="Advanced",
            status="in_progress",
            duration_seconds=500,
            overall_score=90.0
        )
        db.session.add(incomplete_session)
        db.session.commit()
        print("[OK] Set up test interview sessions.")

        # 6. Test: Fail certificate request for in-progress session
        gen_res = client.post('/api/certificate/generate', json={
            "interview_id": incomplete_session.id,
            "interview_type": "Resume-Based"
        }, headers=headers)
        assert gen_res.status_code == 400
        assert b"Interview session is not completed" in gen_res.data
        print("[OK] Blocked certificate for incomplete session.")

        # 7. Test: Fail certificate request for low score session (65%)
        gen_res = client.post('/api/certificate/generate', json={
            "interview_id": failing_session.id,
            "interview_type": "Resume-Based"
        }, headers=headers)
        assert gen_res.status_code == 400
        assert b"below the minimum required 70% threshold" in gen_res.data
        print("[OK] Blocked certificate for failing score (65%).")

        # 8. Test: Pass certificate request for passing score session (85%)
        gen_res = client.post('/api/certificate/generate', json={
            "interview_id": passing_session.id,
            "interview_type": "Resume-Based",
            "mode": "light"
        }, headers=headers)
        assert gen_res.status_code == 201, f"Gen failed: {gen_res.status_code} {gen_res.data}"
        cert_data = json.loads(gen_res.data)
        cert_id = cert_data['certificate_id']
        print(f"[OK] Generated certificate successfully: {cert_id}")

        # 9. Test: Prevent duplicates (generating again returns 200 and same ID)
        dup_res = client.post('/api/certificate/generate', json={
            "interview_id": passing_session.id,
            "interview_type": "Resume-Based"
        }, headers=headers)
        assert dup_res.status_code == 200
        dup_data = json.loads(dup_res.data)
        assert dup_data['certificate_id'] == cert_id
        assert b"already generated" in dup_res.data
        print("[OK] Prevented duplicate certificates cleanly.")

        # 10. Test: Retrieve user's certificate list
        list_res = client.get('/api/certificate/my-certificates', headers=headers)
        assert list_res.status_code == 200
        list_data = json.loads(list_res.data)
        assert list_data['count'] == 1
        assert list_data['certificates'][0]['id'] == cert_id
        print("[OK] Checked certificate list query.")

        # 11. Test: Secure PDF download
        dl_res = client.get(f'/api/certificate/download/{cert_id}', headers=headers)
        assert dl_res.status_code == 200
        assert dl_res.mimetype == 'application/pdf'
        assert len(dl_res.data) > 1000 # should be non-empty PDF
        print("[OK] PDF certificate successfully downloaded.")

        # 12. Test: Secure PDF download unauthorized block
        bad_dl = client.get(f'/api/certificate/download/{cert_id}') # no headers
        assert bad_dl.status_code == 401
        print("[OK] Blocked unauthorized PDF download.")

        # 13. Test: Public Verification Route (valid lookup)
        verify_res = client.get(f'/verify-certificate/{cert_id}')
        assert verify_res.status_code == 200
        assert b"AUTHENTIC CERTIFICATE VALIDATED" in verify_res.data
        assert b"Test Cert" in verify_res.data # Candidate name derived from email prefix
        assert cert_id.encode('utf-8') in verify_res.data
        print("[OK] Public verification page valid lookup verified.")

        # 14. Test: Public Verification Route (invalid lookup)
        bad_verify = client.get('/verify-certificate/AIT-1999-000000')
        assert bad_verify.status_code == 404
        assert b"INVALID OR UNVERIFIED CERTIFICATE" in bad_verify.data
        print("[OK] Public verification page invalid lookup verified.")

        # Clean up database records
        Certificate.query.filter_by(user_id=user_id).delete()
        ResumeInterviewSession.query.filter_by(user_id=user_id).delete()
        db.session.delete(user)
        db.session.commit()
        print("[OK] Tear down complete.")
        print("=" * 60)
        print("ALL CERTIFICATE TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == "__main__":
    run_tests()
