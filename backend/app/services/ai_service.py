import os
import json
import logging
import re
from PyPDF2 import PdfReader
from google import genai
from google.genai import types

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
        self.client = None
        self.model_name = 'gemini-2.0-flash'
        if not api_key:
            logger.warning("Gemini API_KEY is missing! Evaluator features will fail.")
        else:
            self.client = genai.Client(api_key=api_key)

    def _clean_and_parse_json(self, text: str):
        text_clean = text.strip()
        # Try direct load first
        try:
            return json.loads(text_clean)
        except Exception:
            pass
            
        # Try matching JSON block (either object or array)
        match_obj = re.search(r'(\{.*\})', text_clean, re.DOTALL)
        if match_obj:
            try:
                return json.loads(match_obj.group(1))
            except Exception:
                pass

        match_arr = re.search(r'(\[.*\])', text_clean, re.DOTALL)
        if match_arr:
            try:
                return json.loads(match_arr.group(1))
            except Exception:
                pass
                
        # Clean Markdown markers
        text_clean = re.sub(r'^```(?:json)?', '', text_clean, flags=re.MULTILINE)
        text_clean = re.sub(r'```$', '', text_clean, flags=re.MULTILINE)
        return json.loads(text_clean.strip())


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
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            # Parse the text carefully to ensure it's valid JSON.
            result_json = self._clean_and_parse_json(response.text)
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
        You are an elite, highly critical Technical Interviewer at a premier software company (like Google, Netflix, or Stripe).
        Evaluate the candidate's response to the following question for a '{round_type}' round.
        
        Question: {question}
        Candidate's Answer: {user_answer}
        
        Your evaluation MUST be rigorous and objective:
        1. Assess Technical Accuracy: Check if they use correct concepts, syntax, patterns, and terminology.
        2. Assess Completeness: Check if they actually answered all constraints of the question.
        3. Assess Clarity & Communication: Check if the response is well-articulated, clear, and logical.
        4. Assess Practical Application: Check if they refer to real-world experience, testing, scaling, or edge cases.
        
        Scoring Rubric:
        - 90-100: Exceptional, detailed response showing deep senior-level mastery.
        - 70-89: Solid answer covering all core points with minor gaps.
        - 50-69: Partially correct but vague or missing key technical details.
        - Under 50: Incorrect, extremely short, or generic (e.g. "yes", "i don't know").
        
        Provide a structured evaluation in EXACTLY valid JSON format with NO Markdown wrappers.
        Required Schema:
        {{
            "score": <overall integer from 0 to 100>,
            "feedback": "<Deep constructive feedback on accuracy, correctness, and gaps>",
            "strengths": ["<strength 1>", "<strength 2>"],
            "weaknesses": ["<weakness 1>", "<weakness 2>"],
            "recommendation": "<Specific, actionable technical advice on how to improve this answer.>"
        }}
        """
        
        try:
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return self._clean_and_parse_json(response.text)
        except Exception as e:
            logger.error(f"Gemini answer evaluation failed: {e}")
            return {
                "score": 0,
                "feedback": "Evaluation service unavailable.",
                "strengths": [],
                "weaknesses": [],
                "recommendation": "Check internet or API key."
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
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return self._clean_and_parse_json(response.text)
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
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return self._clean_and_parse_json(response.text)
        except Exception as e:
            logger.error(f"Gemini question generation failed: {e}")
            return ["Could you walk me through your listed experience?", "What is your strongest technical skill?", "Describe a difficult bug you fixed."]


    def extract_resume_details_for_interview(self, text: str) -> dict:
        """
        Extracts structured resume data for Resume-Based Interview, decide difficulty level,
        and generate detailed resume analysis.
        """
        prompt = f"""
        You are a Senior NLP Engineer and Technical Hiring Director.
        Analyze the following resume text and extract the candidate's structured profile information.
        Also, provide a detailed resume evaluation analysis.

        Resume Text:
        {text[:5000]}

        You must extract the following fields exactly, adhering to this strict JSON format:
        {{
            "name": "Candidate's full name",
            "education": ["Institution - Degree (Year) - CGPA/GPA (if present)"],
            "skills": ["Skill 1", "Skill 2", ...],
            "projects": [
                {{
                    "title": "Project Name",
                    "technologies": ["Flask", "React", ...],
                    "description": "Short project description",
                    "challenges": "Key technical challenges faced"
                }}
            ],
            "experience": [
                {{
                    "role": "Job Role / Title",
                    "company": "Company Name",
                    "dates": "Start Date - End Date",
                    "responsibilities": "Job responsibilities and impact"
                }}
            ],
            "certifications": ["Certification Name"],
            "technologies": ["Python", "Docker", "Java", ...],
            "achievements": ["Achievement Name/Description"],
            "github": "GitHub URL (if found, e.g. github.com/username)",
            "linkedin": "LinkedIn URL (if found, e.g. linkedin.com/in/username)",
            "experience_level": "Identify level from: Fresh Graduate, Internship, Experienced Candidate",
            "difficulty_level": "Easy if Fresh Graduate, Medium if Internship, Advanced if Experienced Candidate",
            "analysis": {{
                "score": 85,
                "strengths": ["Strengths descriptions"],
                "weaknesses": ["Weaknesses/gaps in skills/profile"],
                "suggestions": ["Improvement actions"]
            }}
        }}

        Format your response EXACTLY as valid JSON with NO Markdown wrappers like ```json.
        """
        try:
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            data = self._clean_and_parse_json(response.text)
            
            # Post-processing difficulty rules just to be absolutely sure
            exp = data.get("experience_level", "").lower()
            if "experience" in exp or "mid" in exp or "senior" in exp or len(data.get("experience", [])) >= 2:
                data["difficulty_level"] = "Advanced"
                data["experience_level"] = "Experienced Candidate"
            elif "intern" in exp or "placement" in exp or "internship" in exp:
                data["difficulty_level"] = "Medium"
                data["experience_level"] = "Internship"
            else:
                data["difficulty_level"] = "Easy"
                data["experience_level"] = "Fresh Graduate"
                
            return data
        except Exception as e:
            logger.error(f"Gemini details extraction failed: {e}")
            return {
                "name": "Candidate", "education": [], "skills": [], "projects": [], "experience": [],
                "certifications": [], "technologies": [], "achievements": [], "github": "", "linkedin": "",
                "experience_level": "Fresh Graduate", "difficulty_level": "Easy",
                "analysis": {"score": 50, "strengths": ["Listed background"], "weaknesses": ["Could not parse sections"], "suggestions": ["Re-upload resume"]}
            }

    def generate_resume_interview_plan(self, resume_details: dict) -> list:
        """
        Generates 5 tailored main interview questions based strictly on the candidate's resume details.
        """
        difficulty = resume_details.get("difficulty_level", "Easy")
        prompt = f"""
        You are a Lead Tech Recruiter at a top tech company.
        Your task is to generate exactly 5 tailored technical/project interview questions for a candidate with the following resume details.
        
        Difficulty level: {difficulty} (Easy for Fresh Graduate, Medium for Internship, Advanced for Experienced Candidate)
        Candidate Details:
        {json.dumps(resume_details, indent=2)}

        CRITICAL CONSTRAINTS:
        1. All questions MUST be directly generated from the candidate's listed projects, technologies, experience, education, internships, certifications, or achievements.
        2. Never ask completely unrelated questions.
        3. For projects: Ask about architecture, database choice, deployment, testing, or challenges.
        4. For specific skills / technologies: If they list Python, React, Flask, Java, MongoDB, AWS, or Machine Learning, ask relevant technical questions (e.g. internals, performance tuning, differences from alternative technologies).
        5. The difficulty of the questions must be aligned with '{difficulty}'.

        Format your response EXACTLY as a valid JSON list of 5 string questions.
        Example output format:
        [
            "In your project X, you used database Y. Why did you choose it over alternatives?",
            "..."
        ]
        Do not use Markdown wrappers.
        """
        try:
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return self._clean_and_parse_json(response.text)[:5]
        except Exception as e:
            logger.error(f"Gemini resume interview plan failed: {e}")
            # Fallback based on technologies
            techs = resume_details.get("technologies", [])
            fallback = [
                f"Explain how your primary technology {' '.join(techs[:2]) if techs else 'stack'} works internally.",
                "Describe the architecture of your main project and how you decided on the database.",
                "What was the most challenging bug or technical issue you faced, and how did you resolve it?",
                "How did you test and deploy your projects?",
                "What is your approach to optimizing performance in your application?"
            ]
            return fallback

    def evaluate_resume_answer(self, question: str, answer: str, resume_details: dict) -> dict:
        """
        Evaluates a candidate's answer based on the resume context and evaluates 6 key criteria:
        Technical Accuracy, Confidence, Communication, Problem Solving, Explanation Quality, Practical Knowledge.
        """
        prompt = f"""
        You are a Senior Engineering Hiring Manager.
        Evaluate the candidate's response to the following question.
        
        Question: {question}
        Candidate Answer: {answer}
        Candidate Resume Profile:
        {json.dumps(resume_details, indent=2)}

        Evaluate the response on the following criteria (score each from 0 to 100):
        1. Technical Accuracy
        2. Confidence
        3. Communication
        4. Problem Solving
        5. Explanation Quality
        6. Practical Knowledge

        Also provide:
        - Score: Overall score out of 100
        - Feedback: Strict feedback on what was correct/incorrect
        - Strengths: List of strengths in this response
        - Weaknesses: List of weaknesses in this response
        - Recommendation: Improvement tips
        - Hint: If the candidate struggled or the score is below 60, provide a subtle hint to guide them towards a better answer. If they did well, leave it empty.

        Format your response EXACTLY as valid JSON with NO Markdown wrappers.
        Required Schema:
        {{
            "score": <overall integer 0-100>,
            "technical_accuracy": <integer 0-100>,
            "confidence": <integer 0-100>,
            "communication": <integer 0-100>,
            "problem_solving": <integer 0-100>,
            "explanation_quality": <integer 0-100>,
            "practical_knowledge": <integer 0-100>,
            "feedback": "Strict feedback here.",
            "strengths": ["Strength 1", ...],
            "weaknesses": ["Weakness 1", ...],
            "recommendation": "Recommendation tip.",
            "hint": "Subtle guiding hint (if score < 60)"
        }}
        """
        try:
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return self._clean_and_parse_json(response.text)
        except Exception as e:
            logger.error(f"Gemini resume answer evaluation failed: {e}")
            return {
                "score": 50, "technical_accuracy": 50, "confidence": 50, "communication": 50,
                "problem_solving": 50, "explanation_quality": 50, "practical_knowledge": 50,
                "feedback": "Service temporarily unavailable. Evaluation defaulted.",
                "strengths": [], "weaknesses": ["Evaluation failed"], "recommendation": "Try resubmitting answer.",
                "hint": "Check code syntax or elaborate on the concepts you used."
            }

    def generate_hint_for_question(self, question: str, resume_details: dict) -> str:
        """
        Generates a subtle hint for a question to help a struggling candidate.
        Does NOT reveal the complete answer.
        """
        prompt = f"""
        The candidate is struggling with this interview question:
        "{question}"
        
        Using the candidate's resume context:
        {json.dumps(resume_details, indent=2)}

        Provide a brief, helpful, subtle hint or clue.
        Do NOT reveal the full answer. Ask a guiding question or remind them of a key concept in their profile.
        Format your response as a single, clear sentence. No JSON or markdown.
        """
        try:
            if not self.client:
                return "Think about the core architecture and what problem it solves."
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return response.text.strip()
        except Exception:
            return "Try to break down the problem into smaller parts and explain your approach step-by-step."

    def generate_followup_for_answer(self, question: str, answer: str, context: list, resume_details: dict) -> dict:
        """
        Generates a dynamic follow-up question based on the candidate's response.
        Example: If candidate mentions Flask, ask why Flask over Django, how routing works, etc.
        """
        context_str = ""
        for msg in context:
            role = "Candidate" if msg.get("role") == "user" else "Interviewer"
            context_str += f"{role}: {msg.get('content')}\n"

        prompt = f"""
        You are a Senior Engineering Interviewer conducting a Resume-Based AI Interview.
        The candidate has just answered a question.

        Previous question: {question}
        Candidate answer: {answer}
        
        Conversation Context:
        {context_str}

        Candidate Resume details:
        {json.dumps(resume_details, indent=2)}

        Generate a thoughtful, conversational follow-up question based strictly on their response or listed resume details.
        If they mentioned a technology (like Flask, React, Docker), ask a follow-up about that technology (e.g. why that over alternatives, how a component works, security).
        Ensure the question is professional and directly related.

        Format your response EXACTLY as valid JSON with NO Markdown wrappers:
        {{
            "followup_question": "Why did you choose Flask instead of Django in your project?",
            "internal_reasoning": "Candidate mentioned Flask. Probing architectural reasoning."
        }}
        """
        try:
            if not self.client:
                raise GenericAIServiceError("API key not configured")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return self._clean_and_parse_json(response.text)
        except Exception as e:
            logger.error(f"Gemini resume follow-up failed: {e}")
            return {
                "followup_question": "Can you elaborate further on the design decisions you made in that project?",
                "internal_reasoning": "Fallback due to API error."
            }

ai_service = GeminiService()

