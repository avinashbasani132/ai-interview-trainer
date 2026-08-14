import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient

try:
    import certifi
    ca = certifi.where()
except ImportError:
    ca = None

# Load environment variables
load_dotenv()

# Get connection URI
mongo_uri = os.getenv("MONGODB_URI")

if not mongo_uri:
    print("[Error] MONGODB_URI not found in backend/.env file.")
    sys.exit(1)

# Mask password for printing
masked_uri = mongo_uri
if "@" in mongo_uri:
    prefix, suffix = mongo_uri.split("@", 1)
    if ":" in prefix:
        proto, auth = prefix.split("://", 1)
        user = auth.split(":", 1)[0]
        masked_uri = f"{proto}://{user}:******@{suffix}"

print(f"[Info] Attempting connection to: {masked_uri}")

try:
    # Use certifi CA file if available to prevent TLS handshake issues
    if ca:
        print("[Security] Loading certifi SSL CA bundle...")
        client = MongoClient(mongo_uri, tlsCAFile=ca, serverSelectionTimeoutMS=5000)
    else:
        # Fallback to allowing invalid certs if SSL negotiation fails
        client = MongoClient(mongo_uri, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
        
    # Trigger connection check
    db_names = client.list_database_names()
    print("[Success] Connection Successful!")
    print("\nAvailable Databases:")
    for db_name in db_names:
        print(f" - {db_name}")
        
    # Check collections in our specific app database
    app_db = client["interview_trainer"]
    collections = app_db.list_collection_names()
    print(f"\nCollections in 'interview_trainer':")
    if collections:
        for col in collections:
            count = app_db[col].count_documents({})
            print(f" - {col} ({count} documents)")
    else:
        print(" (No collections found yet. Run the app or register a user to insert data!)")
        
except Exception as e:
    print("[Error] Connection Failed!")
    print(f"Error Details: {e}")
    print("\nAttempting connection with tlsAllowInvalidCertificates=True fallback...")
    try:
        client = MongoClient(mongo_uri, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
        db_names = client.list_database_names()
        print("[Success] Connection Successful (with tlsAllowInvalidCertificates fallback)!")
        
        # Check collections in our specific app database
        app_db = client["interview_trainer"]
        collections = app_db.list_collection_names()
        print(f"\nCollections in 'interview_trainer':")
        if collections:
            for col in collections:
                count = app_db[col].count_documents({})
                print(f" - {col} ({count} documents)")
        else:
            print(" (No collections found yet. Run the app or register a user to insert data!)")
    except Exception as fallback_err:
        print(f"[Error] Fallback Connection also Failed: {fallback_err}")
