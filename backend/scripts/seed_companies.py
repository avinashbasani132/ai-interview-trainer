import os
import sys
import json

# Add backend to sys.path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, Company, DSAProblem


def seed_database():
    app = create_app('dev')
    with app.app_context():
        print("[*] Recreating database tables for updated schema...")
        db.drop_all()
        db.create_all()

        # 1. Seed Aptitude Questions
        from scripts.seed_aptitude import seed_aptitude_questions
        print("[*] Seeding aptitude questions...")
        seed_aptitude_questions()

        # 2. Seed DSA problems
        print("[*] Seeding default DSA problems...")
        problems = [
            {
                "title": "Two Sum",
                "topic": "Arrays",
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                "difficulty": "Easy",
                "example_input": "nums = [2,7,11,15], target = 9",
                "example_output": "[0,1]"
            },
            {
                "title": "Reverse String",
                "topic": "Strings",
                "description": "Write a function that reverses a string. The input string is given as an array of characters.",
                "difficulty": "Easy",
                "example_input": "s = ['h','e','l','l','o']",
                "example_output": "['o','l','l','e','h']"
            },
            {
                "title": "Valid Parentheses",
                "topic": "Stacks",
                "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                "difficulty": "Easy",
                "example_input": "s = '()[]{}'",
                "example_output": "true"
            },
            {
                "title": "Merge Sorted Array",
                "topic": "Arrays",
                "description": "You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n. Merge them into a single sorted array.",
                "difficulty": "Easy",
                "example_input": "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3",
                "example_output": "[1,2,2,3,5,6]"
            }
        ]
        for p in problems:
            db.session.add(DSAProblem(
                title=p["title"],
                topic=p["topic"],
                description=p["description"],
                difficulty=p["difficulty"],
                example_input=p["example_input"],
                example_output=p["example_output"]
            ))

        # 3. Seed Companies
        print("[*] Seeding companies...")
        
        # Categories mapping
        products = ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Adobe", "Oracle", "IBM", "Intel", "Cisco", "NVIDIA", "Salesforce", "SAP", "Tesla"]
        services = ["Infosys", "TCS", "Wipro", "Accenture", "Capgemini", "Cognizant", "Deloitte", "HCL", "Tech Mahindra", "LTIMindtree"]
        startups = ["Zoho", "Freshworks", "Flipkart", "PhonePe", "Paytm", "Swiggy", "Zomato", "Razorpay"]

        companies_list = products + services + startups
        
        for name in companies_list:
            if name in products:
                cat = "Product"
                diff = "Hard"
                dur = "2.5 Hours"
                logo = f"https://img.icons8.com/color/144/{name.lower()}-logo.png" if name.lower() not in ["meta", "sap", "oracle"] else f"https://img.icons8.com/fluency/144/{name.lower()}.png"
                desc = f"Prepare for {name}'s rigorous product-engineering selection, highlighting systems engineering, scale, and algorithmic depth."
            elif name in services:
                cat = "Service"
                diff = "Easy"
                dur = "2 Hours"
                logo = f"https://img.icons8.com/color/144/services.png"
                desc = f"Excel in {name}'s entry and lateral recruitment assessments focusing on core cognitive capability, fundamental programming, and technical MCQ rounds."
            else:
                cat = "Startup"
                diff = "Medium"
                dur = "2 Hours"
                logo = f"https://img.icons8.com/color/144/rocket.png"
                desc = f"Succeed in {name}'s agile software development loop, highlighting rapid problem solving, system design fundamentals, and startup culture alignment."

            # Fix specific logos to look extremely premium
            if name == "Google":
                logo = "https://img.icons8.com/color/144/google-logo.png"
            elif name == "Microsoft":
                logo = "https://img.icons8.com/color/144/microsoft.png"
            elif name == "Amazon":
                logo = "https://img.icons8.com/color/144/amazon.png"
            elif name == "Apple":
                logo = "https://img.icons8.com/color/144/mac-os--v2.png"
            elif name == "Meta":
                logo = "https://img.icons8.com/color/144/meta-logo.png"
            elif name == "Netflix":
                logo = "https://img.icons8.com/color/144/netflix-desktop-app.png"
            elif name == "NVIDIA":
                logo = "https://img.icons8.com/color/144/nvidia.png"
            elif name == "Tesla":
                logo = "https://img.icons8.com/color/144/tesla-logo.png"
            elif name == "Salesforce":
                logo = "https://img.icons8.com/color/144/salesforce.png"

            rounds = ["Aptitude", "Technical MCQ", "Coding", "Technical AI", "HR"]

            comp = Company(
                name=name,
                description=desc,
                logo_url=logo,
                category=cat,
                hiring_type="Software Engineer / SDE",
                difficulty=diff,
                duration=dur,
                rounds_list=json.dumps(rounds)
            )
            db.session.add(comp)

        db.session.commit()
        print("[+] Seeding completed successfully. 32 Companies, 4 DSA Problems and Aptitude Questions loaded.")

if __name__ == '__main__':
    seed_database()
