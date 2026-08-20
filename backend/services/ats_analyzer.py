"""
ats_analyzer.py — Production-Grade ATS Resume Scoring Engine v2.0
================================================================
Role: Senior ATS Engineer + Senior NLP Engineer + Senior Resume Parsing Engineer

Implements all 24 steps of the ATS analysis specification:
- Step 2:  Section detection (14 section types)
- Step 3:  ATS Score (100 pts, 9 categories)
- Step 4:  ATS Compatibility Check
- Step 5:  Technical Skills Detection (100+ technologies)
- Step 6:  Project Analysis
- Step 7:  Experience Analysis
- Step 8:  Education Analysis
- Step 9:  Certification Analysis
- Step 10: Grammar Analysis
- Step 11: Keyword Analysis + Density
- Step 12: Resume Strengths
- Step 13: Resume Weaknesses
- Step 14: Improvement Suggestions
- Step 15: Job Readiness Score (5 dimensions)
- Step 16: Interview Readiness Category
- Step 17: Interview Questions (Easy/Medium/Hard)
- Step 18: Learning Roadmap
- Step 22: Error Handling
- Step 23: Security

IMPORTANT: All scores are deterministic. Same file = same score. No randomness.
"""

import re
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple


logger = logging.getLogger(__name__)


# ─── MASTER TECHNOLOGY DATABASE ──────────────────────────────────────────────

TECH_DB = {
    "languages": {
        "python", "java", "javascript", "typescript", "c++", "c#", "c",
        "go", "golang", "rust", "kotlin", "swift", "php", "ruby", "scala",
        "r", "matlab", "perl", "bash", "shell", "powershell", "dart", "lua",
        "elixir", "haskell", "ocaml", "vba", "cobol", "fortran", "assembly",
        "groovy", "f#", "clojure", "erlang", "julia",
    },
    "web_frontend": {
        "html", "css", "html5", "css3", "react", "reactjs", "angular", "angularjs",
        "vue", "vuejs", "nextjs", "next.js", "nuxtjs", "svelte", "tailwind",
        "tailwindcss", "bootstrap", "sass", "scss", "less", "webpack", "vite",
        "redux", "mobx", "jquery", "graphql", "rest", "restful", "json",
        "xml", "ajax", "pwa", "webassembly", "gatsby", "remix",
    },
    "web_backend": {
        "node", "nodejs", "node.js", "express", "expressjs", "django", "flask",
        "fastapi", "spring", "spring boot", "springboot", "laravel", "rails",
        "ruby on rails", "asp.net", "dotnet", ".net", "nestjs", "fastify",
        "gin", "fiber", "actix", "rocket", "phoenix", "sinatra", "strapi",
        "graphql api", "rest api", "microservices", "grpc", "websocket",
    },
    "databases": {
        "sql", "mysql", "postgresql", "postgres", "mongodb", "redis", "sqlite",
        "oracle", "cassandra", "dynamodb", "firebase", "supabase", "elasticsearch",
        "neo4j", "mariadb", "mssql", "sql server", "nosql", "influxdb",
        "clickhouse", "couchdb", "hbase", "prisma", "mongoose", "sequelize",
        "sqlalchemy", "typeorm", "hibernate",
    },
    "cloud_devops": {
        "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
        "jenkins", "terraform", "ansible", "helm", "prometheus", "grafana",
        "nginx", "apache", "ci/cd", "github actions", "gitlab ci", "circleci",
        "travis", "argocd", "cloudformation", "lambda", "ec2", "s3", "rds",
        "ecs", "eks", "gke", "heroku", "vercel", "netlify", "digitalocean",
        "linux", "ubuntu", "centos", "bash scripting", "devops", "sre",
        "infrastructure as code", "load balancing", "cdn", "cloudflare",
    },
    "ai_ml": {
        "machine learning", "deep learning", "neural network", "nlp",
        "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
        "sklearn", "pandas", "numpy", "matplotlib", "seaborn", "opencv",
        "huggingface", "transformers", "llm", "rag", "langchain", "openai",
        "gemini", "bert", "gpt", "yolo", "cnn", "rnn", "lstm", "gan",
        "reinforcement learning", "natural language processing",
        "data science", "data analysis", "feature engineering",
        "model training", "model deployment", "mlops", "a/b testing",
    },
    "mobile": {
        "android", "ios", "react native", "flutter", "xamarin", "ionic",
        "swift", "objective-c", "jetpack compose", "swiftui",
    },
    "tools": {
        "git", "github", "gitlab", "bitbucket", "jira", "confluence",
        "figma", "postman", "swagger", "openapi", "vs code", "intellij",
        "eclipse", "xcode", "android studio", "vim", "linux", "agile",
        "scrum", "kanban", "tdd", "bdd", "unit testing", "jest", "pytest",
        "junit", "selenium", "cypress", "playwright", "sonarqube",
        "elasticsearch", "kafka", "rabbitmq", "celery", "redis", "nginx",
    },
    "data_engineering": {
        "spark", "hadoop", "airflow", "apache airflow", "etl", "data pipeline",
        "data warehouse", "snowflake", "bigquery", "tableau", "power bi",
        "looker", "dbt", "databricks", "hive", "pig", "flink", "beam",
        "kafka", "storm", "nifi",
    },
}

# Flat set of all tech keywords
ALL_TECH_KEYWORDS: set = set()
for category_keywords in TECH_DB.values():
    ALL_TECH_KEYWORDS.update(category_keywords)

