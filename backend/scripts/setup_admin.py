import os
import sys

# Add backend to sys.path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db
from models.user import User

def setup_admin():
    app = create_app('dev')
    with app.app_context():
        print("[*] Connecting to MongoDB to configure Administrator credentials...")
        
        # 1. Remove old admin access
        old_admins = User.objects(is_admin=True)
        print(f"[*] Removing is_admin role from {old_admins.count()} existing admin accounts...")
        for old in old_admins:
            old.is_admin = False
            old.save()

        # 2. Check/Remove conflicting email 'basani@gmail.com'
        existing_user = User.objects(email="basani@gmail.com").first()
        if existing_user:
            print("[*] Email basani@gmail.com already exists. Re-creating as Admin...")
            existing_user.delete()

        # 3. Create new Admin user
        admin = User(
            username="basani",
            email="basani@gmail.com",
            is_admin=True
        )
        admin.set_password("123456")
        admin.save()

        print("[+] Admin Setup Complete!")
        print("    Email:    basani@gmail.com")
        print("    Password: 123456")
        print("    Role:     Administrator")

if __name__ == '__main__':
    setup_admin()
