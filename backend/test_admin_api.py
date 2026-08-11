import sys
import os
import requests
import json

# Setup paths to import backend stuff if needed, but we can just use HTTP
BASE_URL = 'http://127.0.0.1:8000/api'

def test_admin_portal():
    # We will just write a script to register an admin user, login, and fetch stats
    email = "admin_test@test.com"
    password = "password"
    
    print("1. Registering user...")
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "username": "Admin Test"})
    # It might already exist, which is fine
    
    print("2. Promoting to admin...")
    # Need to run it via CLI or DB directly, but we can just hit login first
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if not res.ok:
        print(f"Login failed: {res.text}")
        return
    
    token = res.json().get('data', {}).get('access_token')
    if not token:
        print("No token received")
        return
        
    print(f"Token obtained: {token[:10]}...")
    
    # We will just assume it's promoted externally if it returns 403, but let's test if we get 403
    headers = {"Authorization": f"Bearer {token}"}
    
    print("3. Fetching stats...")
    res = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
    print(f"Stats response ({res.status_code}): {res.text}")
    
    print("4. Fetching users...")
    res = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print(f"Users response ({res.status_code}): {res.text[:100]}...")
    
    print("5. Bypassing round...")
    res = requests.post(f"{BASE_URL}/admin/bypass-round", headers=headers, json={"round": 4})
    print(f"Bypass response ({res.status_code}): {res.text}")

if __name__ == "__main__":
    test_admin_portal()
