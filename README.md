# AI Interview Trainer

A full-stack AI-powered application designed to simulate realistic interview scenarios, complete with Aptitude, Technical, and HR rounds.

## Features
- **AI Interview Simulation**: Realistic, conversational mock interviews powered by Google Gemini.
- **Resume Analysis**: ATS compatibility scoring and extraction of strengths and weaknesses.
- **Aptitude Testing**: Automated MCQ testing with immediate feedback.
- **Coding Arena**: Live code execution environment for practicing DSA problems.
- **Performance Analytics**: Visual dashboards showing round success rates and ML predictions.

## Tech Stack
- **Frontend**: Vanilla JavaScript, TailwindCSS, Chart.js
- **Backend**: Python, Flask, SQLAlchemy, Flask-JWT-Extended
- **AI**: Google Generative AI (Gemini)

## Recent Updates (Version 2.0)
- **Decoupled Architecture:** Separated the Flask backend from the Vanilla JS frontend for true API-driven development.
- **API Standardization:** Hardened authentication routes (`/register`, `/login`) to use a strict, predictable JSON format.
- **Security Enhancements:** Implemented global CORS policies and enforced JWT protection on all private routes.
- **Clean Repository:** Standardized `.gitignore` to prevent secret leaks and cache bloating.

## Architecture
This project uses a decoupled architecture. The frontend is a pure Vanilla JS application, and the backend is a standalone Flask JSON API.

## Installation Steps

### 1. Backend Setup
1. Clone the repository.
2. Navigate into the backend directory:
   ```bash
   cd backend
   ```
3. Create a `.env` file containing:
   ```env
   API_KEY=your_gemini_api_key
   SECRET_KEY=your_secret_key
   JWT_SECRET_KEY=your_jwt_secret
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the backend API server:
   ```bash
   python manage.py --port 5000
   ```
   The backend will run on `http://127.0.0.1:5000`.

### 2. Frontend Setup
1. Open a new terminal.
2. Navigate into the frontend directory:
   ```bash
   cd frontend
   ```
3. Start a simple static file server (e.g., using Python):
   ```bash
   python -m http.server 8000
   ```
4. Open your browser and go to `http://localhost:8000` to view the application.
