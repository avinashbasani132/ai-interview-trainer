import os
import sys
import json
import PyPDF2
import google.generativeai as genai

# Add backend to sys.path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, AptitudeQuestion

def process_chunk_with_gemini(model, text, topic):
    prompt = f"""
    You are an expert technical interviewer and test creator.
    Read the following text extracted from a recruitment preparation book. 
    Extract any multiple-choice aptitude, reasoning, or technical questions you find.
    
    Return EXACTLY a valid JSON list of objects. No markdown formatting like ```json.
    Schema per object:
    {{
        "topic": "The general topic (e.g., Quantitative Aptitude, Logical Reasoning, Verbal Ability)",
        "question_text": "The full text of the question",
        "option_a": "Option A text",
        "option_b": "Option B text",
        "option_c": "Option C text",
        "option_d": "Option D text",
        "correct_option": "A, B, C, or D",
        "explanation": "Explanation if provided, otherwise empty string"
    }}
    
    If no clear multiple-choice questions are found in this chunk, return an empty list [].
    
    Text chunk:
    {text}
    """
    
    try:
        response = model.generate_content(prompt)
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
    if not api_key or api_key == "your_gemini_api_key_here":
        print("ERROR: API_KEY is missing or invalid in backend/.env")
        print("Please provide a valid Google Gemini API Key to process this massive PDF.")
        return
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    pdf_path = r"C:\Users\This PC\OneDrive\Desktop\CampusRecruitmentBook.pdf"
    
    print(f"Opening {pdf_path}...")
    try:
        reader = PyPDF2.PdfReader(pdf_path)
    except Exception as e:
        print(f"Failed to read PDF: {e}")
        return
        
    total_pages = len(reader.pages)
    print(f"PDF has {total_pages} pages. Processing in chunks...")
    
    with app.app_context():
        total_inserted = 0
        chunk_size = 10 # Process 10 pages at a time to stay within token limits and keep high accuracy
        
        for i in range(0, total_pages, chunk_size):
            print(f"Processing pages {i+1} to min({i+chunk_size}, {total_pages})...")
            chunk_text = ""
            for j in range(i, min(i + chunk_size, total_pages)):
                try:
                    chunk_text += reader.pages[j].extract_text() + "\n"
                except:
                    pass
            
            if not chunk_text.strip():
                continue
                
            questions = process_chunk_with_gemini(model, chunk_text, "Aptitude")
            if questions:
                print(f"  Found {len(questions)} questions in this chunk.")
                
            for q in questions:
                try:
                    question = AptitudeQuestion(
                        topic=q.get('topic', 'General'),
                        question_text=q.get('question_text', ''),
                        option_a=q.get('option_a', ''),
                        option_b=q.get('option_b', ''),
                        option_c=q.get('option_c', ''),
                        option_d=q.get('option_d', ''),
                        correct_option=q.get('correct_option', 'A'),
                        explanation=q.get('explanation', '')
                    )
                    db.session.add(question)
                    total_inserted += 1
                except Exception as e:
                    print(f"  Error creating question: {e}")
                    
            db.session.commit()
            
        print(f"\nSuccessfully imported {total_inserted} aptitude questions into the database!")

if __name__ == '__main__':
    run_import()
