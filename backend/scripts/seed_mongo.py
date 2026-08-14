import os
import sys
import json
import random

# Add backend to sys.path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db
from models.aptitude import AptitudeQuestion
from models.dsa import DSAProblem
from models.company import Company

QUESTIONS_DATA = [
    {"topic": "Problems on Trains", "text": "What is the speed of a train that travels 120 km in 2 hours?", "a": "40 km/h", "b": "60 km/h", "c": "70 km/h", "d": "80 km/h", "ans": "B"},
    {"topic": "Percentage", "text": "If 20% of a number is 40, what is the number?", "a": "100", "b": "150", "c": "200", "d": "250", "ans": "C"},
    {"topic": "Time and Work", "text": "A does a work in 10 days and B does the same work in 15 days. In how many days they together will do the same work?", "a": "5 days", "b": "6 days", "c": "8 days", "d": "9 days", "ans": "B"},
    {"topic": "Profit and Loss", "text": "A man buys an article for Rs. 27.50 and sells it for Rs. 28.60. Find his gain percent.", "a": "1%", "b": "2%", "c": "3%", "d": "4%", "ans": "D"},
    {"topic": "Problems on Trains", "text": "A 100m long train is running at a speed of 30 km/hr. Find the time taken by it to pass a man standing near the railway line.", "a": "10 sec", "b": "12 sec", "c": "15 sec", "d": "20 sec", "ans": "B"},
    {"topic": "Average", "text": "The average of first 50 natural numbers is:", "a": "25.30", "b": "25.5", "c": "25.00", "d": "12.25", "ans": "B"},
    {"topic": "Simplification", "text": "Evaluate : (2.39)^2 - (1.61)^2 / (2.39 - 1.61)", "a": "2", "b": "4", "c": "6", "d": "8", "ans": "B"},
    {"topic": "Numbers", "text": "The sum of first 5 prime numbers is:", "a": "11", "b": "18", "c": "26", "d": "28", "ans": "D"},
    {"topic": "Problems on Ages", "text": "The sum of the present ages of a father and his son is 60 years. Six years ago, father's age was five times the age of the son. After 6 years, son's age will be:", "a": "12 years", "b": "14 years", "c": "18 years", "d": "20 years", "ans": "D"},
    {"topic": "Time and Distance", "text": "A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?", "a": "3.6", "b": "7.2", "c": "8.4", "d": "10", "ans": "B"},
    {"topic": "Percentage", "text": "Two numbers are respectively 20% and 50% more than a third number. The ratio of the two numbers is:", "a": "2:5", "b": "3:5", "c": "4:5", "d": "6:7", "ans": "C"},
    {"topic": "Probability", "text": "Tickets numbered 1 to 20 are mixed up and then a ticket is drawn at random. What is the probability that the ticket drawn has a number which is a multiple of 3 or 5?", "a": "1/2", "b": "2/5", "c": "8/15", "d": "9/20", "ans": "D"},
    {"topic": "Probability", "text": "A bag contains 2 red, 3 green and 2 blue balls. Two balls are drawn at random. What is the probability that none of the balls drawn is blue?", "a": "10/21", "b": "11/21", "c": "2/7", "d": "5/7", "ans": "A"},
    {"topic": "Time and Work", "text": "A can do a piece of work in 4 hours; B and C together can do it in 3 hours, while A and C together can do it in 2 hours. How long will B alone take to do it?", "a": "8 hours", "b": "10 hours", "c": "12 hours", "d": "24 hours", "ans": "C"},
    {"topic": "Boats and Streams", "text": "A boat can travel with a speed of 13 km/hr in still water. If the speed of the stream is 4 km/hr, find the time taken by the boat to go 68 km downstream.", "a": "2 hours", "b": "3 hours", "c": "4 hours", "d": "5 hours", "ans": "C"},
    {"topic": "Simple Interest", "text": "A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. The sum is:", "a": "Rs. 650", "b": "Rs. 690", "c": "Rs. 698", "d": "Rs. 700", "ans": "C"},
    {"topic": "Compound Interest", "text": "Find the compound interest on Rs. 1000 at 10% per annum for 2 years.", "a": "Rs. 200", "b": "Rs. 210", "c": "Rs. 220", "d": "Rs. 250", "ans": "B"},
    {"topic": "Ratio and Proportion", "text": "A and B together have Rs. 1210. If 4/15 of A's amount is equal to 2/5 of B's amount, how much amount does B have?", "a": "Rs. 460", "b": "Rs. 484", "c": "Rs. 550", "d": "Rs. 664", "ans": "B"},
    {"topic": "Partnership", "text": "A and B invest in a business in the ratio 3:2. If 5% of the total profit goes to charity and A's share is Rs. 855, the total profit is:", "a": "Rs. 1425", "b": "Rs. 1500", "c": "Rs. 1537", "d": "Rs. 1576", "ans": "B"},
    {"topic": "Pipes and Cistern", "text": "Two pipes A and B can fill a tank in 20 and 30 minutes respectively. If both the pipes are used together, then how long will it take to fill the tank?", "a": "10 min", "b": "12 min", "c": "15 min", "d": "25 min", "ans": "B"},
    {"topic": "Races and Games", "text": "In a 100 m race, A beats B by 10 m and C by 13 m. In a race of 180 m, B will beat C by:", "a": "5.4 m", "b": "4.5 m", "c": "5 m", "d": "6 m", "ans": "D"},
    {"topic": "Calendar", "text": "What was the day of the week on 28th May, 2006?", "a": "Thursday", "b": "Friday", "c": "Saturday", "d": "Sunday", "ans": "D"},
    {"topic": "Clock", "text": "At what time between 7 and 8 o'clock will the hands of a clock be in the same straight line but, not together?", "a": "5 min. past 7", "b": "5 5/11 min. past 7", "c": "5 3/11 min. past 7", "d": "5 2/11 min. past 7", "ans": "B"},
    {"topic": "Area", "text": "The length of a rectangular plot is 20 metres more than its breadth. If the cost of fencing the plot @ 26.50 per metre is Rs. 5300, what is the length of the plot in metres?", "a": "40", "b": "50", "c": "120", "d": "60", "ans": "D"},
    {"topic": "Volume and Surface Area", "text": "A flagstaff 17.5 m high casts a shadow of length 40.25 m. The height of the building, which casts a shadow of length 28.75 m under similar conditions will be:", "a": "10 m", "b": "12.5 m", "c": "14 m", "d": "21.2 m", "ans": "B"},
    {"topic": "Permutation and Combination", "text": "In how many different ways can the letters of the word 'OPTICAL' be arranged so that the vowels always come together?", "a": "120", "b": "720", "c": "4320", "d": "2160", "ans": "B"},
    {"topic": "Square Root and Cube Root", "text": "Evaluate: sqrt(0.000441)", "a": "0.021", "b": "0.21", "c": "2.1", "d": "0.0021", "ans": "A"},
    {"topic": "Surds and Indices", "text": "If 3^(x-y) = 27 and 3^(x+y) = 243, then x is equal to:", "a": "0", "b": "2", "c": "4", "d": "6", "ans": "C"},
    {"topic": "Chain Rule", "text": "If 36 men can do a piece of work in 25 days, in how many days will 15 men do it?", "a": "50", "b": "56", "c": "60", "d": "72", "ans": "C"},
    {"topic": "Logarithm", "text": "If log(x) = 2, what is x? (base 10)", "a": "10", "b": "20", "c": "100", "d": "1000", "ans": "C"}
]

