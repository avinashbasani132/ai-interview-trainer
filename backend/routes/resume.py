"""
resume.py — Production-Grade ATS Resume Analyzer Routes v2.0
============================================================
Role: Senior Flask Engineer + Senior API Designer

Endpoints:
  POST /api/resume/upload-resume       Upload & analyze PDF/DOCX resume
  GET  /api/resume/history             All past analyses for user
  GET  /api/resume/history/<id>        Full detail of a specific analysis
  GET  /api/resume/report/<id>         Download PDF report
"""

import io
import json
import logging
import re
from datetime import datetime

from flask import Blueprint, request, jsonify, send_file, Response
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import ResumeData
from services.docx_parser import extract_text
from services.ats_analyzer import ATSAnalyzer

logger = logging.getLogger(__name__)
resume_bp = Blueprint('resume', __name__)

_ats = ATSAnalyzer()

ALLOWED_EXTENSIONS = {'.pdf', '.docx'}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _safe_json(value, default):
    """Safe JSON load with fallback."""
    try:
        return json.loads(value) if value else default
    except Exception:
        return default


def _generate_learning_roadmap(skills: list, missing_skills: list, exp_level: str) -> dict:
    """
    Step 18: Personalized Learning Roadmap.
    Returns a structured roadmap based on the candidate's profile.
    """
    roadmap = {
        "immediate_actions": [],
        "courses": [],
        "projects": [],
        "dsa_topics": [],
        "interview_prep": [],
    }

    is_fresher = "Fresher" in exp_level or "Entry" in exp_level

    # Immediate actions
    if not skills:
        roadmap["immediate_actions"].append("Build a foundation: Choose Python or JavaScript as your primary language and complete a structured course")
    if is_fresher:
        roadmap["immediate_actions"].append("Create 2-3 full-stack projects and deploy them to demonstrate skills")
        roadmap["immediate_actions"].append("Solve 50 LeetCode Easy problems to build DSA confidence")
    else:
        roadmap["immediate_actions"].append("Update GitHub with recent projects and ensure READMEs are professional")
        roadmap["immediate_actions"].append("Solve 20 LeetCode Medium problems per week in your target language")

    # Courses
    course_map = {
        "python": {"name": "Python for Everybody (Coursera)", "url": "https://coursera.org/specializations/python"},
        "javascript": {"name": "The Complete JavaScript Course (Udemy)", "url": "https://udemy.com"},
        "react": {"name": "React - The Complete Guide (Udemy)", "url": "https://udemy.com"},
        "aws": {"name": "AWS Cloud Practitioner (AWS Training)", "url": "https://aws.amazon.com/training"},
        "machine learning": {"name": "Machine Learning Specialization (Coursera - Andrew Ng)", "url": "https://coursera.org"},
        "docker": {"name": "Docker & Kubernetes: The Practical Guide (Udemy)", "url": "https://udemy.com"},
        "system design": {"name": "Grokking the System Design Interview (Educative)", "url": "https://educative.io"},
    }

    added_courses = set()
    for skill in (missing_skills or [])[:5]:
        skill_lower = skill.lower()
        for key, course in course_map.items():
            if key in skill_lower and course["name"] not in added_courses:
                roadmap["courses"].append(course)
                added_courses.add(course["name"])

    if not roadmap["courses"]:
        roadmap["courses"] = [
            {"name": "CS50x: Introduction to Computer Science (Harvard/edX)", "url": "https://cs50.harvard.edu"},
            {"name": "The Odin Project — Full Stack (Free)", "url": "https://theodinproject.com"},
        ]

    # Projects
    if is_fresher:
        roadmap["projects"] = [
            "Build a full-stack CRUD application (todo app, blog, or e-commerce) with authentication",
            "Create a REST API with user authentication using Flask or Node.js",
            "Build a real-time chat application using WebSockets",
            "Contribute to an open-source project on GitHub",
        ]
    else:
        roadmap["projects"] = [
            "Build a distributed system project (e.g., URL shortener with Redis caching)",
            "Create a microservices application with Docker + Kubernetes",
            "Implement an ML model with REST API deployment",
            "Build a system monitoring dashboard with real metrics",
        ]

    # DSA Topics
    roadmap["dsa_topics"] = [
        "Arrays & Strings — Two Pointers, Sliding Window",
        "Linked Lists — Reversal, Cycle Detection, Merge",
        "Trees & Graphs — BFS, DFS, Binary Search Tree",
        "Dynamic Programming — Memoization, Tabulation",
        "Sorting & Searching — Quick Sort, Merge Sort, Binary Search",
        "Stacks, Queues & Heaps",
        "Hash Maps & Sets — Frequency counting patterns",
    ]

    # Interview prep plan
    roadmap["interview_prep"] = [
        "Week 1-2: Solve 20 LeetCode Easy problems — focus on arrays, strings, hashmaps",
        "Week 3-4: Solve 20 LeetCode Medium problems — trees, DP, sliding window",
        "Week 5: System Design basics — URL shortener, Twitter, Instagram feed",
        "Week 6: Mock interviews on Pramp or Interviewing.io",
        "Ongoing: Review behavioral questions using STAR method (Situation, Task, Action, Result)",
    ]

    return roadmap


