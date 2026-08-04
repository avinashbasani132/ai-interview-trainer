import os
import sys
import io
import unittest
import unittest.mock

# Adjust import path to find backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, ResumeData
from services.docx_parser import extract_text

class TestResumeBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app('dev')
        cls.app.config['TESTING'] = True
        
        # Setup test database records
        with cls.app.app_context():
            cls.test_email = "boundary_tester@example.com"
            cls.test_pass = "SecurePass123!"
            
            # Clean up user if existing
            user = User.query.filter_by(email=cls.test_email).first()
            if user:
                ResumeData.query.filter_by(user_id=user.id).delete()
                db.session.delete(user)
                db.session.commit()

            # Create fresh tester
            user = User(email=cls.test_email)
            user.password_hash = user.password_hash = "fake_hash" # placeholder
            # Set actual hashed password
            import bcrypt
            user.password_hash = bcrypt.hashpw(cls.test_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            db.session.add(user)
            db.session.commit()

    def setUp(self):
        self.client = self.app.test_client()
        # Log in to get token
        res = self.client.post('/api/auth/login', json={
            "email": self.test_email,
            "password": self.test_pass
        })
        self.token = res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_upload_missing_file_field(self):
        """Should return 400 if 'resume' field is missing from request.files"""
        res = self.client.post(
            '/api/resume/upload-resume',
            data={},
            content_type='multipart/form-data',
            headers=self.headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("No resume file provided", res.get_json()["error"])

    def test_upload_empty_filename(self):
        """Should return 400 if file has no filename selected"""
        res = self.client.post(
            '/api/resume/upload-resume',
            data={'resume': (io.BytesIO(b""), '')},
            content_type='multipart/form-data',
            headers=self.headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("No file selected", res.get_json()["error"])

    def test_upload_invalid_extension(self):
        """Should return 400 if file has unsupported extension (e.g., .txt)"""
        res = self.client.post(
            '/api/resume/upload-resume',
            data={'resume': (io.BytesIO(b"abc" * 20), 'resume.txt')},
            content_type='multipart/form-data',
            headers=self.headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid file type", res.get_json()["error"])

    def test_upload_empty_file_bytes(self):
        """Should return 400 if file has 0 bytes"""
        res = self.client.post(
            '/api/resume/upload-resume',
            data={'resume': (io.BytesIO(b""), 'resume.pdf')},
            content_type='multipart/form-data',
            headers=self.headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("empty or too small", res.get_json()["error"])

    def test_upload_too_small_file_bytes(self):
        """Should return 400 if file size is less than 50 bytes"""
        res = self.client.post(
            '/api/resume/upload-resume',
            data={'resume': (io.BytesIO(b"small bytes"), 'resume.pdf')},
            content_type='multipart/form-data',
            headers=self.headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("empty or too small", res.get_json()["error"])

    def test_upload_file_too_large(self):
        """Should return 400 if file size exceeds 10 MB limit"""
        large_bytes = b"large" * 3 * 1024 * 1024  # 15 MB
        res = self.client.post(
            '/api/resume/upload-resume',
            data={'resume': (io.BytesIO(large_bytes), 'resume.pdf')},
            content_type='multipart/form-data',
            headers=self.headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("File too large", res.get_json()["error"])

    def test_extraction_failure_empty_text(self):
        """Should return 422 if extracted text from pdf is less than 50 characters (e.g. scanned image/corrupt file)"""
        # We mock extract_text to raise a ValueError representing scanned file or empty text extraction
        with unittest.mock.patch('routes.resume.extract_text', side_effect=ValueError("The file appears to be empty or contains no readable text.")):
            res = self.client.post(
                '/api/resume/upload-resume',
                data={'resume': (io.BytesIO(b"dummy pdf bytes" * 10), 'resume.pdf')},
                content_type='multipart/form-data',
                headers=self.headers
            )
            self.assertEqual(res.status_code, 422)
            self.assertIn("empty or contains no readable text", res.get_json()["error"])

if __name__ == '__main__':
    unittest.main()