DSA_PROBLEMS_DATA = [
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

def seed_mongo_db():
    app = create_app('dev')
    with app.app_context():
        print("[*] Connecting to MongoDB to drop existing seed data...")
        # Clear collections
        AptitudeQuestion.objects.delete()
        DSAProblem.objects.delete()
        Company.objects.delete()

        # 1. Seed Aptitude Questions
        print("[*] Seeding 30 Aptitude questions...")
        for q in QUESTIONS_DATA:
            AptitudeQuestion(
                topic=q["topic"],
                question_text=q["text"],
                option_a=q["a"],
                option_b=q["b"],
                option_c=q["c"],
                option_d=q["d"],
                correct_option=q["ans"],
                explanation="AI evaluates logic directly, standard rule."
            ).save()
        
        # 2. Seed DSA Problems
        print("[*] Seeding 4 DSA problems...")
        for p in DSA_PROBLEMS_DATA:
            DSAProblem(
                title=p["title"],
                topic=p["topic"],
                description=p["description"],
                difficulty=p["difficulty"],
                example_input=p["example_input"],
                example_output=p["example_output"]
            ).save()

        # 3. Seed Companies
        print("[*] Seeding 33 Companies...")
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
                desc = f"Excel in {name}'s recruitment assessments focusing on core cognitive capability, fundamental programming, and technical MCQ rounds."
            else:
                cat = "Startup"
                diff = "Medium"
                dur = "2 Hours"
                logo = f"https://img.icons8.com/color/144/rocket.png"
                desc = f"Succeed in {name}'s agile software development loop, highlighting rapid problem solving, system design, and startup culture alignment."

            # Fix specific premium logos
            if name == "Google": logo = "https://img.icons8.com/color/144/google-logo.png"
            elif name == "Microsoft": logo = "https://img.icons8.com/color/144/microsoft.png"
            elif name == "Amazon": logo = "https://img.icons8.com/color/144/amazon.png"
            elif name == "Apple": logo = "https://img.icons8.com/color/144/mac-os--v2.png"
            elif name == "Meta": logo = "https://img.icons8.com/color/144/meta-logo.png"
            elif name == "Netflix": logo = "https://img.icons8.com/color/144/netflix-desktop-app.png"
            elif name == "NVIDIA": logo = "https://img.icons8.com/color/144/nvidia.png"
            elif name == "Tesla": logo = "https://img.icons8.com/color/144/tesla-logo.png"
            elif name == "Salesforce": logo = "https://img.icons8.com/color/144/salesforce.png"

            rounds = ["Aptitude", "Technical MCQ", "Coding", "Technical AI", "HR"]
            Company(
                name=name,
                description=desc,
                logo_url=logo,
                category=cat,
                hiring_type="Software Engineer / SDE",
                difficulty=diff,
                duration=dur,
                rounds_list=json.dumps(rounds)
            ).save()
            
        print("[+] MongoDB Seeding Complete! Loaded: 30 Aptitude, 4 DSA, 33 Companies.")

if __name__ == '__main__':
    seed_mongo_db()
