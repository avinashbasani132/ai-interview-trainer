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

## Installation Steps
1. Clone the repository natively.
2. Navigate into the backend directory:
   ```bash
   cd secure-flask-backend
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
5. Run the application:
   ```bash
   python app.py
   ```
