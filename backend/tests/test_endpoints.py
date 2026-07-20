from app import create_app
from routes.user import get_user_history, get_leaderboard
from routes.roadmap import get_roadmap
import unittest.mock
import traceback

app = create_app()

with app.app_context():
    print("--- TESTING HISTORY ---")
    with app.test_request_context('/api/user/history'):
        with unittest.mock.patch('routes.user.get_jwt_identity', return_value=1):
            try:
                res = get_user_history()
                print("History OK:", res[1])
            except Exception as e:
                print("History ERROR:", repr(e))
                traceback.print_exc()

    print("\n--- TESTING LEADERBOARD ---")
    with app.test_request_context('/api/user/analytics/leaderboard'):
        with unittest.mock.patch('routes.user.get_jwt_identity', return_value=1):
            try:
                res = get_leaderboard()
                print("Leaderboard OK:", res[1])
            except Exception as e:
                print("Leaderboard ERROR:", repr(e))
                traceback.print_exc()

    print("\n--- TESTING ROADMAP ---")
    with app.test_request_context('/api/roadmap/'):
        with unittest.mock.patch('routes.roadmap.get_jwt_identity', return_value=1):
            try:
                res = get_roadmap()
                print("Roadmap OK:", res[1])
            except Exception as e:
                print("Roadmap ERROR:", repr(e))
                traceback.print_exc()
