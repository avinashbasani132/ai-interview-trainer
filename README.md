<div align="center">

<h1>🤖 AI Interview Trainer</h1>

<p><strong>A production-ready, full-stack AI platform that simulates real technical interviews, analyzes resumes with ATS scoring, and provides a personal AI Career Mentor — all in one application.</strong></p>

<br/>

<img src="https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge" alt="Status" />
<img src="https://img.shields.io/badge/Python-3.10+-3b82f6?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
<img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
<img src="https://img.shields.io/badge/Gemini_AI-Powered-8b5cf6?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
<img src="https://img.shields.io/badge/Vanilla_JS-ES6+-f59e0b?style=for-the-badge&logo=javascript&logoColor=black" alt="JS" />
<img src="https://img.shields.io/badge/TailwindCSS-CDN-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />

<br/><br/>

<img src="https://img.shields.io/badge/ATS_Analyzer-24_Step_Pipeline-6366f1?style=flat-square" />
<img src="https://img.shields.io/badge/AI_Chatbot-Context_Aware-8b5cf6?style=flat-square" />
<img src="https://img.shields.io/badge/JWT-Auth-10b981?style=flat-square" />
<img src="https://img.shields.io/badge/SQLite-ORM-64748b?style=flat-square" />

</div>

---

## 📖 Overview

**AI Interview Trainer** is a comprehensive career preparation platform built for students and professionals targeting software engineering roles. It combines:

- 🎯 **4-stage interview simulation** (Aptitude → Technical AI → Coding → HR Video)
- 📄 **Professional ATS Resume Analyzer** with deterministic scoring
- 🤖 **Floating AI Career Chatbot** powered by Google Gemini
- 📊 **ML-powered readiness prediction** and performance analytics
- 💻 **Live coding arena** with Monaco editor and real-time code execution
- 🏆 **Leaderboard, community posts, and learning roadmaps**

---

## ✨ Feature Overview

### 🎯 Interview Simulation Engine
A fully simulated, 4-round interview process that mimics real company hiring pipelines:

| Round | Type | Format | Pass Mark |
|-------|------|--------|-----------|
| 1 | Aptitude MCQ | 25 questions, 30-minute timer | 60% |
| 2 | Technical AI Interview | 5 adaptive questions via Gemini | 70% |
| 3 | Live Coding Arena | 1 DSA problem in Monaco editor | 70% |
| 4 | HR Video Round | Record & AI-evaluate behavioural answers | 70% |

---

### 📄 ATS Resume Analyzer — 24-Step Pipeline

Upload a **PDF or DOCX** resume and receive a full ATS analysis:

| Category | Max Score | What's Checked |
|----------|-----------|----------------|
| Contact Information | 5 | Email, Phone, GitHub, LinkedIn, Portfolio |
| Professional Summary | 10 | Presence, quality, length |
| Technical Skills | 20 | Technology detection across 8 categories |
| Projects | 20 | Count, quantified impact, tech stack |
| Work Experience | 15 | Roles, companies, achievements |
| Education | 10 | Degree, institution, GPA/percentage |
| Certifications | 5 | Industry-recognized certs |
| Keyword Matching | 10 | Job-market keyword alignment |
| ATS Formatting | 5 | Clean structure, no tables/images |

**Additional Analysis:**
- 🔍 Grammar & readability check
- 📈 Keyword density scoring
- 🎯 Job readiness dimensions (Technical, Quality, Projects, Experience)
- ❓ 15 tiered interview questions (5 Easy / 5 Medium / 5 Hard)
- 🗺️ Personalized learning roadmap
- 📥 PDF report download

---

### 🤖 AI Career Assistant (Floating Chatbot)

A context-aware AI mentor available on every page via a **floating purple button** (bottom-right corner). Backed by Google Gemini with full user profile injection.

**What it knows about you:**
- Your ATS score, detected skills, and resume weaknesses
- Your interview round history and scores
- Your weak topics from AI analysis
- Your coding performance and DSA problems solved

**What it can help with:**

| Topic | Examples |
|-------|---------|
| Resume Help | "Improve my ATS score", "What skills am I missing?" |
| Interview Prep | "Start a mock interview", "Give me follow-up questions" |
| Coding Guidance | Python, Java, C++, JS, React, Flask, DSA, OOP, SQL |
| Career Advice | "What companies match my skills?", "What salary can I expect?" |
| Company Prep | Google, Amazon, Microsoft, Meta, TCS, Infosys, Wipro, Accenture |
| Learning Plans | Courses, roadmaps, YouTube playlists, daily goals |

**UI Features:**
- 💬 Markdown rendering with `marked.js`
- 🌈 Syntax-highlighted code blocks via `highlight.js`
- ⌨️ Typing animation (3-dot bounce)
- 📋 Copy response button
- 🔄 Retry/Regenerate response
- 🗑️ Clear conversation
- 💾 Persistent history stored in database
- 📱 Mobile responsive

---

### 📊 Dashboard & Analytics

- **Job Readiness Score** — ML-predicted percentage based on performance
- **Streak Tracker** — Daily interview practice streak
- **Round Progress** — Visual stepper showing cleared/locked rounds
- **Performance Charts** — Chart.js graphs for success rates per module
- **Quick Actions** — Direct links to Resume, Rounds, Arena, Learning
- **Achievements** — Milestone badge system

---

### 💻 Live Coding Arena

- Monaco Editor (VS Code engine) with multi-language support
- Supported: Python, JavaScript, Java, C++, Go
- Real-time code execution via backend judge
- DSA problem library with difficulty levels

