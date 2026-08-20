from app import create_app
from models import User

app = create_app()

with app.app_context():
    user = User.query.first()
    if user:
        from routes.user import get_dashboard_data
        import unittest.mock
        
        with app.test_request_context('/api/user/dashboard'):
            with unittest.mock.patch('routes.user.get_jwt_identity', return_value=user.id):
                try:
                    res = get_dashboard_data()
                    print("Status:", res[1])
                except Exception:
                    import traceback
                    traceback.print_exc()

