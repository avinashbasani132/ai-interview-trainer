<div align="center">
  <br />
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Project Status" />
  <img src="https://img.shields.io/badge/Python-3.x-blue.svg" alt="Python Version" />
  <img src="https://img.shields.io/badge/Vanilla-JS-yellow.svg" alt="Vanilla JS" />
  <img src="https://img.shields.io/badge/Flask-Backend-black.svg" alt="Flask Backend" />
  <br />
  <h1>🤖 AI Interview Trainer</h1>
  <p>
    An enterprise-grade, full-stack AI platform designed to simulate realistic technical and HR interview scenarios, providing candidates with actionable feedback and analytics.
  </p>
</div>

<br />

## 📖 Overview

The **AI Interview Trainer** is a robust, production-ready application aimed at bridging the gap between theoretical knowledge and practical interview execution. By leveraging advanced Large Language Models (Google Gemini), the platform offers dynamic, conversational mock interviews, real-time code execution, and comprehensive ATS resume analysis. 

Built with a strictly decoupled architecture, the system ensures maximum scalability, security, and maintainability.

## ✨ Core Features

- **🧠 Dynamic AI Interviews:** Engaging, adaptive mock interviews for Technical and HR rounds that adjust difficulty based on candidate responses.
- **📄 Smart Resume Analysis:** Advanced ATS compatibility parsing that extracts core strengths, identifies weaknesses, and generates tailored interview questions.
- **💻 Live Coding Arena:** A HackerRank-style embedded execution environment allowing users to practice Data Structures and Algorithms (DSA) without leaving the browser.
- **📊 Comprehensive Analytics:** Visual performance dashboards utilizing Chart.js to track historical success rates, module completions, and ML-driven readiness predictions.
- **⏱️ Automated Aptitude Testing:** Timed, automatically graded multiple-choice tests assessing quantitative and logical reasoning.

## 🛠️ Technology Stack

Our architecture strictly separates concerns between the client and server:

### Frontend Layer
- **Core:** Vanilla JavaScript (ES6+), HTML5
- **Styling:** TailwindCSS (CDN for zero-build overhead)
- **Visualization:** Chart.js

### Backend API Layer
- **Framework:** Python Flask (Strict JSON API)
- **Database:** SQLite / SQLAlchemy (ORM)
- **Security:** Flask-JWT-Extended, Flask-CORS, Bcrypt
- **AI Integration:** Google Generative AI (Gemini)

## 🚀 Recent Architecture Updates (v2.0)

To ensure enterprise-level stability, the application has recently undergone a major architectural refactor:
- **True Decoupling:** Stripped all UI rendering from the Flask server. The frontend and backend now operate as completely isolated services.
- **API Standardization:** Enforced a strict `{ "success", "message", "data" }` JSON response schema across all endpoints.
- **Enhanced Security:** Implemented comprehensive CORS policies and fortified JWT validation sequences.

---

## ⚙️ Local Development Setup

To run the application locally, you must spin up both the backend API and the frontend client.

### 1. Backend API Initialization
1. Clone the repository and navigate to the backend directory:
   ```bash
   git clone https://github.com/avinashbasani132/ai-interview-trainer.git
   cd ai-interview-trainer/backend
   ```
2. Create a `.env` file in the `backend` root:
   ```env
   API_KEY=your_google_gemini_api_key
   SECRET_KEY=your_secure_flask_secret
   JWT_SECRET_KEY=your_secure_jwt_secret
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the secure API server (Defaults to Port 5000):
   ```bash
   python manage.py --port 5000
   ```

### 2. Frontend Client Initialization
1. Open a new terminal instance and navigate to the frontend directory:
   ```bash
   cd ai-interview-trainer/frontend
   ```
2. Start a static HTTP server (using Python's built-in module):
   ```bash
   python -m http.server 8000
   ```
3. Access the application by navigating to `http://localhost:8000` in your browser.

---

<div align="center">
  <p>Built with ❤️ by Avinash &copy; 2026</p>
</div>
