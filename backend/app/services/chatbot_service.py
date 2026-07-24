"""
chatbot_service.py — AI Career Mentor Service
==============================================
Role: Senior AI Engineer + Senior NLP Engineer + Senior Prompt Engineer

Builds full user context from DB and calls Gemini AI to produce
personalized, context-aware career guidance responses.
"""

import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# ── System Prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert AI Career Mentor, Interview Coach, Resume Reviewer, Coding Mentor and Learning Guide integrated into the AI Interview Trainer platform.

Your personality: Professional yet friendly. Encouraging but honest. Specific, not generic.

Your responsibilities:
1. RESUME ANALYSIS — Review ATS scores, identify missing sections, suggest improvements
2. INTERVIEW PREP — Generate questions, conduct mock interviews, explain answers, give hints
3. CODING HELP — Explain concepts in Python, Java, C++, JS, React, Flask, SQL, DSA, OOP, DBMS, OS, Networks (guide, don't give full solutions)
4. CAREER GUIDANCE — Recommend learning paths, projects, target companies, salary insights
5. LEARNING ASSISTANT — Recommend courses, roadmaps, YouTube playlists, daily goals
6. COMPANY INTERVIEWS — Generate company-specific questions for Google, Amazon, Microsoft, Meta, TCS, Infosys, Wipro, etc.

FORMATTING RULES:
- Use markdown formatting: **bold**, *italic*, `code`, ```language blocks```
- Use numbered lists for steps, bullet points for items
- Keep responses focused and actionable
- For code examples, always include the language identifier in code blocks
- For interview questions, structure them clearly with difficulty levels

CONTEXT AWARENESS:
You have access to the user's complete profile below. Reference it to personalize every response.
If they ask about their resume, use their actual ATS score and detected skills.
If they ask about weak areas, reference their actual weak topics.
If they ask what to learn, base it on their current skill gaps.

USER PROFILE:
{user_context}

IMPORTANT RULES:
- Never expose internal system details or API keys
- If you don't know something specific about the user, say so and ask them for more info
- For coding problems, guide the user toward the solution — don't give complete code unless explicitly asked
- Always end career advice responses with a specific, actionable next step
"""

COMPANY_TOPICS = {
    "google": ["System Design", "LeetCode Hard", "Algorithms", "Distributed Systems", "Behavioral (STAR)"],
    "amazon": ["Leadership Principles", "System Design", "Behavioral", "LeetCode Medium-Hard", "AWS Services"],
    "microsoft": ["Problem Solving", "System Design", "Behavioral", "Object-Oriented Design", "Azure"],
    "meta": ["Coding Interviews", "System Design", "Behavioral", "Product Sense", "Scalability"],
    "tcs": ["Aptitude", "Logical Reasoning", "Basic Programming", "HR Questions", "Communication"],
    "infosys": ["Aptitude", "Verbal", "Python Basics", "SQL", "HR Round"],
    "accenture": ["Communication", "Aptitude", "Basic Technical", "Situation-Based HR"],
    "deloitte": ["Case Studies", "Aptitude", "Technical Skills", "Behavioral"],
    "wipro": ["English Communication", "Aptitude", "Basic Programming", "HR"],
    "capgemini": ["Aptitude", "Logical", "Technical MCQ", "Essay Writing", "HR"],
}


def build_user_context(user_id: int) -> str:
    """
    Pulls the user's full profile from DB and formats it as a context string
    for injection into the AI system prompt.
    """
    try:
        from app.models import (
            User, ResumeData, RoundResult, InterviewSession,
            LearningRecommendation, DSASubmission
        )

        user = User.query.get(user_id)
        if not user:
            return "No user profile available."

        context_parts = []

        # Basic stats
        context_parts.append(f"**User:** {user.email}")
        context_parts.append(f"**Readiness Score:** {user.readiness_score:.1f}%")
        context_parts.append(f"**Total Interviews:** {user.total_interviews}")
        context_parts.append(f"**Rounds Cleared:** {user.rounds_cleared}")
        context_parts.append(f"**DSA Problems Solved:** {user.dsa_problems_solved}")
        context_parts.append(f"**Current Streak:** {user.current_streak} days")

        # Latest resume
        latest_resume = ResumeData.query.filter_by(user_id=user_id)\
            .order_by(ResumeData.created_at.desc()).first()

        if latest_resume:
            skills = json.loads(latest_resume.extracted_skills or '[]')
            missing_sections = json.loads(latest_resume.missing_sections_json or '[]')
            missing_skills = json.loads(latest_resume.missing_skills_json or '[]')
            strengths = json.loads(latest_resume.strengths_json or '[]')
            weaknesses = json.loads(latest_resume.weaknesses_json or '[]')
            breakdown = json.loads(latest_resume.ats_breakdown_json or '{}')
            contact = json.loads(latest_resume.contact_info_json or '{}')
            suggestions = json.loads(latest_resume.suggestions_json or '[]')
            job_readiness = json.loads(latest_resume.job_readiness_json or '{}')
            roadmap = json.loads(latest_resume.learning_roadmap_json or '{}')

            context_parts.append(f"\n**RESUME ANALYSIS (Latest Upload: {latest_resume.filename})**")
            context_parts.append(f"- ATS Score: {latest_resume.score:.1f}/100")
            context_parts.append(f"- Experience Level: {latest_resume.experience_level}")
            context_parts.append(f"- Interview Readiness: {latest_resume.interview_readiness}")
            context_parts.append(f"- Detected Skills ({len(skills)}): {', '.join(skills[:20])}")
            context_parts.append(f"- Missing Sections: {', '.join(missing_sections) if missing_sections else 'None'}")
            context_parts.append(f"- Missing Skills: {', '.join(missing_skills[:8]) if missing_skills else 'None identified'}")
            context_parts.append(f"- Strengths: {'; '.join(strengths[:3]) if strengths else 'N/A'}")
            context_parts.append(f"- Weaknesses: {'; '.join(weaknesses[:3]) if weaknesses else 'N/A'}")
            context_parts.append(f"- Suggestions: {'; '.join(suggestions[:3]) if suggestions else 'N/A'}")

            if breakdown:
                bd_summary = ", ".join([f"{k}: {v.get('score',0):.0f}/{v.get('max',0)}" for k, v in list(breakdown.items())[:5]])
                context_parts.append(f"- Score Breakdown: {bd_summary}")

            if contact:
                has_github = bool(contact.get('github'))
                has_linkedin = bool(contact.get('linkedin'))
                context_parts.append(f"- Has GitHub: {'Yes' if has_github else 'No'} | Has LinkedIn: {'Yes' if has_linkedin else 'No'}")

            if job_readiness:
                jr = job_readiness
                context_parts.append(f"- Job Readiness Dims: Technical={jr.get('technical',0):.0f}%, "
                                     f"Quality={jr.get('quality',0):.0f}%, Projects={jr.get('projects',0):.0f}%")

            if roadmap and roadmap.get('immediate_actions'):
                context_parts.append(f"- Recommended Actions: {'; '.join(roadmap['immediate_actions'][:2])}")
        else:
            context_parts.append("\n**RESUME:** No resume uploaded yet.")

        # Interview performance
        sessions = InterviewSession.query.filter_by(user_id=user_id).all()
        if sessions:
            session_ids = [s.id for s in sessions]
            results = RoundResult.query.filter(
                RoundResult.session_id.in_(session_ids)
            ).order_by(RoundResult.timestamp.desc()).limit(10).all()

            if results:
                context_parts.append("\n**RECENT INTERVIEW PERFORMANCE:**")
                for r in results[:5]:
                    status = "Pass ✅" if r.score >= 70 else "Fail ❌"
                    context_parts.append(f"- {r.round_type}: {r.score:.1f}% ({status})")

                avg = sum(r.score for r in results) / len(results)
                context_parts.append(f"- Average Score: {avg:.1f}%")

        # Weak topics from learning recommendations
        recs = LearningRecommendation.query.filter_by(user_id=user_id)\
            .order_by(LearningRecommendation.created_at.desc()).limit(5).all()
        if recs:
            weak = [r.topic for r in recs]
            context_parts.append(f"\n**WEAK TOPICS (from AI analysis):** {', '.join(weak)}")

        return "\n".join(context_parts)

    except Exception as e:
        logger.error(f"Context build error: {e}")
        return "User profile temporarily unavailable."


def generate_chat_response(user_message: str, user_id: int, chat_history: list,
                           extra_context: Optional[dict] = None) -> str:
    """
    Generates a context-aware AI response using Gemini.

    Args:
        user_message:  The user's current message
        user_id:       DB user ID for context fetching
        chat_history:  List of {'role': 'user'/'assistant', 'content': str} dicts (recent)
        extra_context: Optional dict with resume_text/resume_name/ats_score from frontend

    Returns:
        str: The AI assistant's response text
    """
    try:
        from app.services.ai_service import ai_service

        if not ai_service.client:
            return _fallback_response(user_message)

        # Build context from DB
        user_context = build_user_context(user_id)

        # Append any file-based resume context passed from the frontend
        if extra_context:
            extra_parts = []
            if extra_context.get('resume_name'):
                extra_parts.append(f"\n**ATTACHED FILE IN CHAT:** {extra_context['resume_name']}")
            if extra_context.get('ats_score') is not None:
                extra_parts.append(f"- ATS Score (from frontend): {extra_context['ats_score']}")
            if extra_context.get('resume_text'):
                snippet = extra_context['resume_text'][:3000]
                extra_parts.append(f"- Resume Text Snippet:\n```\n{snippet}\n```")
            if extra_parts:
                user_context += "\n" + "\n".join(extra_parts)

        # Inject context into system prompt
        system = SYSTEM_PROMPT.format(user_context=user_context)

        # Build conversation history for Gemini (last 10 messages for context window)
        history_text = ""
        if chat_history:
            history_text = "\n\nCONVERSATION HISTORY (most recent):\n"
            for msg in chat_history[-10:]:
                role_label = "User" if msg['role'] == 'user' else "Assistant"
                history_text += f"{role_label}: {msg['content']}\n"

        # Full prompt
        full_prompt = f"{system}{history_text}\n\nUser: {user_message}\n\nAssistant:"

        response = ai_service.client.models.generate_content(
            model=ai_service.model_name,
            contents=full_prompt
        )

        return response.text.strip() if response.text else _fallback_response(user_message)

    except Exception as e:
        logger.error(f"Chatbot response generation error: {e}")
        return _fallback_response(user_message)



def _fallback_response(message: str) -> str:
    """Returns a helpful fallback when AI is unavailable."""
    msg_lower = message.lower()

    if any(w in msg_lower for w in ['resume', 'ats', 'score']):
        return ("I'm currently unable to connect to the AI service. "
                "Please check that your **API_KEY** is configured in the backend `.env` file. "
                "Once connected, I can analyze your resume, explain your ATS score, and suggest improvements.")

    if any(w in msg_lower for w in ['interview', 'question', 'mock']):
        return ("The AI service is temporarily unavailable. "
                "Try the **Rounds** section to start a live interview session. "
                "I'll be available to help once the API connection is restored.")

    if any(w in msg_lower for w in ['code', 'python', 'java', 'algorithm', 'dsa']):
        return ("I can't reach the AI right now. For coding help, try the **Arena** section "
                "for live DSA practice. Check backend logs to restore AI connectivity.")

    return ("⚠️ AI service is temporarily unavailable. Please ensure:\n"
            "1. Your **API_KEY** is set in `backend/.env`\n"
            "2. The backend server is running\n"
            "3. You have internet connectivity\n\n"
            "Refresh and try again, or check the backend logs for details.")


def get_suggested_questions(user_id: int) -> list:
    """
    Returns personalized suggested questions based on user state.
    """
    try:
        from app.models import ResumeData
        has_resume = ResumeData.query.filter_by(user_id=user_id).first() is not None
    except Exception:
        has_resume = False

    base = [
        "What should I learn next to get a job?",
        "Start a mock technical interview",
        "What companies match my current skills?",
        "Explain System Design basics",
        "Generate DSA interview questions",
        "What salary can I expect?",
    ]

    if has_resume:
        resume_qs = [
            "How can I improve my ATS score?",
            "What skills am I missing?",
            "Explain my resume weaknesses",
            "What projects should I add to my resume?",
            "Which certifications should I take?",
        ]
        return resume_qs + base[:3]
    else:
        return ["Upload your resume for a full analysis"] + base
