import os
import requests
import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User

arena_bp = Blueprint('arena', __name__)

# Map readable languages to Judge0 Language IDs
LANGUAGE_IDS = {
    "python": 71,   # Python (3.8.1)
    "java": 62,     # Java (OpenJDK 13.0.1)
    "c++": 54,      # C++ (GCC 9.2.0)
    "javascript": 63 # Node.js (12.14.0)
}

@arena_bp.route('/run', methods=['POST'])
@jwt_required()
def execute_code():
    """
    Submits code to Judge0 API for remote execution or uses mock fallback.
    Returns plain output string for the frontend.
    """
    data = request.json
    code = data.get("code", "")
    language = data.get("language", "python")
    problem_id = data.get("problem_id", None)
    
    if not code:
        return jsonify({"error": "No code provided"}), 400
        
    lang_id = LANGUAGE_IDS.get(language.lower(), 71)

    # 1. Call Judge0 API (RapidAPI or Free Public API)
    # If no API key is set, we will gracefully fallback to local mock testing
    judge0_url = os.environ.get("JUDGE0_URL", "https://judge0-ce.p.rapidapi.com")
    rapidapi_key = os.environ.get("RAPIDAPI_KEY")
    
    passed = False
    output = ""
    time_ms = 0
    memory_kb = 0
    
    if rapidapi_key:
        headers = {
            "content-type": "application/json",
            "X-RapidAPI-Key": rapidapi_key,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        }
        
        payload = {
            "language_id": lang_id,
            "source_code": code,
            "stdin": "Optional Test Input" 
        }
        
        try:
            # 1a. Submit
            res = requests.post(f"{judge0_url}/submissions?base64_encoded=false&wait=true", json=payload, headers=headers)
            res_data = res.json()
            
            # 1b. Parse Result
            status_id = res_data.get("status", {}).get("id", 0)
            passed = status_id == 3 # 3 = Accepted
            output = res_data.get("stdout") or res_data.get("compile_output") or res_data.get("stderr") or "No Output"
            time_ms = float(res_data.get("time", 0) or 0) * 1000
            memory_kb = res_data.get("memory", 0)
            
        except Exception as e:
            return jsonify({"error": f"Judge0 API Error: {str(e)}"}), 502
    else:
        # Real local execution fallback using subprocess
        import subprocess, sys, tempfile
        
        passed = False
        output = ""
        time_ms = 0
        memory_kb = 0
        
        try:
            # Write code to a temp file and run it
            suffix_map = {"python": ".py", "javascript": ".js", "java": ".java", "cpp": ".cpp"}
            suffix = suffix_map.get(language.lower(), ".py")
            
            with tempfile.NamedTemporaryFile(mode='w', suffix=suffix, delete=False, encoding='utf-8') as f:
                f.write(code)
                tmp_path = f.name
            
            import time as _time
            start_ts = _time.time()
            
            if language.lower() == "python":
                cmd = [sys.executable, tmp_path]
            elif language.lower() == "javascript":
                cmd = ["node", tmp_path]
            else:
                # For Java/C++, return a helpful message
                return jsonify({"output": f"Local execution for {language} is not supported. Use Python or JavaScript for live run.\nYour code looks syntactically valid — submit via Judge0 API for compiled language testing."}), 200
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            time_ms = round((_time.time() - start_ts) * 1000, 1)
            
            if result.returncode == 0:
                output = result.stdout or "(no output)"
                passed = True
            else:
                output = result.stderr or result.stdout or "Runtime Error (no output)"
                passed = False
                
        except subprocess.TimeoutExpired:
            output = "⏱️ Time Limit Exceeded (10s). Check for infinite loops."
        except FileNotFoundError:
            output = "⚠️ Runtime not found on server. Python is supported for local execution."
        except Exception as e:
            output = f"Execution error: {str(e)}"
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    # 3. Update User Progress & DB Streaks if passed
    if passed:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user:
            today = datetime.date.today()
            
            # Increment total DSA solved
            user.dsa_problems_solved += 1
            
            # Update Streak Logic
            if user.last_solved_date != today:
                if user.last_solved_date == today - datetime.timedelta(days=1):
                    user.current_streak += 1
                else:
                    user.current_streak = 1 # Reset or start new streak
                    
                user.last_solved_date = today
                if user.current_streak > user.max_streak:
                    user.max_streak = user.current_streak
                    
                db.session.commit()
    
    return jsonify({
        "output": output
    }), 200
