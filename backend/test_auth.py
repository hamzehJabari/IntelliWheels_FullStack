#!/usr/bin/env python
"""
Test script for auth flow - tests login -> verify -> protected endpoints
Run this to verify the auth system works before deploying.
"""

import os
import sys

# Force SQLite for local testing (comment out to test with PostgreSQL)
# os.environ['DATABASE_URL'] = ''

from app import create_app
from app.db import get_db, is_postgres
from app.routes.auth import generate_token, get_user_from_token
from werkzeug.security import generate_password_hash
from datetime import datetime, timezone, timedelta

def test_auth_flow():
    """Test the complete auth flow."""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("AUTH FLOW TEST")
        print("=" * 60)
        
        db = get_db()
        print(f"\n1. Database check:")
        print(f"   is_postgres(): {is_postgres()}")
        
        # Create test user
        print(f"\n2. Creating test user...")
        test_username = "auth_test_user"
        test_email = "auth_test@test.com"
        test_password = "TestPassword123"
        
        # Clean up any existing test user
        try:
            if is_postgres():
                db.execute('DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE username = %s)', (test_username,))
                db.execute('DELETE FROM users WHERE username = %s', (test_username,))
            else:
                db.execute('DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE username = ?)', (test_username,))
                db.execute('DELETE FROM users WHERE username = ?', (test_username,))
            db.commit()
        except Exception as e:
            print(f"   Cleanup error (ignored): {e}")
        
        # Create user
        password_hash = generate_password_hash(test_password, method='pbkdf2:sha256:260000')
        try:
            if is_postgres():
                cursor = db.execute(
                    'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id',
                    (test_username, test_email, password_hash)
                )
                user_id = cursor.fetchone()['id']
            else:
                cursor = db.execute(
                    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                    (test_username, test_email, password_hash)
                )
                user_id = cursor.lastrowid
            db.commit()
            print(f"   ✓ User created: id={user_id}, username={test_username}")
        except Exception as e:
            print(f"   ✗ Failed to create user: {e}")
            return False
        
        # Generate token and create session
        print(f"\n3. Creating session...")
        token = generate_token()
        print(f"   Generated token: {token[:20]}... (length={len(token)})")
        print(f"   Token contains '-': {'-' in token}")
        print(f"   Token contains '_': {'_' in token}")
        
        # Store session - use naive UTC datetime
        expires_at_utc = datetime.now(timezone.utc) + timedelta(days=7)
        expires_at = expires_at_utc.replace(tzinfo=None)  # Strip timezone
        
        try:
            if is_postgres():
                db.execute(
                    'INSERT INTO user_sessions (token, user_id, expires_at) VALUES (%s, %s, %s)',
                    (token, user_id, expires_at)
                )
            else:
                db.execute(
                    'INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
                    (token, user_id, expires_at)
                )
            db.commit()
            print(f"   ✓ Session created, expires_at={expires_at}")
        except Exception as e:
            print(f"   ✗ Failed to create session: {e}")
            return False
        
        # Verify session exists in DB
        print(f"\n4. Verifying session in database...")
        try:
            if is_postgres():
                row = db.execute('SELECT token, user_id, expires_at FROM user_sessions WHERE token = %s', (token,)).fetchone()
            else:
                row = db.execute('SELECT token, user_id, expires_at FROM user_sessions WHERE token = ?', (token,)).fetchone()
            
            if row:
                print(f"   ✓ Session found in DB:")
                print(f"     token={row['token'][:20]}...")
                print(f"     user_id={row['user_id']}")
                print(f"     expires_at={row['expires_at']}")
            else:
                print(f"   ✗ Session NOT found in DB!")
                return False
        except Exception as e:
            print(f"   ✗ Error querying session: {e}")
            return False
        
        # Test get_user_from_token
        print(f"\n5. Testing get_user_from_token()...")
        user = get_user_from_token(token)
        if user:
            print(f"   ✓ User retrieved successfully:")
            print(f"     id={user['id']}")
            print(f"     username={user['username']}")
            print(f"     email={user['email']}")
        else:
            print(f"   ✗ get_user_from_token() returned None!")
            print(f"\n   DEBUGGING:")
            
            # Check if token was corrupted
            from app.security import sanitize_string
            sanitized = sanitize_string(token)[:64]
            print(f"   Original token:  {token}")
            print(f"   Sanitized token: {sanitized}")
            print(f"   Tokens match: {token == sanitized}")
            
            # Check timestamp comparison
            if is_postgres():
                time_check = db.execute("SELECT NOW() as now_local, NOW() AT TIME ZONE 'UTC' as now_utc").fetchone()
                print(f"   PostgreSQL NOW(): {time_check['now_local']}")
                print(f"   PostgreSQL NOW() AT TIME ZONE 'UTC': {time_check['now_utc']}")
            else:
                time_check = db.execute("SELECT CURRENT_TIMESTAMP as now").fetchone()
                print(f"   SQLite CURRENT_TIMESTAMP: {time_check['now']}")
            
            print(f"   Python UTC now (naive): {datetime.now(timezone.utc).replace(tzinfo=None)}")
            print(f"   Session expires_at: {expires_at}")
            
            return False
        
        # Cleanup
        print(f"\n6. Cleaning up test data...")
        try:
            if is_postgres():
                db.execute('DELETE FROM user_sessions WHERE user_id = %s', (user_id,))
                db.execute('DELETE FROM users WHERE id = %s', (user_id,))
            else:
                db.execute('DELETE FROM user_sessions WHERE user_id = ?', (user_id,))
                db.execute('DELETE FROM users WHERE id = ?', (user_id,))
            db.commit()
            print(f"   ✓ Test data cleaned up")
        except Exception as e:
            print(f"   Warning: Cleanup failed: {e}")
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        return True

if __name__ == '__main__':
    success = test_auth_flow()
    sys.exit(0 if success else 1)
