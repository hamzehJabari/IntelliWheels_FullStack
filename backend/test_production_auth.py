#!/usr/bin/env python
"""
Test auth flow against PRODUCTION PostgreSQL on Render.
This tests the actual database your app uses.
"""

import os
import sys
import requests

# Production backend URL
BACKEND_URL = "https://intelliwheels.onrender.com"

def test_production_auth():
    """Test auth flow against production."""
    print("=" * 60)
    print("PRODUCTION AUTH TEST")
    print("=" * 60)
    print(f"Backend: {BACKEND_URL}")
    
    # Test 1: Health check
    print(f"\n1. Health check...")
    try:
        resp = requests.get(f"{BACKEND_URL}/api/system/health", timeout=30)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✓ Backend is healthy")
            print(f"     database: {data.get('database', 'unknown')}")
        else:
            print(f"   ✗ Health check failed: {resp.text}")
            return False
    except Exception as e:
        print(f"   ✗ Connection failed: {e}")
        return False
    
    # Test 2: Login
    print(f"\n2. Testing login...")
    login_data = {
        "username": "HamzaJabari",
        "password": "@Intelliwheels123"
    }
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            json=login_data,
            timeout=30
        )
        print(f"   Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success') and data.get('token'):
                token = data['token']
                print(f"   ✓ Login successful!")
                print(f"     Token: {token[:20]}... (length={len(token)})")
                print(f"     User: {data.get('user', {}).get('username')}")
            else:
                print(f"   ✗ Login failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"   ✗ Login failed: {resp.text}")
            return False
    except Exception as e:
        print(f"   ✗ Login request failed: {e}")
        return False
    
    # Test 3: Verify token
    print(f"\n3. Testing token verification...")
    try:
        resp = requests.get(
            f"{BACKEND_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        print(f"   Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('authenticated'):
                print(f"   ✓ Token verified successfully!")
                print(f"     User: {data.get('user', {}).get('username')}")
            else:
                print(f"   ✗ Token not authenticated: {data}")
                return False
        else:
            print(f"   ✗ Verify failed: {resp.text}")
            print(f"\n   DEBUG INFO:")
            print(f"   Token sent: {token}")
            print(f"   Token length: {len(token)}")
            return False
    except Exception as e:
        print(f"   ✗ Verify request failed: {e}")
        return False
    
    # Test 4: Protected endpoint (my-listings)
    print(f"\n4. Testing protected endpoint (my-listings)...")
    try:
        resp = requests.get(
            f"{BACKEND_URL}/api/my-listings",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        print(f"   Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✓ Protected endpoint accessed successfully!")
            print(f"     Listings count: {len(data.get('listings', []))}")
        else:
            print(f"   ✗ Protected endpoint failed: {resp.text}")
            return False
    except Exception as e:
        print(f"   ✗ Request failed: {e}")
        return False
    
    # Test 5: Favorites endpoint
    print(f"\n5. Testing protected endpoint (favorites)...")
    try:
        resp = requests.get(
            f"{BACKEND_URL}/api/favorites",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        print(f"   Status: {resp.status_code}")
        
        if resp.status_code == 200:
            print(f"   ✓ Favorites endpoint accessed successfully!")
        else:
            print(f"   ✗ Favorites endpoint failed: {resp.text}")
            return False
    except Exception as e:
        print(f"   ✗ Request failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✓ ALL PRODUCTION TESTS PASSED!")
    print("=" * 60)
    return True

if __name__ == '__main__':
    success = test_production_auth()
    sys.exit(0 if success else 1)
