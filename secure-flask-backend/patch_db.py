import sqlite3
import os

db_path = os.path.join('instance', 'dev.db')
if not os.path.exists(db_path):
    # try root dir if not in instance
    db_path = 'dev.db'

print(f"Patching database at {db_path}...")
conn = sqlite3.connect(db_path)
c = conn.cursor()

columns = [
    ('username', 'VARCHAR(80)'),
    ('job_readiness_score', 'FLOAT DEFAULT 0.0'),
    ('total_interviews', 'INTEGER DEFAULT 0'),
    ('rounds_cleared', 'INTEGER DEFAULT 0'),
    ('failed_attempts', 'INTEGER DEFAULT 0'),
    ('dsa_problems_solved', 'INTEGER DEFAULT 0'),
    ('average_score', 'FLOAT DEFAULT 0.0'),
    ('current_streak', 'INTEGER DEFAULT 0'),
    ('max_streak', 'INTEGER DEFAULT 0'),
    ('last_solved_date', 'DATE'),
    ('tech_score_sum', 'FLOAT DEFAULT 0.0'),
    ('hr_score_sum', 'FLOAT DEFAULT 0.0'),
    ('aptitude_score_sum', 'FLOAT DEFAULT 0.0'),
    ('tech_attempts', 'INTEGER DEFAULT 0'),
    ('hr_attempts', 'INTEGER DEFAULT 0'),
    ('aptitude_attempts', 'INTEGER DEFAULT 0')
]

for col_name, col_type in columns:
    try:
        c.execute(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}')
        print(f"Added {col_name}")
    except sqlite3.OperationalError as e:
        print(f"Column {col_name} might already exist: {e}")

try:
    c.execute('ALTER TABLE resume_data ADD COLUMN score FLOAT DEFAULT 0.0')
    c.execute('ALTER TABLE resume_data ADD COLUMN suggestions_json TEXT')
    c.execute('ALTER TABLE resume_data ADD COLUMN missing_skills_json TEXT')
except Exception as e:
    print(e)
    
try:
    c.execute('ALTER TABLE interview_sessions ADD COLUMN company_id INTEGER')
except Exception as e:
    pass

try:
    c.execute('ALTER TABLE dsa_problems ADD COLUMN topic VARCHAR(100)')
except Exception as e:
    pass

conn.commit()
conn.close()
print("Patch complete.")
