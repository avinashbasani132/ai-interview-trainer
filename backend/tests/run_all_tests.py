import os
import sys
import unittest

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app


class TestAIInterviewTrainer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app('dev')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def test_01_health_check(self):
        """Test health endpoint."""
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'healthy')

    def test_02_admin_login(self):
        """Test login for basani@gmail.com."""
        res = self.client.post('/api/auth/login', json={
            'email': 'basani@gmail.com',
            'password': '123456'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        self.assertTrue(data.get('data', {}).get('is_admin'))
        self.assertIn('access_token', data.get('data', {}))

    def test_03_companies_list(self):
        """Test company listing endpoint."""
        login_res = self.client.post('/api/auth/login', json={
            'email': 'basani@gmail.com',
            'password': '123456'
        }).get_json()
        token = login_res['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.get('/api/company/list', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('companies', data)
        self.assertGreaterEqual(len(data['companies']), 30)


    def test_04_admin_stats(self):
        """Test admin statistics with authentication."""
        login_res = self.client.post('/api/auth/login', json={
            'email': 'basani@gmail.com',
            'password': '123456'
        }).get_json()
        token = login_res['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.get('/api/admin/stats', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('total_users', data)
        self.assertIn('total_sessions', data)

    def test_05_admin_questions(self):
        """Test admin questions listing."""
        login_res = self.client.post('/api/auth/login', json={
            'email': 'basani@gmail.com',
            'password': '123456'
        }).get_json()
        token = login_res['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.get('/api/admin/questions', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('questions', data)
        self.assertGreaterEqual(len(data['questions']), 100)

    def test_06_aptitude_start(self):
        """Test starting aptitude round."""
        login_res = self.client.post('/api/auth/login', json={
            'email': 'basani@gmail.com',
            'password': '123456'
        }).get_json()
        token = login_res['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.post('/api/interview/aptitude/start', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('questions', data)
        self.assertGreaterEqual(len(data['questions']), 20)

    def test_07_dsa_daily(self):
        """Test daily DSA problem retrieval."""
        res = self.client.get('/api/dsa/daily')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('title', data)

if __name__ == '__main__':
    unittest.main(verbosity=2)
