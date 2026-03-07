import os
import json
import logging
from PyPDF2 import PdfReader
import google.generativeai as genai

logger = logging.getLogger(__name__)

class GenericAIServiceError(Exception):
    pass

class GeminiService:
    """
    Secure service wrapper for interacting with Google Gemini API.
    API Keys are loaded centrally via Config and never exposed or dynamically evaluated.
    """
    def __init__(self):
        # The key is loaded safely from backend configuration
        api_key = os.getenv("API_KEY")
        if not api_key:
            logger.warning("Gemini API_KEY is missing! Evaluator features will fail.")
        else:
            genai.configure(api_key=api_key)
            # Use gemini-1.5-flash as the fast and standard text model
            self.model = genai.GenerativeModel('gemini-1.5-flash')

    def parse_resume(self, pdf_file) -> dict:
        """
        Extracts text securely from a PDF in-memory buffer and uses Gemini to find skills, 
        projects, technologies, and generate initial interview questions.
        """
        text = ""
        try:
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"Failed to parse PDF securely: {e}")
            raise GenericAIServiceError("Invalid PDF format") from e

        if not text.strip():
            return {"skills": [], "projects": [], "technologies": [], "questions": [], "experience_level": "Unknown"}

        prompt = f"""
    Analyze the following resume text and extract the core technical skills, projects, 
    technologies used, and overall experience level. 
    Additionally, generate:
    1. A resume score from 0 to 100 based on standard tech resume best practices.
    2. A list of 3-5 actionable suggestions (e.g. 'Add project descriptions', 'Mention GitHub links').
    3. A list of 3-5 missing skills that would complement the existing skill profile.
    4. Generate 3-5 technical interview questions tailored to the listed skills.
    
    Format your response EXACTLY as valid JSON with NO Markdown wrappers like ```json.
    Schema: {{
        "resume_score": 85,
        "suggestions": ["Add GitHub", "Quantify results"],
        "missing_skills": ["Docker", "Kubernetes"],
        "skills": ["Skill 1", "Skill 2"], 
        "projects": ["Project 1", "Project 2"],
        "technologies": ["Tech 1", "Tech 2"],
        "questions": ["Question 1", "Question 2"],
        "experience_level": "Mid-Level"
    }}
    Resume Text: {text[:4000]}
    """
        
        try:
            response = self.model.generate_content(prompt)
            # Parse the text carefully to ensure it's valid JSON.
            result_json = json.loads(response.text.strip())
            # Ensure expected keys exist even if model skips them
            if "resume_score" not in result_json: result_json["resume_score"] = 0
            if "suggestions" not in result_json: result_json["suggestions"] = []
            if "missing_skills" not in result_json: result_json["missing_skills"] = []
            if "strengths" not in result_json: result_json["strengths"] = []
            if "weaknesses" not in result_json: result_json["weaknesses"] = []
            
            return result_json
        except Exception as e:
            logger.error(f"Gemini resume analysis failed: {e}")
            # Fallback secure empty response
            return {
                "resume_score": 0, "suggestions": [], "missing_skills": [], 
                "strengths": [], "weaknesses": [], 
                "skills": [], "projects": [], "technologies": [], "experience_level": "Unknown"
            }

    def evaluate_answer(self, question: str, user_answer: str, round_type: str) -> dict:
        """
        Evaluates a user's answer dynamically and guarantees a structured JSON output.
        """
        prompt = f"""
        You are a Senior Engineering Hiring Manager at a top tech company.
        Evaluate the user's answer to the following question for the '{round_type}' round.
        
        Question: {question}
        User Answer: {user_answer}
        
        Provide a structured evaluation in EXACTLY valid JSON format with NO Markdown wrappers.
        Required Schema:
        {{
            "score": <integer from 0 to 100>,
            "feedback": "<Clear strict feedback on what they got right/wrong>",
            "strengths": ["<strength 1>", "<strength 2>"],
            "weaknesses": ["<weakness 1>"],
            "recommendation": "<Actionable specific 1 sentence tip for improvement.>"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text.strip())
        except Exception as e:
            logger.error(f"Gemini answer evaluation failed: {e}")
            return {
                "score": 0,
                "feedback": "Evaluation service unavailable.",
                "strengths": [],
            }
            
    def generate_followup_question(self, previous_question: str, user_answer: str, round_type: str, context: list = None) -> dict:
        """
        Generates a contextual follow-up question based on the user's previous answer.
        """
        context_str = ""
        if context:
            context_str = "\nPrevious Conversation Context:\n"
            for msg in context:
                role = "Interviewee" if msg.get("role") == "user" else "Interviewer"
                context_str += f"{role}: {msg.get('content')}\n"

        prompt = f"""
        You are a Senior Engineering Hiring Manager conducting a dynamic {round_type} interview.
        The candidate just answered the following question.
        
        Question: {previous_question}
        User Answer: {user_answer}
        {context_str}
        
        Generate a thoughtful, slightly more challenging follow-up question based specifically on their answer. 
        If their last answer was incomplete, ask them to clarify or expand. If it was good, dive deeper into a specific concept they mentioned.
        
        Format your response EXACTLY as valid JSON with NO Markdown wrappers.
        Required Schema:
        {{
            "followup_question": "<The next question to ask the candidate>",
            "internal_reasoning": "<Why you chose to ask this question based on their answer>"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            res_text = response.text.strip()
            if res_text.startswith("```json"): res_text = res_text[7:]
            if res_text.endswith("```"): res_text = res_text[:-3]
            return json.loads(res_text.strip())
        except Exception as e:
            logger.error(f"Gemini follow-up generation failed: {e}")
            return {
                "followup_question": "Can you elaborate more on your previous point?",
                "internal_reasoning": "Fallback generation due to error."
            }

    def generate_resume_questions(self, text_or_skills: str, count: int = 5) -> list:
        """
        Generates 5-10 technical mock interview questions based on extracted skills.
        """
        prompt = f"""
        You are an expert technical interviewer. I will provide you with a candidate's resume skills or text.
        Your job is to generate exactly {count} personalized, challenging, open-ended interview questions.
        If they list a major technology (like Python or React), ask them how it works internally or 
        how to solve a complex performance problem with it. If they list Machine Learning, ask them 
        about data challenges, model selection, or deployment. Ask about their projects.
        
        Format your response EXACTLY as a valid JSON list of strings representing the questions.
        Example output format:
        [
            "Explain how X works internally.",
            "Describe a challenge you faced in your project and how you solved it."
        ]
        
        Candidate Info:
        {text_or_skills}
        """
        try:
            response = self.model.generate_content(prompt)
            res_text = response.text.strip()
            if res_text.startswith("```json"): res_text = res_text[7:]
            if res_text.endswith("```"): res_text = res_text[:-3]
            return json.loads(res_text.strip())
        except Exception as e:
            logger.error(f"Gemini question generation failed: {e}")
            return ["Could you walk me through your listed experience?", "What is your strongest technical skill?", "Describe a difficult bug you fixed."]

ai_service = GeminiService()