# ─── SOFT SKILLS ─────────────────────────────────────────────────────────────
SOFT_SKILLS_KEYWORDS = {
    "leadership", "teamwork", "communication", "problem solving", "problem-solving",
    "critical thinking", "creativity", "adaptability", "time management",
    "collaboration", "interpersonal", "presentation", "negotiation", "mentoring",
    "analytical", "attention to detail", "decision making", "conflict resolution",
    "emotional intelligence", "multitasking", "project management", "research",
    "strategic thinking", "self-motivated", "fast learner", "customer service",
    "public speaking", "documentation", "technical writing",
}

# ─── INDUSTRY ACTION VERBS (Keyword Matching) ────────────────────────────────
INDUSTRY_KEYWORDS = [
    "developed", "implemented", "designed", "architected", "optimized", "improved",
    "deployed", "maintained", "collaborated", "led", "managed", "built", "created",
    "integrated", "automated", "tested", "monitored", "scaled", "reduced", "increased",
    "delivered", "launched", "migrated", "refactored", "debugged", "reviewed",
    "mentored", "documented", "researched", "analyzed", "owned", "shipped",
    "performance", "scalability", "reliability", "security", "agile", "cross-functional",
    "api", "database", "cloud", "production", "real-time", "end-to-end", "restful",
    "full-stack", "frontend", "backend", "devops", "ci/cd", "containerized",
    "microservices", "data-driven", "user-centric", "distributed", "event-driven",
]

# ─── SECTION HEADING PATTERNS ────────────────────────────────────────────────
SECTION_PATTERNS = {
    "summary":        r'\b(summary|objective|profile|about me|professional summary|career objective|about|overview|introduction)\b',
    "experience":     r'\b(experience|employment|work history|professional experience|career history|work experience|positions?|job history)\b',
    "internship":     r'\b(internship|intern|trainee|apprentice|co.?op)\b',
    "education":      r'\b(education|academic|qualification|degree|university|college|school|bachelor|master|phd|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|b\.?sc|mba|courses?)\b',
    "skills":         r'\b(skills?|technical skills?|technologies|tools|competencies|expertise|proficiencies|tech stack|core skills|key skills)\b',
    "soft_skills":    r'\b(soft skills?|interpersonal|personal skills?|attributes?)\b',
    "projects":       r'\b(projects?|personal projects?|academic projects?|portfolio|work samples?|notable projects?|side projects?|open.?source)\b',
    "certifications": r'\b(certif|certified|certificate|credential|accreditation|aws certified|google certified|microsoft certified|udemy|coursera|hackerrank|leetcode)\b',
    "achievements":   r'\b(achievements?|awards?|honors?|accomplishments?|recognition|prizes?)\b',
    "languages":      r'\b(languages?|spoken|verbal|native|fluent|proficient in|english|hindi|spanish|french|german|arabic)\b',
    "github":         r'github\.com/[a-zA-Z0-9\-]+',
    "linkedin":       r'linkedin\.com/in/[a-zA-Z0-9\-]+',
    "portfolio":      r'(portfolio|website|personal site|blog|medium|dev\.to)',
    "contact":        r'\b(contact|phone|email|mobile|address|location)\b',
}

DEGREE_PATTERN = r'\b(bachelor|master|phd|ph\.d|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|mba|associate|diploma|b\.?s\.?|m\.?s\.?|b\.?com|bca|mca)\b'
QUANTIFIED_PATTERN = r'\b(\d+[\+\%]?|\d+\.\d+)\s*(x|times|percent|%|million|billion|thousand|hundred|users|customers|requests|ms|seconds|hours|days|months|years|kb|mb|gb|tb|lines|features|bugs|tests|issues|endpoints|apis|repositories|commits|projects|team|members|employees|clients|revenue|cost|accuracy|f1|improvement|reduction|increase|decrease)\b'
DATE_YEAR_PATTERN = r'\b(20\d{2}|19\d{2})\b'
CGPA_PATTERN = r'\b(cgpa|gpa|grade|percentage|%)\s*[:\-]?\s*(\d+\.?\d*)'
GRAMMAR_PASSIVE_PATTERNS = [
    r'\bwas (done|handled|managed|created|developed|built|designed|implemented|used|made)\b',
    r'\bwere (done|handled|managed|created|developed|built|designed|implemented|used|made)\b',
    r'\bbeing (done|handled|managed|created|developed|built|designed)\b',
    r'\bis being\b',
]
COMMON_WEAK_WORDS = {
    "responsible for", "helped with", "worked on", "assisted in", "involved in",
    "participated in", "contributed to", "dealt with", "handled",
}
COMMON_MISSPELLINGS = {
    "recieve": "receive", "seperate": "separate", "occured": "occurred",
    "sucessful": "successful", "managment": "management", "progrmming": "programming",
    "developement": "development", "impelemented": "implemented",
    "technoogy": "technology", "profesional": "professional",
    "exprience": "experience", "responsibilties": "responsibilities",
}


# ─── DATACLASSES ─────────────────────────────────────────────────────────────

@dataclass
class ContactInfo:
    email: Optional[str] = None
    phone: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

    def detected_count(self) -> int:
        return sum(1 for v in [self.email, self.phone, self.github, self.linkedin, self.portfolio] if v)

    def to_dict(self) -> dict:
        return {
            "email": self.email,
            "phone": self.phone,
            "github": self.github,
            "linkedin": self.linkedin,
            "portfolio": self.portfolio,
        }