def _generate_ai_content(result, extracted_text: str) -> dict:
    """Try Gemini for enhanced missing skills; fallback to curated list."""
    missing_skills = []
    try:
        from services.ai_service import ai_service
        if hasattr(ai_service, 'client') and ai_service.client:
            skill_str = ", ".join(result.detected_skills[:15])
            prompt = f"""A {result.experience_level} developer has these skills: {skill_str}.
List exactly 8 important technical skills they are MISSING that would increase their hireability in 2025.
Return as a JSON array of short skill/technology names only. No markdown."""
            response = ai_service.client.models.generate_content(
                model=ai_service.model_name, contents=prompt
            )
            res_text = response.text.strip()
            if res_text.startswith("```"):
                res_text = res_text.split('\n', 1)[1].rsplit('```', 1)[0]
            parsed = json.loads(res_text)
            if isinstance(parsed, list):
                missing_skills = [s for s in parsed if isinstance(s, str)][:8]
    except Exception as e:
        logger.warning(f"AI missing skills call failed: {e}")

    if not missing_skills:
        # Curated fallback
        all_current = {s.lower() for s in result.detected_skills}
        candidates = [
            "Docker", "Kubernetes", "Redis", "System Design", "CI/CD",
            "GraphQL", "TypeScript", "AWS", "PostgreSQL", "Testing (Jest/PyTest)",
            "Linux", "Git Advanced", "REST API Design", "Microservices Architecture",
        ]
        missing_skills = [c for c in candidates if c.lower() not in all_current][:8]

    return {"missing_skills": missing_skills}


# ─── PDF Report Generator (Step 21) ──────────────────────────────────────────

