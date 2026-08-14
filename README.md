<div align="center">

<h1>🤖 AI Interview Trainer</h1>

<p><strong>A production-ready, full-stack AI platform that simulates real technical interviews, analyzes resumes with ATS scoring, and provides a personal AI Career Mentor — all in one application.</strong></p>

<br/>

<img src="https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge" alt="Status" />
<img src="https://img.shields.io/badge/Python-3.10+-3b82f6?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
<img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
<img src="https://img.shields.io/badge/Gemini_AI-Powered-8b5cf6?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
<img src="https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" />
<img src="https://img.shields.io/badge/TailwindCSS-v4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47a248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />

<br/><br/>

<img src="https://img.shields.io/badge/ATS_Analyzer-24_Step_Pipeline-6366f1?style=flat-square" />
<img src="https://img.shields.io/badge/AI_Chatbot-Context_Aware-8b5cf6?style=flat-square" />
<img src="https://img.shields.io/badge/JWT-Auth-10b981?style=flat-square" />
<img src="https://img.shields.io/badge/MongoDB-NoSQL-47a248?style=flat-square" />

</div>

---

## 📖 Overview

**AI Interview Trainer** is a comprehensive career preparation platform built for software engineering roles. It combines:

- 🏢 **Company-Based Placement Engine** — simulating 5-round recruitment cycles of 33 MNCs and Startups with dynamic follow-up dialogs and real-time evaluation.
- 🎯 **Career-Path interview simulation** (Aptitude → Technical AI → Coding → HR Video)
- 📄 **Professional ATS Resume Analyzer** with deterministic scoring
- 🤖 **Floating AI Career Chatbot** powered by Google Gemini, aware of your profile gaps
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

---

### 🏢 Company-Based Placement Assessment (MNC Interview Simulator)

Practice interviews simulating the official recruitment processes of **33 top MNCs, Services, and Tech Startups** (Google, Microsoft, Amazon, Swiggy, swarm, TCS, Infosys, Swiggy, Swiggy, Swiggy, Swiggy, swaps, Swiggy, swapped):
- 📂 **Selection Process Simulation**: Adapts to the target company's hiring style (Product-based vs. Service-based vs. Startup).
- 🛠️ **Configurable Setup**: Choose from **17 software engineering roles** and multiple difficulty levels.
- 🔊 **Voice I/O & TTS**: Built-in speech synthesis and text-to-speech transcription (STT).
- 📜 **Verification Certificates**: Complete overall assessments with $\ge 70\%$ to earn a digital signature verified accomplishment certificate.

---

## 🏗️ Architecture & Directory Layout

The project is split into a modular backend and a modern React client:

```
ai-interview-trainer/
├── backend/                  # Clean Flask REST API
│   ├── app.py                # Flask app factory, config & redirects
│   ├── config.py             # Configuration environments & Mongo Atlas loader
│   ├── models/               # MongoEngine ODM Document schemas (NoSQL)
│   ├── routes/               # Modular REST Blueprints
│   └── services/             # Backend system engines (Gemini integrations)
├── frontend-react/           # Single Page React Application
│   ├── vite.config.js        # Development API proxy config
│   ├── postcss.config.js     # PostCSS styling config
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── index.html            # Entry layout and Google fonts
│   └── src/                  # React source files
│       ├── main.jsx          # StrictMode rendering bootstrap
│       ├── App.jsx           # App wrapper, sidebar states, active views
│       ├── index.css         # Tailwind v4 directives, loaders, light inversion
│       ├── components/       # Common reusable components (Sidebar, ChatWidget)
│       ├── services/         # Fetch API client integration layer
│       └── views/            # Dashboard, Resume, Rounds, Arena, Leaderboard, etc.
├── render.yaml               # Auto-compiling Render deployment script
├── Procfile                  # Server entry definitions
└── requirements.txt          # Python requirements
```

---

## 🛠️ Technology Stack

### Backend
*   **Python 3.10+** / **Flask 3.x**
*   **MongoEngine** / **MongoDB Atlas**
*   **Google Generative AI (Gemini 2.0 Flash)**
*   **scikit-learn** (ML readiness predictor)
*   **ReportLab** (verifiable PDF reports)
*   **PyPDF2** & **python-docx** (resume parsers)

### Frontend
*   **React 18** / **Vite** (Client SPA engine)
*   **Tailwind CSS v4** (Aesthetic UI styling)
*   **Chart.js** (Readiness scoreboard visualizations)
*   **Monaco Editor** (Algorithmic practice console)
*   **lucide-react** (Interface icons)

---

## ⚙️ Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/avinashbasani132/ai-interview-trainer.git
cd ai-interview-trainer
```

### 2. Configure Backend
Create a `.env` file inside the `backend/` directory:
```env
API_KEY=your_google_gemini_api_key_here
SECRET_KEY=your-secure-flask-secret-key
JWT_SECRET_KEY=your-secure-jwt-secret-key
MONGODB_URI=mongodb+srv://avinashbasani132_db_user:<db_password>@cluster0.faq5odf.mongodb.net/interview_trainer?retryWrites=true&w=majority
```

Install requirements and start Python dev server:
```bash
cd backend
python -m venv .venv
# Activate virtual environment
.venv\Scripts\activate # On macOS/Linux use: source .venv/bin/activate
pip install -r requirements.txt
python manage.py --mode dev
```
The backend server runs on `http://127.0.0.1:8000`.

### 3. Configure Frontend
Navigate into the `frontend-react` directory, install packages, and start Vite dev server:
```bash
cd ../frontend-react
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. All API requests are automatically proxied to the backend server.

### 4. Serve React via Flask (Production mode)
Build the React production bundle:
```bash
cd frontend-react
npm run build
```
Now, when you run `python manage.py --mode dev` or `python manage.py --mode prod --port 8000` from the backend directory, Flask serves the built SPA files directly on port `8000`.

---

## 🔐 Security & Deployment

*   All database queries are routed securely to **MongoDB Atlas**.
*   **JWT tokens** (with 30-day expiry) secure all actions except signup/login.
*   Render deployment automatically installs dependencies and compiles the React application utilizing:
    ```yaml
    buildCommand: pip install -r requirements.txt && npm --prefix frontend-react install && npm --prefix frontend-react run build
    ```