---

### 🏆 Leaderboard & Community

- Global leaderboard ranked by readiness score
- Community discussion board with post creation
- History tracking — search and filter past interview sessions

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.10+ | Core language |
| Flask 3.x | REST API framework |
| Flask-JWT-Extended | Authentication (JWT, 30-day tokens) |
| Flask-CORS | Cross-origin resource sharing |
| Flask-Bcrypt | Password hashing |
| SQLAlchemy + SQLite | ORM + Database |
| Google Generative AI (Gemini 2.0 Flash) | AI interviews, chatbot, evaluation |
| PyPDF2 + python-docx | Resume PDF/DOCX parsing |
| ReportLab | PDF report generation |
| scikit-learn | ML readiness prediction |

### Frontend
| Technology | Purpose |
|-----------|---------|
| Vanilla JavaScript (ES6+) | SPA routing, all logic |
| HTML5 + TailwindCSS (CDN) | Structure and styling |
| Chart.js | Performance analytics graphs |
| Monaco Editor | Live code editor |
| marked.js | Markdown rendering in chatbot |
| highlight.js | Code syntax highlighting |

---

## 🏗️ Project Structure

```
ai-interview-trainer/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory + blueprint registry
│   │   ├── models.py            # SQLAlchemy models (User, Resume, Chat, etc.)
│   │   ├── core/
│   │   │   └── config.py        # Environment configuration
│   │   ├── routes/
│   │   │   ├── auth.py          # /api/auth  — Login, Register
│   │   │   ├── user.py          # /api/user  — Dashboard, Analytics
│   │   │   ├── resume.py        # /api/resume — Upload, History, Report
│   │   │   ├── interview.py     # /api/interview — Rounds, Evaluation
│   │   │   ├── arena.py         # /api/code  — Code Execution
│   │   │   ├── chatbot.py       # /api/chat  — AI Career Assistant
│   │   │   ├── community.py     # /api/community — Posts
│   │   │   ├── roadmap.py       # /api/roadmap — Learning steps
│   │   │   └── leaderboard.py   # /api/leaderboard
│   │   └── services/
│   │       ├── ai_service.py        # Gemini AI wrapper
│   │       ├── ats_analyzer.py      # 24-step ATS analysis engine
│   │       ├── chatbot_service.py   # Context-aware chatbot service
│   │       ├── docx_parser.py       # PDF/DOCX text extraction
│   │       ├── ml_prediction.py     # Readiness score ML model
│   │       └── dsa_service.py       # DSA problem service
│   ├── instance/
│   │   └── dev.db               # SQLite database (auto-created)
│   ├── manage.py                # Application entry point
│   └── requirements.txt
└── frontend/
    ├── index.html               # Single Page Application shell
    └── js/
        └── app.js               # Complete SPA logic (~2900 lines)
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js (optional, for syntax checking)
- Google Gemini API key — [Get one here](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/avinashbasani132/ai-interview-trainer.git
cd ai-interview-trainer
```

### 2. Create Python Virtual Environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
API_KEY=your_google_gemini_api_key_here
SECRET_KEY=your-secure-flask-secret-key
JWT_SECRET_KEY=your-secure-jwt-secret-key
```

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

### 5. Start the Application
```bash
# From the backend/ directory
python manage.py --mode dev
```

The application serves both the **API and frontend** from a single server at:
```
http://localhost:8000
```

> The Flask server serves `frontend/index.html` as a static SPA. No separate frontend server is needed.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/user/dashboard` | User stats, readiness score |
| POST | `/api/resume/upload-resume` | Upload & analyze resume (PDF/DOCX) |
| GET | `/api/resume/history` | Past resume analyses |
| GET | `/api/resume/download-report/<id>` | Download PDF report |
| POST | `/api/interview/start` | Start interview session |
| POST | `/api/interview/submit-answer` | Submit round answer |
| POST | `/api/code/run` | Execute code in Arena |
| POST | `/api/chat/message` | Send chatbot message |
| GET | `/api/chat/history` | Get chat history |
| DELETE | `/api/chat/clear` | Clear chat history |
| GET | `/api/chat/suggestions` | Get suggested questions |
| GET | `/api/leaderboard` | Global leaderboard |
| GET | `/api/roadmap/` | Learning roadmap steps |

> All endpoints except `/api/auth/*` require a valid JWT `Authorization: Bearer <token>` header.

---

## 🗄️ Database Models

| Model | Table | Description |
|-------|-------|-------------|
| `User` | `users` | Auth, stats, streaks |
| `ResumeData` | `resume_data` | Full ATS analysis (32 columns) |
| `InterviewSession` | `interview_sessions` | Session tracking |
| `RoundResult` | `round_results` | Per-round scores |
| `ChatMessage` | `chat_messages` | AI chatbot history |
| `LearningRoadmap` | `learning_roadmaps` | Step completion |
| `LearningRecommendation` | `learning_recommendations` | Weak topics |
| `CommunityPost` | `community_posts` | Discussion board |
| `DSASubmission` | `dsa_submissions` | Code arena submissions |

---

## 🔐 Security

- Passwords hashed with **Bcrypt** (never stored as plaintext)
- JWT tokens with **30-day expiry**
- **CORS** restricted to allowed origins
- API keys loaded from environment variables — **never exposed to frontend**
- All protected endpoints require valid JWT
- Input validation and sanitization on all routes

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **Avinash Basani** &copy; 2026

<br/>

⭐ If this project helped you, please consider giving it a star!

</div>