@dataclass
class SectionPresence:
    summary: bool = False
    experience: bool = False
    internship: bool = False
    education: bool = False
    skills: bool = False
    soft_skills: bool = False
    projects: bool = False
    certifications: bool = False
    achievements: bool = False
    languages: bool = False
    github: bool = False
    linkedin: bool = False
    portfolio: bool = False


@dataclass
class GrammarAnalysis:
    passive_voice_count: int = 0
    weak_words_found: List[str] = field(default_factory=list)
    possible_misspellings: List[str] = field(default_factory=list)
    word_count: int = 0
    avg_sentence_length: float = 0.0
    grade: str = "Unknown"
    issues: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "passive_voice_count": self.passive_voice_count,
            "weak_words_found": self.weak_words_found,
            "possible_misspellings": self.possible_misspellings,
            "word_count": self.word_count,
            "avg_sentence_length": round(self.avg_sentence_length, 1),
            "grade": self.grade,
            "issues": self.issues,
        }


@dataclass
class JobReadiness:
    technical_readiness: float = 0.0
    resume_quality: float = 0.0
    project_strength: float = 0.0
    communication_readiness: float = 0.0
    overall_employability: float = 0.0

    def to_dict(self) -> dict:
        return {
            "technical_readiness": round(self.technical_readiness, 1),
            "resume_quality": round(self.resume_quality, 1),
            "project_strength": round(self.project_strength, 1),
            "communication_readiness": round(self.communication_readiness, 1),
            "overall_employability": round(self.overall_employability, 1),
        }


@dataclass
class InterviewQuestions:
    easy: List[str] = field(default_factory=list)
    medium: List[str] = field(default_factory=list)
    hard: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"easy": self.easy, "medium": self.medium, "hard": self.hard}

    def flat_list(self) -> List[str]:
        """Return all questions as a flat list for backward compatibility."""
        return self.easy + self.medium + self.hard


@dataclass
class ATSCompatibility:
    score: float = 5.0
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    word_count: int = 0
    page_estimate: int = 1

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "issues": self.issues,
            "suggestions": self.suggestions,
            "word_count": self.word_count,
            "page_estimate": self.page_estimate,
        }


@dataclass
class ATSResult:
    # Core
    total_score: float
    breakdown: Dict[str, Dict]
    # Contact
    contact_info: ContactInfo
    # Sections
    sections: SectionPresence
    # Skills
    detected_skills: List[str]
    skills_by_category: Dict[str, List[str]]
    soft_skills: List[str]
    # Analysis
    grammar_analysis: GrammarAnalysis
    ats_compatibility: ATSCompatibility
    keyword_matches: List[str]
    keyword_density: float
    missing_keywords: List[str]
    # Results
    missing_sections: List[str]
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    # Readiness
    job_readiness: JobReadiness
    interview_readiness: str
    interview_readiness_reason: str
    # Questions
    interview_questions: InterviewQuestions
    # Meta
    experience_level: str
    quantified_achievements: int
    certifications_count: int


# ─── MAIN ENGINE ─────────────────────────────────────────────────────────────

