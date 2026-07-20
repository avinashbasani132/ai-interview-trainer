from app import create_app
from app.models import db

app = create_app('dev')
with app.app_context():
    db.create_all()
    print("Database initialized with V3 schema successfully.")
