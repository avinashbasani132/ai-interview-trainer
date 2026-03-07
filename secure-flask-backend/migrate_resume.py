import sqlite3

def alter_db():
    try:
        conn = sqlite3.connect('instance/dev.db')
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE resume_data ADD COLUMN strengths_json TEXT;")
        cursor.execute("ALTER TABLE resume_data ADD COLUMN weaknesses_json TEXT;")
        conn.commit()
        print("Successfully added columns.")
    except Exception as e:
        print("Migration note:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    alter_db()