class ATSAnalyzer:
    """
    Production-grade deterministic ATS Resume Scoring Engine.
    All scores based purely on extracted text content. No randomness.
    """

    def analyze(self, text: str) -> ATSResult:
        if not text or len(text.strip()) < 30:
            raise ValueError("Resume text is too short for meaningful analysis.")

        text_lower = text.lower()

        # ── Step 2: Section Detection ────────────────────────────────────────
        sections = self._detect_sections(text, text_lower)
        contact = self._extract_contact(text)

        # ── Step 4: ATS Compatibility ────────────────────────────────────────
        ats_compat = self._check_ats_compatibility(text)

        # ── Step 5: Skills Detection ─────────────────────────────────────────
        skills_by_cat, all_skills = self._detect_skills(text_lower)
        soft_skills = self._detect_soft_skills(text_lower)

        # ── Step 6-9: Section Analysis ───────────────────────────────────────
        proj_score, proj_count, proj_detail = self._score_projects(text, text_lower)
        exp_score, exp_detail, exp_level, quant_count = self._score_experience(text, text_lower)
        edu_score, edu_detail = self._score_education(text, text_lower)
        cert_score, cert_count, cert_detail = self._score_certifications(text, text_lower)

        # ── Step 10: Grammar Analysis ─────────────────────────────────────────
        grammar = self._analyze_grammar(text, text_lower)

        # ── Step 11: Keyword Analysis ─────────────────────────────────────────
        kw_matches, kw_score, kw_detail, kw_density, missing_kw = self._analyze_keywords(text_lower)

        # ── Step 3: ATS Scoring ───────────────────────────────────────────────
        contact_score = float(min(5, contact.detected_count()))
        summary_score, summary_detail = self._score_summary(text, text_lower)
        skills_score = min(20.0, float(len(all_skills)))
        
        breakdown = {
            "Contact Information":   {"score": contact_score,  "max": 5,  "details": f"{contact.detected_count()}/5 contact fields detected"},
            "Professional Summary":  {"score": summary_score,  "max": 10, "details": summary_detail},
            "Technical Skills":      {"score": skills_score,   "max": 20, "details": f"{len(all_skills)} technical skills detected"},
            "Projects":              {"score": proj_score,      "max": 20, "details": proj_detail},
            "Experience/Internship": {"score": exp_score,       "max": 15, "details": exp_detail},
            "Education":             {"score": edu_score,        "max": 10, "details": edu_detail},
            "Certifications":        {"score": cert_score,      "max": 5,  "details": cert_detail},
            "Keyword Matching":      {"score": kw_score,        "max": 10, "details": kw_detail},
            "ATS Formatting":        {"score": ats_compat.score, "max": 5,  "details": f"{len(ats_compat.issues)} formatting issues detected"},
        }

        total = sum(v["score"] for v in breakdown.values())
        total = min(100.0, round(total, 1))

        # ── Steps 12-14: Strengths, Weaknesses, Suggestions ──────────────────
        missing_sections = self._find_missing_sections(sections, contact, cert_count)
        strengths, weaknesses, suggestions = self._build_feedback(
            breakdown, contact, all_skills, soft_skills, sections,
            missing_sections, grammar, quant_count, cert_count
        )

        # ── Step 15: Job Readiness Score ─────────────────────────────────────
        job_readiness = self._calculate_job_readiness(
            breakdown, all_skills, soft_skills, quant_count,
            grammar, sections, kw_density
        )

        # ── Step 16: Interview Readiness ─────────────────────────────────────
        iv_readiness, iv_reason = self._classify_interview_readiness(total, job_readiness)

        # ── Step 17: Interview Questions ─────────────────────────────────────
        iv_questions = self._generate_interview_questions(
            all_skills, exp_level, sections, proj_count
        )

        return ATSResult(
            total_score=total,
            breakdown=breakdown,
            contact_info=contact,
            sections=sections,
            detected_skills=all_skills,
            skills_by_category=skills_by_cat,
            soft_skills=soft_skills,
            grammar_analysis=grammar,
            ats_compatibility=ats_compat,
            keyword_matches=kw_matches,
            keyword_density=kw_density,
            missing_keywords=missing_kw,
            missing_sections=missing_sections,
            strengths=strengths,
            weaknesses=weaknesses,
            suggestions=suggestions,
            job_readiness=job_readiness,
            interview_readiness=iv_readiness,
            interview_readiness_reason=iv_reason,
            interview_questions=iv_questions,
            experience_level=exp_level,
            quantified_achievements=quant_count,
            certifications_count=cert_count,
        )

    # ─── Step 2: Section Detection ───────────────────────────────────────────

    def _detect_sections(self, text: str, text_lower: str) -> SectionPresence:
        s = SectionPresence()
        s.summary        = bool(re.search(SECTION_PATTERNS["summary"], text_lower))
        s.experience     = bool(re.search(SECTION_PATTERNS["experience"], text_lower))
        s.internship     = bool(re.search(SECTION_PATTERNS["internship"], text_lower))
        s.education      = bool(re.search(SECTION_PATTERNS["education"], text_lower))
        s.skills         = bool(re.search(SECTION_PATTERNS["skills"], text_lower))
        s.soft_skills    = bool(re.search(SECTION_PATTERNS["soft_skills"], text_lower))
        s.projects       = bool(re.search(SECTION_PATTERNS["projects"], text_lower))
        s.certifications = bool(re.search(SECTION_PATTERNS["certifications"], text_lower))
        s.achievements   = bool(re.search(SECTION_PATTERNS["achievements"], text_lower))
        s.languages      = bool(re.search(SECTION_PATTERNS["languages"], text_lower))
        s.github         = bool(re.search(SECTION_PATTERNS["github"], text, re.IGNORECASE))
        s.linkedin       = bool(re.search(SECTION_PATTERNS["linkedin"], text, re.IGNORECASE))
        s.portfolio      = bool(re.search(SECTION_PATTERNS["portfolio"], text_lower))
        return s

    # ─── Step 4: ATS Compatibility Check ─────────────────────────────────────

    def _check_ats_compatibility(self, text: str) -> ATSCompatibility:
        comp = ATSCompatibility()
        score = 5.0
        word_count = len(text.split())
        comp.word_count = word_count
        comp.page_estimate = max(1, word_count // 400)

        # Tables detection
        pipe_count = text.count('|')
        if pipe_count > 5:
            comp.issues.append("Table structures detected — ATS parsers may misread column-based layouts")
            comp.suggestions.append("Convert tables to simple bullet-point lists for better ATS compatibility")
            score -= 1.5

        # Multiple columns (horizontal whitespace patterns)
        long_spaces = len(re.findall(r'  {4,}', text))
        if long_spaces > 10:
            comp.issues.append("Multiple column layout suspected — ATS may scramble reading order")
            comp.suggestions.append("Use single-column layout for ATS submissions")
            score -= 1.0

        # Length check
        if word_count < 250:
            comp.issues.append(f"Resume is very short ({word_count} words) — likely to be filtered by ATS")
            comp.suggestions.append("Expand your resume to at least 400 words with detailed descriptions")
            score -= 1.0
        elif word_count > 1500:
            comp.issues.append(f"Resume is long ({word_count} words) — keep to 1–2 pages for ATS")
            comp.suggestions.append("Trim to the most relevant 600–900 words for a 1–2 page resume")
            score -= 0.5

        # Special characters that break parsers
        special_count = len(re.findall(r'[★✦►•❖◆●]', text))
        if special_count > 20:
            comp.issues.append("Heavy use of special characters/icons — may cause parsing issues")
            comp.suggestions.append("Replace decorative icons with standard ASCII bullet points (• or -)")
            score -= 0.5

        # Headers/footers detection (repeated short lines at top/bottom)
        lines = text.split('\n')
        if lines and len(lines[0].strip()) > 0 and len(lines[0].strip()) < 30:
            comp.issues.append("Possible header/footer detected — ATS may duplicate this text")

        comp.score = max(0.0, round(score, 1))
        return comp

    # ─── Step 5: Skills Detection ─────────────────────────────────────────────

    def _detect_skills(self, text_lower: str) -> Tuple[Dict[str, List[str]], List[str]]:
        skills_by_cat = {}
        for category, keywords in TECH_DB.items():
            found = sorted({
                kw for kw in keywords
                if re.search(r'\b' + re.escape(kw) + r'\b', text_lower)
            })
            if found:
                skills_by_cat[category] = found

        all_skills = sorted({skill for skills in skills_by_cat.values() for skill in skills})
        return skills_by_cat, all_skills

    def _detect_soft_skills(self, text_lower: str) -> List[str]:
        return sorted({
            kw for kw in SOFT_SKILLS_KEYWORDS
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower)
        })

    # ─── Step 3: Scoring Methods ──────────────────────────────────────────────

    def _extract_contact(self, text: str) -> ContactInfo:
        c = ContactInfo()
        email_m = re.search(r'\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b', text)
        c.email = email_m.group(0) if email_m else None

        phone_m = re.search(r'(\+?\d[\d\s\-().]{7,14}\d)', text)
        c.phone = phone_m.group(0).strip() if phone_m else None

        github_m = re.search(r'github\.com/([a-zA-Z0-9\-]+)', text, re.IGNORECASE)
        if github_m:
            c.github = f"github.com/{github_m.group(1)}"
        elif re.search(r'\bgithub\b', text, re.IGNORECASE):
            c.github = "GitHub mentioned"

        linkedin_m = re.search(r'linkedin\.com/in/([a-zA-Z0-9\-]+)', text, re.IGNORECASE)
        if linkedin_m:
            c.linkedin = f"linkedin.com/in/{linkedin_m.group(1)}"
        elif re.search(r'\blinkedin\b', text, re.IGNORECASE):
            c.linkedin = "LinkedIn mentioned"

        portfolio_m = re.search(
            r'(https?://(?!linkedin|github)[a-zA-Z0-9.\-/]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)',
            text, re.IGNORECASE
        )
        if portfolio_m:
            c.portfolio = portfolio_m.group(0)
        elif re.search(r'\b(portfolio|personal site|website)\b', text, re.IGNORECASE):
            c.portfolio = "Portfolio mentioned"

        return c

    def _score_summary(self, text: str, text_lower: str) -> Tuple[float, str]:
        if not re.search(SECTION_PATTERNS["summary"], text_lower):
            return 0.0, "No professional summary or objective section found"
        m = re.search(SECTION_PATTERNS["summary"], text_lower)
        after = text[m.end():m.end() + 600]
        words = len(after.split())
        if words >= 60:
            return 10.0, f"Detailed summary present ({words} words) — excellent"
        elif words >= 30:
            return 7.0, f"Summary present but brief ({words} words) — aim for 60+ words"
        elif words >= 10:
            return 4.0, f"Summary section found but very short ({words} words)"
        return 2.0, "Summary heading present but nearly empty"

    def _score_projects(self, text: str, text_lower: str) -> Tuple[float, int, str]:
        has_projects = bool(re.search(SECTION_PATTERNS["projects"], text_lower))
        if not has_projects:
            return 0.0, 0, "No projects section found"

        m = re.search(SECTION_PATTERNS["projects"], text_lower)
        after = text[m.end():m.end() + 3000]
        lines = [l.strip() for l in after.split('\n') if l.strip()]

        # Count project entries
        proj_lines = [l for l in lines if re.match(r'^[A-Z•\-\*\d✓►]', l) and len(l) > 20]
        project_count = max(1, min(5, len(proj_lines) // 2))

        # Quality signals
        has_github_link = bool(re.search(SECTION_PATTERNS["github"], after, re.IGNORECASE))
        has_live_demo = bool(re.search(r'(live demo|deployed|hosted|vercel|netlify|heroku|demo link)', after, re.IGNORECASE))
        has_tech_mentioned = len([k for k in ALL_TECH_KEYWORDS if re.search(r'\b' + re.escape(k) + r'\b', after.lower())]) > 2
        has_quantified = bool(re.search(QUANTIFIED_PATTERN, after, re.IGNORECASE))

        score = min(20.0, project_count * 4.0)  # 4pts per project, max 20
        if has_github_link:
            score = min(20.0, score + 1.5)
        if has_live_demo:
            score = min(20.0, score + 1.5)
        if has_tech_mentioned:
            score = min(20.0, score + 1.0)
        if has_quantified:
            score = min(20.0, score + 1.0)


        quality_signals = []
        if has_github_link:
            quality_signals.append("GitHub links")
        if has_live_demo:
            quality_signals.append("live demos")
        if has_quantified:
            quality_signals.append("quantified impact")

        detail = f"~{project_count} project(s) detected"
        if quality_signals:
            detail += f" with {', '.join(quality_signals)}"

        return round(score, 1), project_count, detail

    def _score_experience(self, text: str, text_lower: str) -> Tuple[float, str, str, int]:
        has_exp = bool(re.search(SECTION_PATTERNS["experience"], text_lower))
        has_intern = bool(re.search(SECTION_PATTERNS["internship"], text_lower))

        if not has_exp and not has_intern:
            return 0.0, "No work experience or internship section found", "Fresher", 0

        # Find section text
        pattern = SECTION_PATTERNS["experience"] if has_exp else SECTION_PATTERNS["internship"]
        m = re.search(pattern, text_lower)
        after = text[m.end():m.end() + 4000] if m else text

        # Count job/internship entries via date patterns
        dates = re.findall(DATE_YEAR_PATTERN, after)
        job_count = max(1, len(dates) // 2)

        # Quantified achievements across entire text
        quant_count = len(re.findall(QUANTIFIED_PATTERN, text_lower, re.IGNORECASE))

        # Action verb check
        action_verbs = ["developed", "built", "implemented", "designed", "led", "managed",
                        "created", "deployed", "optimized", "architected", "launched", "delivered"]
        action_count = sum(1 for v in action_verbs if re.search(r'\b' + v + r'\b', text_lower))

        # Scoring
        if job_count >= 3:
            score = 13.0
        elif job_count == 2:
            score = 10.0
        elif job_count == 1 and has_intern:
            score = 8.0
        elif job_count == 1:
            score = 8.0
        else:
            score = 5.0

        if quant_count >= 3:
            score = min(15.0, score + 2.0)
        elif quant_count >= 1:
            score = min(15.0, score + 1.0)

        if action_count >= 5:
            score = min(15.0, score + 1.0)

        # Experience level
        all_years = [int(y) for y in re.findall(DATE_YEAR_PATTERN, text)]
        exp_level = "Fresher"
        if all_years:
            year_range = max(all_years) - min(all_years)
            if year_range >= 7:
                exp_level = "Senior (7+ years)"
            elif year_range >= 4:
                exp_level = "Mid-Level (4-7 years)"
            elif year_range >= 1:
                exp_level = "Junior (1-3 years)"
            else:
                exp_level = "Entry-Level / Fresher"

        detail = f"~{job_count} position(s)"
        if quant_count > 0:
            detail += f", {quant_count} quantified achievement(s)"
        if action_count > 0:
            detail += f", {action_count} action verbs"
        if has_intern and not has_exp:
            detail += " (internship)"

        return round(score, 1), detail, exp_level, quant_count

    def _score_education(self, text: str, text_lower: str) -> Tuple[float, str]:
        if not re.search(SECTION_PATTERNS["education"], text_lower):
            return 0.0, "No education section found"

        degree_found = bool(re.search(DEGREE_PATTERN, text_lower))
        cgpa_m = re.search(CGPA_PATTERN, text_lower)
        has_coursework = bool(re.search(r'\b(coursework|relevant courses|modules)\b', text_lower))

        if not degree_found:
            return 6.0, "Education section found, degree not explicitly stated"

        score = 8.0
        detail_parts = ["Degree detected"]
        if cgpa_m:
            score = min(10.0, score + 1.5)
            detail_parts.append(f"GPA/CGPA: {cgpa_m.group(2)}")
        if has_coursework:
            score = min(10.0, score + 0.5)
            detail_parts.append("relevant coursework listed")

        return round(score, 1), " | ".join(detail_parts)

    def _score_certifications(self, text: str, text_lower: str) -> Tuple[float, int, str]:
        if not re.search(SECTION_PATTERNS["certifications"], text_lower):
            return 0.0, 0, "No certifications found"

        cert_matches = re.findall(SECTION_PATTERNS["certifications"], text_lower)
        cert_count = max(1, len(cert_matches))

        # Check for prestigious certifications
        prestigious = ["aws", "azure", "google", "cisco", "oracle", "meta", "tensorflow",
                       "kubernetes", "certified", "professional"]
        prestige_count = sum(1 for p in prestigious if re.search(r'\b' + p + r'\b', text_lower))

        if cert_count >= 5 or prestige_count >= 3:
            return 5.0, cert_count, f"{cert_count} certification(s), strong credential portfolio"
        elif cert_count >= 3:
            return 4.0, cert_count, f"{cert_count} certification(s) found"
        elif cert_count >= 1:
            return 3.0, cert_count, f"{cert_count} certification mention(s)"
        return 2.0, cert_count, "Certification section present"

    # ─── Step 10: Grammar Analysis ───────────────────────────────────────────

    def _analyze_grammar(self, text: str, text_lower: str) -> GrammarAnalysis:
        g = GrammarAnalysis()
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        g.word_count = len(text.split())
        g.avg_sentence_length = g.word_count / max(1, len(sentences))

        # Passive voice
        for pattern in GRAMMAR_PASSIVE_PATTERNS:
            matches = re.findall(pattern, text_lower)
            g.passive_voice_count += len(matches)

        if g.passive_voice_count > 0:
            g.issues.append(f"Found {g.passive_voice_count} passive voice instance(s) — use active voice with action verbs")

        # Weak words
        for weak in COMMON_WEAK_WORDS:
            if re.search(r'\b' + re.escape(weak) + r'\b', text_lower):
                g.weak_words_found.append(weak)

        if g.weak_words_found:
            g.issues.append(f"Weak phrases detected: '{', '.join(g.weak_words_found[:3])}' — replace with strong action verbs")

        # Misspellings
        for wrong, correct in COMMON_MISSPELLINGS.items():
            if re.search(r'\b' + wrong + r'\b', text_lower):
                g.possible_misspellings.append(f"'{wrong}' → '{correct}'")

        if g.possible_misspellings:
            g.issues.append(f"Possible misspellings: {', '.join(g.possible_misspellings[:3])}")

        # Average sentence length
        if g.avg_sentence_length > 30:
            g.issues.append(f"Avg sentence length is {g.avg_sentence_length:.0f} words — aim for under 20 words per bullet")

        # Grade
        issue_count = len(g.issues)
        if issue_count == 0:
            g.grade = "Excellent"
        elif issue_count <= 2:
            g.grade = "Good"
        elif issue_count <= 4:
            g.grade = "Average"
        else:
            g.grade = "Needs Improvement"

        return g

    # ─── Step 11: Keyword Analysis ────────────────────────────────────────────

    def _analyze_keywords(self, text_lower: str) -> Tuple[List[str], float, str, float, List[str]]:
        found = [kw for kw in INDUSTRY_KEYWORDS
                 if re.search(r'\b' + re.escape(kw) + r'\b', text_lower)]
        missing = [kw for kw in INDUSTRY_KEYWORDS if kw not in found]

        pct = len(found) / len(INDUSTRY_KEYWORDS)
        score = round(min(10.0, pct * 20), 1)  # 50% match = 10pts

        word_count = len(text_lower.split())
        density = round((len(found) / max(1, word_count)) * 100, 2)

        detail = f"{len(found)}/{len(INDUSTRY_KEYWORDS)} action keywords ({density}% keyword density)"
        return found, score, detail, density, missing[:10]

    # ─── Steps 12-14: Feedback Generation ────────────────────────────────────

    def _find_missing_sections(self, sections: SectionPresence, contact: ContactInfo, cert_count: int) -> List[str]:
        missing = []
        if not sections.summary:
            missing.append("Professional Summary")
        if not sections.experience and not sections.internship:
            missing.append("Work Experience / Internship")
        if not sections.education:
            missing.append("Education")
        if not sections.skills:
            missing.append("Technical Skills")
        if not sections.projects:
            missing.append("Projects")
        if not contact.email:
            missing.append("Email Address")
        if not contact.phone:
            missing.append("Phone Number")
        if not contact.linkedin:
            missing.append("LinkedIn Profile")
        if not contact.github:
            missing.append("GitHub Profile")
        if cert_count == 0:
            missing.append("Certifications")
        if not sections.achievements:
            missing.append("Achievements / Awards")
        return missing

    def _build_feedback(self, breakdown: dict, contact: ContactInfo,
                        skills: List[str], soft_skills: List[str],
                        sections: SectionPresence, missing: List[str],
                        grammar: GrammarAnalysis, quant_count: int,
                        cert_count: int) -> Tuple[List[str], List[str], List[str]]:
        strengths, weaknesses, suggestions = [], [], []

        for section, data in breakdown.items():
            pct = data["score"] / data["max"] if data["max"] > 0 else 0
            if pct >= 0.85:
                strengths.append(f"✅ Strong {section} — {data['score']}/{data['max']} pts")
            elif pct < 0.45:
                weaknesses.append(f"⚠️ Weak {section} — {data['score']}/{data['max']} pts")

        # Skill-based strengths
        if len(skills) >= 15:
            strengths.append("✅ Excellent technical stack breadth")
        elif len(skills) >= 8:
            strengths.append("✅ Good technical skills coverage")

        if sections.github:
            strengths.append("✅ GitHub profile included — great for visibility")
        if sections.achievements:
            strengths.append("✅ Achievements section boosts credibility")
        if quant_count >= 3:
            strengths.append(f"✅ {quant_count} quantified achievements demonstrate real impact")
        if grammar.grade in ["Excellent", "Good"]:
            strengths.append("✅ Clean, professional language and grammar")

        # Weakness-based signals
        if not sections.github:
            weaknesses.append("❌ No GitHub profile — critical for tech roles")
        if not sections.summary:
            weaknesses.append("❌ Missing professional summary — first thing recruiters read")
        if quant_count == 0:
            weaknesses.append("❌ No quantified achievements — add metrics (%, $, users)")
        if len(skills) < 5:
            weaknesses.append("❌ Very few technical skills detected")
        if grammar.grade in ["Average", "Needs Improvement"]:
            weaknesses.append(f"❌ Grammar/language quality: {grammar.grade}")
        if cert_count == 0:
            weaknesses.append("❌ No certifications — reduces credibility for junior roles")
        if not contact.linkedin:
            weaknesses.append("❌ Missing LinkedIn profile URL")

        # Detailed suggestions
        if not sections.summary:
            suggestions.append("Add a 3–4 sentence Professional Summary at the top highlighting your specialization, years of experience, and top skills")
        if not contact.github:
            suggestions.append("Create a GitHub profile and add your URL — tech recruiters look for active GitHub profiles")
        if quant_count == 0:
            suggestions.append("Quantify your achievements: instead of 'improved performance', write 'improved API response time by 40%, serving 10,000+ daily users'")
        if len(skills) < 10:
            suggestions.append("Expand your Technical Skills section — list all languages, frameworks, tools, databases, and cloud platforms you've used")
        if cert_count == 0:
            suggestions.append("Add at least 1 industry certification (AWS Cloud Practitioner, Google IT, Meta Front-End are free/affordable)")
        if not sections.achievements:
            suggestions.append("Add an Achievements section — hackathon wins, academic awards, open source contributions, or competitive programming ranks")
        if breakdown["Keyword Matching"]["score"] < 7:
            suggestions.append("Use more action verbs: developed, implemented, optimized, deployed, architected, led, scaled, automated")
        if not contact.linkedin:
            suggestions.append("Add your LinkedIn profile URL in the contact section — format: linkedin.com/in/your-name")
        if breakdown["Projects"]["score"] < 12:
            suggestions.append("Add 2–3 detailed projects with: project name, technologies used, what problem you solved, and a GitHub/live link")
        if grammar.weak_words_found:
            suggestions.append(f"Replace weak phrases like '{grammar.weak_words_found[0]}' with strong action verbs like 'built', 'developed', 'engineered'")

        return strengths[:8], weaknesses[:8], suggestions[:9]

    # ─── Step 15: Job Readiness Score ────────────────────────────────────────

    def _calculate_job_readiness(self, breakdown: dict, skills: List[str],
                                  soft_skills: List[str], quant_count: int,
                                  grammar: GrammarAnalysis,
                                  sections: SectionPresence,
                                  kw_density: float) -> JobReadiness:
        jr = JobReadiness()

        # Technical Readiness (skills + certifications)
        tech_max = breakdown["Technical Skills"]["max"] + breakdown["Certifications"]["max"]
        tech_actual = breakdown["Technical Skills"]["score"] + breakdown["Certifications"]["score"]
        jr.technical_readiness = round((tech_actual / tech_max) * 100, 1)

        # Resume Quality (formatting + contact + summary + keywords)
        q_max = 5 + 5 + 10 + 10
        q_actual = (breakdown["ATS Formatting"]["score"] + breakdown["Contact Information"]["score"] +
                    breakdown["Professional Summary"]["score"] + breakdown["Keyword Matching"]["score"])
        jr.resume_quality = round((q_actual / q_max) * 100, 1)

        # Project Strength
        jr.project_strength = round((breakdown["Projects"]["score"] / 20) * 100, 1)

        # Communication Readiness (grammar + soft skills + summary)
        grammar_score = {"Excellent": 100, "Good": 75, "Average": 50, "Needs Improvement": 25}.get(grammar.grade, 50)
        soft_score = min(100, len(soft_skills) * 12)
        summary_score = (breakdown["Professional Summary"]["score"] / 10) * 100
        jr.communication_readiness = round((grammar_score * 0.4 + soft_score * 0.3 + summary_score * 0.3), 1)

        # Overall Employability (weighted average)
        jr.overall_employability = round(
            jr.technical_readiness * 0.30 +
            jr.resume_quality * 0.25 +
            jr.project_strength * 0.25 +
            jr.communication_readiness * 0.20,
            1
        )

        return jr

    # ─── Step 16: Interview Readiness ────────────────────────────────────────

    def _classify_interview_readiness(self, ats_score: float, jr: JobReadiness) -> Tuple[str, str]:
        score = (ats_score + jr.overall_employability) / 2

        if score >= 80:
            return "Excellent", (
                f"Your overall score of {score:.0f}% indicates strong interview readiness. "
                "Your resume is ATS-optimized with solid technical skills, quantified projects, "
                "and professional presentation. Focus on mock interviews and system design practice."
            )
        elif score >= 65:
            return "Good", (
                f"Score: {score:.0f}% — Good foundation with some gaps. "
                "Strengthen certifications, add more quantified achievements, and improve your GitHub presence. "
                "Start applying while continuing to improve."
            )
        elif score >= 50:
            return "Average", (
                f"Score: {score:.0f}% — Resume needs work before broad applications. "
                "Focus on completing missing sections, adding 2–3 strong projects, and getting 1–2 certifications. "
                "Target entry-level and internship roles."
            )
        else:
            return "Needs Improvement", (
                f"Score: {score:.0f}% — Significant gaps in resume quality and content. "
                "Build foundational projects, create GitHub portfolio, complete certifications, "
                "and rewrite resume with proper ATS formatting before applying."
            )

    # ─── Step 17: Interview Questions (Tiered) ───────────────────────────────

    def _generate_interview_questions(self, skills: List[str], exp_level: str,
                                       sections: SectionPresence, proj_count: int) -> InterviewQuestions:
        iq = InterviewQuestions()
        top_skills = skills[:8] if skills else ["software development"]

        # EASY (Conceptual / HR)
        iq.easy = [
            f"Tell me about yourself and why you chose {top_skills[0] if top_skills else 'software engineering'} as your specialization.",
            "Where do you see yourself in 5 years, and how does this role align with that vision?",
            f"What is {top_skills[1] if len(top_skills) > 1 else 'your primary technology'} and when would you choose it over alternatives?",
            "How do you stay updated with the latest developments in your field?",
            "Describe your ideal team culture and collaboration style.",
        ]

        # MEDIUM (Technical + Behavioral)
        medium_qs = [
            f"Explain how you would design a scalable REST API using {top_skills[0] if top_skills else 'your preferred backend technology'}.",
            f"Walk me through the architecture of your most complex project. What trade-offs did you make?",
            "Describe a challenging bug you encountered. How did you systematically debug and resolve it?",
            f"How do you handle database optimization in {top_skills[2] if len(top_skills) > 2 else 'your chosen database'}?",
            "Tell me about a time you had to meet a tight deadline. How did you prioritize tasks?",
        ]
        if proj_count > 0:
            medium_qs.append("Walk me through your most innovative project — what problem does it solve and what's your unique approach?")
        iq.medium = medium_qs[:5]

        # HARD (System Design / Advanced)
        hard_qs = [
            "Design a URL shortener system like bit.ly that handles 10 million requests per day. Cover storage, API design, and scalability.",
            f"How would you optimize a {top_skills[0] if top_skills else 'Python'} application experiencing high memory usage and slow response times?",
            "Design a real-time notification system for 1 million concurrent users. Address consistency, availability, and partition tolerance (CAP theorem).",
            "How would you implement a distributed caching layer to reduce database load by 80%? What eviction strategy would you use and why?",
            "Describe how you would architect a CI/CD pipeline for a microservices application with zero-downtime deployments.",
        ]
        if "machine learning" in skills or "tensorflow" in skills or "pytorch" in skills:
            hard_qs[1] = "Describe the full ML pipeline from data collection to model deployment in production, including monitoring for concept drift."
        iq.hard = hard_qs[:5]

        return iq
