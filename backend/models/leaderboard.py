# Leaderboard Model / Query Helpers
# The leaderboard is computed dynamically by querying User models.
# See routes/user.py for the leaderboard endpoint.

from models.user import User

def get_top_users(limit=10):
    """
    Helper function to query top users sorted by job readiness score.
    """
    return User.query.order_by(User.job_readiness_score.desc()).limit(limit).all()