def _generate_pdf_report(record: ResumeData) -> io.BytesIO:
    """Generate a professional PDF report for the resume analysis."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.units import inch, cm
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    except ImportError:
        raise RuntimeError("reportlab not installed. Run: pip install reportlab")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=22, textColor=HexColor('#1e40af'), spaceAfter=6)
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
                               fontSize=14, textColor=HexColor('#1e293b'), spaceAfter=4, spaceBefore=12)
    body_style = ParagraphStyle('Body', parent=styles['Normal'],
                                 fontSize=10, leading=14, spaceAfter=4)
    small_style = ParagraphStyle('Small', parent=styles['Normal'],
                                  fontSize=8, leading=12, textColor=HexColor('#64748b'))
    score_label_style = ParagraphStyle('ScoreLabel', parent=styles['Normal'],
                                        fontSize=9, textColor=HexColor('#64748b'), alignment=TA_CENTER)
    score_value_style = ParagraphStyle('ScoreValue', parent=styles['Normal'],
                                        fontSize=28, textColor=HexColor('#1e40af'),
                                        alignment=TA_CENTER, fontName='Helvetica-Bold')

    # Load data safely
    score = record.score or 0
    breakdown = _safe_json(record.ats_breakdown_json, {})
    contact = _safe_json(record.contact_info_json, {})
    skills = _safe_json(record.extracted_skills, [])
    missing_sections = _safe_json(record.missing_sections_json, [])
    strengths = _safe_json(record.strengths_json, [])
    weaknesses = _safe_json(record.weaknesses_json, [])
    suggestions = _safe_json(record.suggestions_json, [])
    missing_skills = _safe_json(record.missing_skills_json, [])
    questions_data = _safe_json(record.interview_questions_json, {})
    job_readiness = _safe_json(record.job_readiness_json, {})
    grammar = _safe_json(record.grammar_analysis_json, {})
    roadmap = _safe_json(record.learning_roadmap_json, {})

    # Questions flat list
    if isinstance(questions_data, dict):
        all_questions = (questions_data.get('easy', []) +
                         questions_data.get('medium', []) +
                         questions_data.get('hard', []))
    else:
        all_questions = questions_data if isinstance(questions_data, list) else []

    score_color_hex = '#22c55e' if score >= 80 else '#eab308' if score >= 60 else '#ef4444'
    readiness_label = record.interview_readiness or 'Unknown'
    date_str = record.created_at.strftime('%B %d, %Y') if record.created_at else 'N/A'

    elements = []

    # ── Cover ──────────────────────────────────────────────────────────────
    elements.append(Paragraph("AI Interview Trainer", title_style))
    elements.append(Paragraph("ATS Resume Analysis Report", ParagraphStyle(
        'Sub', parent=styles['Normal'], fontSize=14, textColor=HexColor('#64748b'), spaceAfter=4)))
    elements.append(Paragraph(f"Generated: {date_str}  ·  File: {record.filename or 'resume'}  ·  Level: {record.experience_level or 'Unknown'}", small_style))
    elements.append(HRFlowable(width='100%', thickness=1, color=HexColor('#e2e8f0'), spaceAfter=12))

    # ── ATS Score Box ──────────────────────────────────────────────────────
    score_label = 'Excellent ✅' if score >= 80 else 'Good 📈' if score >= 60 else 'Needs Improvement ⚠️'
    score_table_data = [
        [Paragraph(f"<font color='{score_color_hex}' size='36'><b>{score:.0f}</b></font>", ParagraphStyle(
            'SB', alignment=TA_CENTER, fontSize=36, leading=40))],
        [Paragraph("ATS Score / 100", score_label_style)],
        [Paragraph(f"<b>{score_label}</b>", ParagraphStyle('SL', alignment=TA_CENTER, fontSize=11,
                                                           textColor=HexColor(score_color_hex)))],
        [Paragraph(f"Interview Readiness: <b>{readiness_label}</b>", score_label_style)],
    ]
    score_tbl = Table(score_table_data, colWidths=[doc.width])
    score_tbl.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#e2e8f0')),
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(score_tbl)
    elements.append(Spacer(1, 12))

    # ── Score Breakdown ────────────────────────────────────────────────────
    if breakdown:
        elements.append(Paragraph("📊 Score Breakdown", h2_style))
        tbl_data = [["Section", "Score", "Max", "Details"]]
        for section, info in breakdown.items():
            tbl_data.append([
                section,
                f"{info.get('score', 0):.1f}",
                f"{info.get('max', 0)}",
                (info.get('details', '') or '')[:60],
            ])
        tbl = Table(tbl_data, colWidths=[doc.width * 0.35, doc.width * 0.1, doc.width * 0.08, doc.width * 0.47])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#f8fafc'), white]),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(tbl)
        elements.append(Spacer(1, 10))

    # ── Contact Info ───────────────────────────────────────────────────────
    elements.append(Paragraph("📬 Contact Information", h2_style))
    for field_key, label in [("email", "Email"), ("phone", "Phone"), ("github", "GitHub"), ("linkedin", "LinkedIn"), ("portfolio", "Portfolio")]:
        val = contact.get(field_key)
        status = f"✓ {val}" if val else "✗ Not detected"
        color = '#22c55e' if val else '#ef4444'
        elements.append(Paragraph(f"<b>{label}:</b> <font color='{color}'>{status}</font>", body_style))

    # ── Technical Skills ───────────────────────────────────────────────────
    if skills:
        elements.append(Paragraph(f"⚡ Technical Skills ({len(skills)} detected)", h2_style))
        elements.append(Paragraph(", ".join(skills), body_style))

    # ── Strengths & Weaknesses ─────────────────────────────────────────────
    if strengths or weaknesses:
        sw_data = [
            [Paragraph("<b>✅ Strengths</b>", body_style), Paragraph("<b>❌ Weaknesses</b>", body_style)]
        ]
        max_len = max(len(strengths), len(weaknesses), 1)
        for i in range(max_len):
            s = Paragraph(f"• {strengths[i]}", small_style) if i < len(strengths) else Paragraph("", small_style)
            w = Paragraph(f"• {weaknesses[i]}", small_style) if i < len(weaknesses) else Paragraph("", small_style)
            sw_data.append([s, w])
        sw_tbl = Table(sw_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
        sw_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f1f5f9')),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(Paragraph("✅ Strengths & ❌ Weaknesses", h2_style))
        elements.append(sw_tbl)

    # ── Improvement Suggestions ────────────────────────────────────────────
    if suggestions:
        elements.append(Paragraph("💡 Improvement Suggestions", h2_style))
        for i, s in enumerate(suggestions, 1):
            elements.append(Paragraph(f"{i}. {s}", body_style))

    # ── Job Readiness ──────────────────────────────────────────────────────
    if job_readiness:
        elements.append(Paragraph("📈 Job Readiness Scores", h2_style))
        jr_data = [["Dimension", "Score"]]
        label_map = {
            "technical_readiness": "Technical Readiness",
            "resume_quality": "Resume Quality",
            "project_strength": "Project Strength",
            "communication_readiness": "Communication Readiness",
            "overall_employability": "Overall Employability",
        }
        for key, label in label_map.items():
            val = job_readiness.get(key, 0)
            jr_data.append([label, f"{val:.1f}%"])
        jr_tbl = Table(jr_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
        jr_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#f8fafc'), white]),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(jr_tbl)

    # ── Interview Questions ────────────────────────────────────────────────
    if all_questions:
        elements.append(Paragraph("🤖 Interview Questions", h2_style))
        for i, q in enumerate(all_questions[:10], 1):
            difficulty = "🟢 Easy" if i <= 5 else "🟡 Medium" if i <= 8 else "🔴 Hard"
            elements.append(Paragraph(f"<b>Q{i}</b> [{difficulty}]: {q}", body_style))

    # ── Learning Roadmap ───────────────────────────────────────────────────
    if roadmap:
        elements.append(Paragraph("🗺️ Personalized Learning Roadmap", h2_style))
        for section_key, section_label in [
            ("immediate_actions", "Immediate Actions"),
            ("courses", "Recommended Courses"),
            ("projects", "Project Ideas"),
            ("dsa_topics", "DSA Topics"),
            ("interview_prep", "Interview Prep Plan"),
        ]:
            items = roadmap.get(section_key, [])
            if items:
                elements.append(Paragraph(f"<b>{section_label}:</b>", body_style))
                for item in items:
                    name = item.get("name", str(item)) if isinstance(item, dict) else str(item)
                    elements.append(Paragraph(f"  • {name}", small_style))

    # ── Footer ─────────────────────────────────────────────────────────────
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width='100%', thickness=1, color=HexColor('#e2e8f0')))
    elements.append(Paragraph(
        "Generated by AI Interview Trainer · ATS Resume Analyzer v2.0 · All scores are deterministic",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7,
                       textColor=HexColor('#94a3b8'), alignment=TA_CENTER)
    ))

    doc.build(elements)
    buf.seek(0)
    return buf


# ─── Route: Upload & Analyze ──────────────────────────────────────────────────

@resume_bp.route('/upload-resume', methods=['POST'])
@jwt_required()
def upload_resume():
    """
    Steps 1-23: Accept PDF/DOCX, extract text, run full ATS analysis, save, return.
    """
    # ── Step 22/23: Security & Validation ────────────────────────────────────
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided. Attach file with field name 'resume'."}), 400

    file = request.files['resume']
    filename = (file.filename or '').strip()

    if not filename:
        return jsonify({"error": "No file selected."}), 400

    # Sanitize filename
    filename = re.sub(r'[^\w\-_\. ]', '_', filename)
    filename_lower = filename.lower()
    ext = next((e for e in ALLOWED_EXTENSIONS if filename_lower.endswith(e)), None)
    if not ext:
        return jsonify({"error": "Invalid file type. Only .pdf and .docx files are accepted."}), 400

    file_bytes = file.read()

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return jsonify({"error": "File too large. Maximum allowed size is 10 MB."}), 400
    if len(file_bytes) < 50:
        return jsonify({"error": "File is empty or too small."}), 400

    # ── Step 1: Text Extraction ───────────────────────────────────────────────
    try:
        text = extract_text(io.BytesIO(file_bytes), filename)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        return jsonify({"error": "Failed to read file. It may be corrupted, password-protected, or a scanned image without text."}), 422

    # ── Steps 2-18: Full ATS Analysis ────────────────────────────────────────
    try:
        result = _ats.analyze(text)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        logger.error(f"ATS analysis error: {e}")
        return jsonify({"error": "ATS analysis failed. Please try a different file."}), 500

    # ── AI Enhancement (missing skills) ──────────────────────────────────────
    ai_data = _generate_ai_content(result, text)
    missing_skills = ai_data.get("missing_skills", [])

    # ── Step 18: Learning Roadmap ─────────────────────────────────────────────
    roadmap = _generate_learning_roadmap(result.detected_skills, missing_skills, result.experience_level)

    # ── Step 19: Determine resume version ────────────────────────────────────
    user_id = get_jwt_identity()
    prev_count = ResumeData.objects(user_id=user_id).count()
    resume_version = prev_count + 1

    # ── Step 19: Save to DB ───────────────────────────────────────────────────
    file_type = ext.lstrip('.')
    questions_dict = result.interview_questions.to_dict()

    try:
        record = ResumeData(
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            resume_version=resume_version,
            extracted_text=text[:6000],
            extracted_skills=json.dumps(result.detected_skills),
            skills_by_category_json=json.dumps(result.skills_by_category),
            soft_skills_json=json.dumps(result.soft_skills),
            score=result.total_score,
            ats_breakdown_json=json.dumps(result.breakdown),
            contact_info_json=json.dumps(result.contact_info.to_dict()),
            sections_json=json.dumps({
                k: getattr(result.sections, k, False)
                for k in ['summary', 'experience', 'internship', 'education', 'skills',
                          'soft_skills', 'projects', 'certifications', 'achievements',
                          'languages', 'github', 'linkedin', 'portfolio']
            }),
            missing_sections_json=json.dumps(result.missing_sections),
            suggestions_json=json.dumps(result.suggestions),
            missing_skills_json=json.dumps(missing_skills),
            strengths_json=json.dumps(result.strengths),
            weaknesses_json=json.dumps(result.weaknesses),
            grammar_analysis_json=json.dumps(result.grammar_analysis.to_dict()),
            ats_compatibility_json=json.dumps(result.ats_compatibility.to_dict()),
            keyword_matches_json=json.dumps(result.keyword_matches),
            missing_keywords_json=json.dumps(result.missing_keywords),
            keyword_density=result.keyword_density,
            job_readiness_json=json.dumps(result.job_readiness.to_dict()),
            interview_readiness=result.interview_readiness,
            interview_readiness_reason=result.interview_readiness_reason,
            interview_questions_json=json.dumps(questions_dict),
            learning_roadmap_json=json.dumps(roadmap),
            experience_level=result.experience_level,
            quantified_achievements=result.quantified_achievements,
            certifications_count=result.certifications_count,
        )
        record.save()
        record_id = str(record.id)
    except Exception as e:
        logger.error(f"DB save error: {e}")
        record_id = None

    # ── Step 20: Build Full Response ──────────────────────────────────────────
    return jsonify({
        "success": True,
        "record_id": record_id,
        "filename": filename,
        "file_type": file_type,
        "resume_version": resume_version,

        # Step 3: ATS Score
        "ats_score": result.total_score,
        "resume_score": result.total_score,
        "breakdown": result.breakdown,

        # Step 2: Sections
        "sections": {
            k: getattr(result.sections, k, False)
            for k in ['summary', 'experience', 'internship', 'education', 'skills',
                      'soft_skills', 'projects', 'certifications', 'achievements',
                      'languages', 'github', 'linkedin', 'portfolio']
        },

        # Steps 4-5
        "contact_info": result.contact_info.to_dict(),
        "extracted_skills": result.detected_skills,
        "skills_by_category": result.skills_by_category,
        "soft_skills": result.soft_skills,
        "ats_compatibility": result.ats_compatibility.to_dict(),

        # Steps 10-11
        "grammar_analysis": result.grammar_analysis.to_dict(),
        "keyword_matches": result.keyword_matches,
        "keyword_density": result.keyword_density,
        "missing_keywords": result.missing_keywords,

        # Steps 12-14
        "missing_sections": result.missing_sections,
        "strengths": result.strengths,
        "weaknesses": result.weaknesses,
        "suggestions": result.suggestions,
        "missing_skills": missing_skills,

        # Steps 15-16
        "job_readiness": result.job_readiness.to_dict(),
        "interview_readiness": result.interview_readiness,
        "interview_readiness_reason": result.interview_readiness_reason,

        # Step 17
        "interview_questions": questions_dict,

        # Step 18
        "learning_roadmap": roadmap,

        # Meta
        "experience_level": result.experience_level,
        "quantified_achievements": result.quantified_achievements,
        "certifications_count": result.certifications_count,

        # Legacy
        "projects": [],
        "technologies": result.detected_skills,
    }), 200


# ─── Route: History (Step 19) ─────────────────────────────────────────────────

@resume_bp.route('/history', methods=['GET'])
@jwt_required()
def get_resume_history():
    """Step 19: Returns all past resume analyses for the user, newest first."""
    user_id = get_jwt_identity()
    records = ResumeData.objects(user_id=user_id).order_by('-created_at')

    history = []
    for r in records:
        skills = _safe_json(r.extracted_skills, [])
        jr = _safe_json(r.job_readiness_json, {})
        history.append({
            "id": str(r.id),
            "filename": r.filename or "resume",
            "file_type": r.file_type or "pdf",
            "score": round(r.score or 0, 1),
            "resume_version": r.resume_version or 1,
            "experience_level": r.experience_level or "Unknown",
            "interview_readiness": r.interview_readiness or "Unknown",
            "skills_count": len(skills),
            "overall_employability": jr.get("overall_employability", 0),
            "date": r.created_at.isoformat() if r.created_at else "",
        })

    return jsonify({"history": history, "count": len(history)}), 200


# ─── Route: Detail ────────────────────────────────────────────────────────────

@resume_bp.route('/history/<string:record_id>', methods=['GET'])
@jwt_required()
def get_resume_detail(record_id: str):
    """Returns full analysis for a specific resume record."""
    user_id = get_jwt_identity()
    r = ResumeData.objects(id=record_id, user_id=user_id).first()
    if not r:
        return jsonify({"error": "Analysis not found or access denied."}), 404

    questions_raw = _safe_json(r.interview_questions_json, {})
    if isinstance(questions_raw, list):
        questions_raw = {"easy": questions_raw[:5], "medium": questions_raw[5:8], "hard": questions_raw[8:]}

    return jsonify({
        "id": str(r.id),
        "filename": r.filename or "resume",
        "file_type": r.file_type or "pdf",
        "resume_version": r.resume_version or 1,
        "ats_score": r.score or 0,
        "breakdown": _safe_json(r.ats_breakdown_json, {}),
        "contact_info": _safe_json(r.contact_info_json, {}),
        "sections": _safe_json(r.sections_json, {}),
        "extracted_skills": _safe_json(r.extracted_skills, []),
        "skills_by_category": _safe_json(r.skills_by_category_json, {}),
        "soft_skills": _safe_json(r.soft_skills_json, []),
        "ats_compatibility": _safe_json(r.ats_compatibility_json, {}),
        "grammar_analysis": _safe_json(r.grammar_analysis_json, {}),
        "keyword_matches": _safe_json(r.keyword_matches_json, []),
        "missing_keywords": _safe_json(r.missing_keywords_json, []),
        "keyword_density": r.keyword_density or 0,
        "missing_sections": _safe_json(r.missing_sections_json, []),
        "strengths": _safe_json(r.strengths_json, []),
        "weaknesses": _safe_json(r.weaknesses_json, []),
        "suggestions": _safe_json(r.suggestions_json, []),
        "missing_skills": _safe_json(r.missing_skills_json, []),
        "job_readiness": _safe_json(r.job_readiness_json, {}),
        "interview_readiness": r.interview_readiness or "Unknown",
        "interview_readiness_reason": r.interview_readiness_reason or "",
        "interview_questions": questions_raw,
        "learning_roadmap": _safe_json(r.learning_roadmap_json, {}),
        "experience_level": r.experience_level or "Unknown",
        "quantified_achievements": r.quantified_achievements or 0,
        "certifications_count": r.certifications_count or 0,
        "date": r.created_at.isoformat() if r.created_at else "",
    }), 200


# ─── Route: PDF Report Download (Step 21) ─────────────────────────────────────

@resume_bp.route('/report/<string:record_id>', methods=['GET'])
@jwt_required()
def download_report(record_id: str):
    """Step 21: Generate and return a downloadable PDF analysis report."""
    user_id = get_jwt_identity()
    r = ResumeData.objects(id=record_id, user_id=user_id).first()
    if not r:
        return jsonify({"error": "Analysis not found."}), 404

    try:
        pdf_buf = _generate_pdf_report(r)
        safe_name = re.sub(r'[^\w\-_]', '_', (r.filename or 'resume').rsplit('.', 1)[0])
        download_name = f"ATS_Report_{safe_name}_v{r.resume_version or 1}.pdf"
        return send_file(
            pdf_buf,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        return jsonify({"error": f"Could not generate PDF report: {str(e)}"}), 500
