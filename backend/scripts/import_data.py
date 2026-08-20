import os
import sys
import json
import glob
from google import genai


# Add backend to sys.path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, DSAProblem

def get_notebook_text(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        text = f"File: {os.path.basename(filepath)}\n"
        for cell in data.get('cells', []):
            if cell['cell_type'] in ('markdown', 'code'):
                source = "".join(cell.get('source', []))
                text += f"\n[{cell['cell_type'].upper()}]\n{source}\n"
        return text
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

def process_file_with_gemini(client, text):
    prompt = f"""
    You are an expert technical instructor. Extract programming exercises, problems, or questions from the following lesson material.
    
    For each distinct programming problem you find, generate a structured output. 
    If a problem has an associated code solution, you can use it to formulate the example input/output or understanding.
    
    Return EXACTLY a valid JSON list of objects. No markdown formatting like ```json.
    Schema per object:
    {{
        "title": "Short title of the problem",
        "topic": "The main topic (e.g., Arrays, Strings, Loops, Conditionals)",
        "description": "Clear description of the problem to solve",
        "difficulty": "Easy, Medium, or Hard",
        "example_input": "Example inputs if applicable",
        "example_output": "Expected output"
    }}
    
    If no problems are found, return an empty list [].
    
    Lesson Material:
    {text}
    """
    
    try:
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        res_text = response.text.strip()
        if res_text.startswith("```json"): res_text = res_text[7:]
        if res_text.endswith("```"): res_text = res_text[:-3]
        return json.loads(res_text.strip())
    except Exception as e:
        print(f"Gemini processing failed: {e}")
        return []

def run_import():
    app = create_app('dev')
    
    api_key = os.getenv("API_KEY")
    if not api_key:
        print("API_KEY is missing in environment variables. Cannot proceed.")
        return
        
    client = genai.Client(api_key=api_key)
    
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/Data Structures and introduction'))
    notebooks = glob.glob(os.path.join(data_dir, '*.ipynb'))
    
    print(f"Found {len(notebooks)} notebooks to process.")
    
    with app.app_context():
        total_inserted = 0
        for nb in notebooks:
            print(f"Processing {os.path.basename(nb)}...")
            text = get_notebook_text(nb)
            if not text:
                continue
                
            problems = process_file_with_gemini(client, text)
            print(f"Found {len(problems)} problems in {os.path.basename(nb)}.")
            
            for p in problems:
                try:
                    prob = DSAProblem(
                        title=p.get('title', 'Untitled'),
                        topic=p.get('topic', 'General'),
                        description=p.get('description', ''),
                        difficulty=p.get('difficulty', 'Easy'),
                        example_input=p.get('example_input', ''),
                        example_output=p.get('example_output', '')
                    )
                    db.session.add(prob)
                    total_inserted += 1
                except Exception as e:
                    print(f"Error creating problem: {e}")
                    
            db.session.commit()
            
        print(f"\nSuccessfully imported {total_inserted} new questions into the database!")

if __name__ == '__main__':
    run_import()
