from flask import Blueprint, request, jsonify, g, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from ..db import get_db, is_postgres
from ..security import (
    validate_username, validate_email, validate_password,
    sanitize_string, rate_limit, validate_json_request
)
import secrets
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

# Google OAuth
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    HAS_GOOGLE_AUTH = True
except ImportError:
    HAS_GOOGLE_AUTH = False
    print("[Auth] google-auth not installed - Google OAuth disabled")

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Email config
SMTP_HOST = os.getenv('SMTP_HOST', '')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASS = os.getenv('SMTP_PASS', '')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', '')

# Google OAuth config
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
FRONTEND_URL = os.getenv('FRONTEND_ORIGIN', 'http://localhost:3000')

def send_auth_email(to_email, subject, body):
    """Send an authentication email (password reset, etc.)."""
    if not SMTP_HOST or not SMTP_USER:
        print(f"[Auth Email] Would send to {to_email}: {subject}")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        print(f"[Auth Email] Sent to {to_email}")
        return True
    except Exception as e:
        print(f"[Auth Email Error] Failed to send: {e}")
        return False

def generate_token():
    return secrets.token_urlsafe(32)

def get_user_from_token(token):
    if not token:
        return None
    
    # Sanitize token input
    token = sanitize_string(token)[:64]  # Tokens shouldn't be longer than this
    
    db = get_db()
    # Check for valid session
    try:
        if is_postgres():
            # First, check if session exists at all (debug)
            session_check = db.execute(
                'SELECT token, user_id, expires_at FROM user_sessions WHERE token = %s',
                (token,)
            ).fetchone()
            if session_check:
                # Get current server time for comparison debugging
                server_time = db.execute("SELECT NOW() as now, NOW() AT TIME ZONE 'UTC' as utc_now").fetchone()
                print(f"[Auth Token] Session found: user_id={session_check['user_id']}")
                print(f"[Auth Token] expires_at={session_check['expires_at']}")
                print(f"[Auth Token] server NOW()={server_time['now']}, UTC NOW={server_time['utc_now']}")
                
                # Check if session is expired
                expires_at = session_check['expires_at']
                if expires_at:
                    # Compare in Python to debug
                    from datetime import datetime, timezone
                    utc_now = datetime.now(timezone.utc).replace(tzinfo=None)  # Make naive for comparison
                    if hasattr(expires_at, 'replace'):
                        expires_naive = expires_at.replace(tzinfo=None) if expires_at.tzinfo else expires_at
                    else:
                        expires_naive = expires_at
                    print(f"[Auth Token] Python UTC now (naive): {utc_now}")
                    print(f"[Auth Token] expires_at (naive): {expires_naive}")
                    print(f"[Auth Token] Is expired? {utc_now > expires_naive if expires_naive else 'N/A'}")
            else:
                print(f"[Auth Token] NO session found for token {token[:10]}...")
                # List all sessions for debugging
                all_sessions = db.execute('SELECT token, user_id FROM user_sessions LIMIT 5').fetchall()
                print(f"[Auth Token] All sessions in DB: {[(s['token'][:10] + '...', s['user_id']) for s in all_sessions]}")
            
            # PostgreSQL: Use explicit UTC comparison
            # Store expires_at as naive UTC, compare against current UTC time
            row = db.execute('''
                SELECT u.id, u.username, u.email, u.role, u.created_at, u.phone
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.token = %s AND (s.expires_at IS NULL OR s.expires_at > (NOW() AT TIME ZONE 'UTC'))
            ''', (token,)).fetchone()
            
            if not row and session_check:
                print(f"[Auth Token] Session exists but JOIN query returned NULL - likely timezone/expiry issue")
        else:
            # SQLite: use CURRENT_TIMESTAMP (already UTC)
            row = db.execute('''
                SELECT u.id, u.username, u.email, u.role, u.created_at, u.phone
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
            ''', (token,)).fetchone()
    except Exception as e:
        print(f"[Auth] Error fetching user: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    if row:
        # Check if is_admin column exists by trying to access it
        is_admin = False
        try:
            if is_postgres():
                admin_row = db.execute('SELECT is_admin FROM users WHERE id = %s', (row['id'],)).fetchone()
            else:
                admin_row = db.execute('SELECT is_admin FROM users WHERE id = ?', (row['id'],)).fetchone()
            if admin_row:
                is_admin = bool(admin_row['is_admin']) if admin_row['is_admin'] else False
        except Exception:
            pass  # Column doesn't exist yet, default to False
        
        # Get phone safely
        phone = None
        try:
            phone = row['phone'] if 'phone' in row.keys() else None
        except Exception:
            pass
        
        return {
            'id': row['id'],
            'username': row['username'],
            'email': row['email'],
            'role': row['role'],
            'is_admin': is_admin,
            'phone': phone,
            'created_at': row['created_at']
        }
    return None

@bp.route('/signup', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=60)  # 5 signups per minute per IP
@validate_json_request(required_fields=['username', 'email', 'password'])
def signup():
    data = g.validated_data
    username = sanitize_string(data.get('username', ''))
    email = sanitize_string(data.get('email', '').lower())
    password = data.get('password', '')  # Don't sanitize password - it gets hashed

    # Validate username
    valid, error = validate_username(username)
    if not valid:
        return jsonify({'success': False, 'error': error}), 400
    
    # Validate email
    valid, error = validate_email(email)
    if not valid:
        return jsonify({'success': False, 'error': error}), 400
    
    # Validate password strength
    valid, error = validate_password(password)
    if not valid:
        return jsonify({'success': False, 'error': error}), 400

    db = get_db()
    try:
        # Use werkzeug's secure password hashing (pbkdf2:sha256 by default)
        password_hash = generate_password_hash(password, method='pbkdf2:sha256:260000')
        cursor = db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, password_hash)
        )
        user_id = cursor.lastrowid
        
        # Create session with naive UTC timestamp (for TIMESTAMP column compatibility)
        token = generate_token()
        expires_at_utc = datetime.now(timezone.utc) + timedelta(days=7)
        expires_at = expires_at_utc.replace(tzinfo=None)  # Strip timezone for PostgreSQL TIMESTAMP
        db.execute(
            'INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
            (token, user_id, expires_at)
        )
        db.commit()

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'username': username,
                'email': email,
                'role': 'user',
                'is_admin': False
            }
        }), 201

    except Exception as e:
        error_str = str(e).lower()
        if 'unique' in error_str or 'duplicate' in error_str or 'integrity' in error_str:
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 409
        # Don't expose internal errors to users
        print(f"Signup error: {e}")
        return jsonify({'success': False, 'error': 'Registration failed. Please try again.'}), 500

@bp.route('/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)  # 10 login attempts per minute per IP
@validate_json_request(required_fields=['password'])
def login():
    data = g.validated_data
    # Frontend sends 'username' but user might enter email there too.
    identifier = sanitize_string(data.get('username') or data.get('email') or '')
    password = data.get('password', '')

    if not identifier:
        return jsonify({'success': False, 'error': 'Username or email is required'}), 400

    db = get_db()
    # Check against both username and email (parameterized - safe from SQL injection)
    user = db.execute(
        'SELECT * FROM users WHERE email = ? OR username = ?', 
        (identifier.lower(), identifier)
    ).fetchone()

    # Use constant-time comparison via check_password_hash
    if user and check_password_hash(user['password_hash'], password):
        token = generate_token()
        # Calculate expiry time - store as naive UTC datetime for PostgreSQL compatibility
        expires_at_utc = datetime.now(timezone.utc) + timedelta(days=7)
        # Convert to naive datetime (strip timezone info) since our column is TIMESTAMP not TIMESTAMPTZ
        expires_at = expires_at_utc.replace(tzinfo=None)
        
        # Insert new session (cleanup old sessions later via cron if needed)
        print(f"[Auth Login] Creating session for user_id={user['id']}, token={token[:10]}...")
        print(f"[Auth Login] expires_at (naive UTC): {expires_at}")
        try:
            db.execute(
                'INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
                (token, user['id'], expires_at)
            )
            db.commit()
            print(f"[Auth Login] Session committed, verifying...")
            
            # Immediately verify the session was saved
            verify_row = db.execute(
                'SELECT token, user_id, expires_at FROM user_sessions WHERE token = ?',
                (token,)
            ).fetchone()
            if verify_row:
                print(f"[Auth Login] VERIFIED: Session exists in DB - user_id={verify_row['user_id']}, expires={verify_row['expires_at']}")
            else:
                print(f"[Auth Login] WARNING: Session NOT found after commit!")
                
        except Exception as e:
            print(f"[Auth Login] ERROR creating session: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': 'Failed to create session'}), 500

        # Safely check is_admin column
        is_admin = False
        try:
            is_admin = bool(user['is_admin']) if user['is_admin'] else False
        except (KeyError, TypeError, IndexError):
            pass  # Column doesn't exist

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'is_admin': is_admin
            }
        })
    
    # Generic error to prevent user enumeration
    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@bp.route('/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token:
        token = sanitize_string(token)[:64]
        db = get_db()
        db.execute('DELETE FROM user_sessions WHERE token = ?', (token,))
        db.commit()
    return jsonify({'success': True})

@bp.route('/verify', methods=['GET'])
@rate_limit(max_requests=30, window_seconds=60)
def verify_session():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    print(f"[Auth Verify] Checking token: {token[:10]}..." if token else "[Auth Verify] No token provided")
    user = get_user_from_token(token)
    print(f"[Auth Verify] User lookup result: {user['username'] if user else 'None'}")
    
    if user:
        return jsonify({'success': True, 'authenticated': True, 'user': user})
    return jsonify({'success': False, 'authenticated': False, 'error': 'Invalid or expired token'}), 401


@bp.route('/profile', methods=['PUT', 'PATCH'])
@rate_limit(max_requests=10, window_seconds=60)
def update_profile():
    """Update user profile (username, email, phone, password)."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user = get_user_from_token(token)
    
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    db = get_db()
    updates = []
    params = []
    
    # Update username if provided
    if 'username' in data and data['username']:
        username = sanitize_string(data['username'])
        valid, error = validate_username(username)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        updates.append('username = ?')
        params.append(username)
    
    # Update email if provided
    if 'email' in data and data['email']:
        email = sanitize_string(data['email'].lower())
        valid, error = validate_email(email)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        updates.append('email = ?')
        params.append(email)
    
    # Update phone if provided
    if 'phone' in data:
        phone = sanitize_string(data['phone']) if data['phone'] else None
        updates.append('phone = ?')
        params.append(phone)
    
    # Update password if provided (requires current_password)
    if 'password' in data and data['password']:
        current_password = data.get('current_password', '')
        
        # Verify current password
        if is_postgres():
            row = db.execute('SELECT password_hash FROM users WHERE id = %s', (user['id'],)).fetchone()
        else:
            row = db.execute('SELECT password_hash FROM users WHERE id = ?', (user['id'],)).fetchone()
        
        if not row or not check_password_hash(row['password_hash'], current_password):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 400
        
        valid, error = validate_password(data['password'])
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        
        password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256:260000')
        updates.append('password_hash = ?')
        params.append(password_hash)
    
    if not updates:
        return jsonify({'success': False, 'error': 'No fields to update'}), 400
    
    params.append(user['id'])
    
    try:
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        if is_postgres():
            # Convert ? to %s for PostgreSQL
            query = query.replace('?', '%s')
        db.execute(query, tuple(params))
        db.commit()
        
        # Return updated user
        updated_user = get_user_from_token(token)
        return jsonify({'success': True, 'user': updated_user})
    except Exception as e:
        error_str = str(e).lower()
        if 'unique' in error_str or 'duplicate' in error_str:
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 409
        print(f"Profile update error: {e}")
        return jsonify({'success': False, 'error': 'Update failed'}), 500


# ============================================
# PASSWORD RESET
# ============================================

@bp.route('/forgot-password', methods=['POST'])
@rate_limit(max_requests=3, window_seconds=60)  # 3 requests per minute
def forgot_password():
    """Request a password reset link."""
    data = request.get_json() or {}
    email = sanitize_string(data.get('email', '').lower())
    
    if not email:
        return jsonify({'success': False, 'error': 'Email is required'}), 400
    
    db = get_db()
    user = db.execute('SELECT id, username, email FROM users WHERE email = ?', (email,)).fetchone()
    
    # Always return success to prevent email enumeration
    if not user:
        return jsonify({'success': True, 'message': 'If an account exists with that email, a reset link has been sent.'})
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token (create table if needed)
    try:
        db.execute('''
            INSERT INTO password_resets (token, user_id, expires_at) 
            VALUES (?, ?, ?)
        ''', (reset_token, user['id'], expires_at))
        db.commit()
    except Exception as e:
        print(f"[Password Reset] Error storing token: {e}")
        return jsonify({'success': False, 'error': 'Failed to create reset token'}), 500
    
    # Send reset email
    reset_url = f"{FRONTEND_URL}?reset_token={reset_token}"
    email_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hi {user['username']},</p>
        <p>We received a request to reset your password for your IntelliWheels account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
            </a>
        </p>
        <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">IntelliWheels - Smart Car Shopping</p>
    </body>
    </html>
    """
    
    send_auth_email(user['email'], 'Reset Your IntelliWheels Password', email_body)
    
    return jsonify({
        'success': True, 
        'message': 'If an account exists with that email, a reset link has been sent.'
    })


@bp.route('/reset-password', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=60)
@validate_json_request(required_fields=['token', 'password'])
def reset_password():
    """Reset password using a valid reset token."""
    data = g.validated_data
    reset_token = sanitize_string(data.get('token', ''))
    new_password = data.get('password', '')
    
    # Validate new password
    valid, error = validate_password(new_password)
    if not valid:
        return jsonify({'success': False, 'error': error}), 400
    
    db = get_db()
    
    # Find valid reset token
    try:
        if is_postgres():
            reset_row = db.execute('''
                SELECT user_id FROM password_resets 
                WHERE token = %s AND expires_at > NOW()
            ''', (reset_token,)).fetchone()
        else:
            reset_row = db.execute('''
                SELECT user_id FROM password_resets 
                WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
            ''', (reset_token,)).fetchone()
    except Exception as e:
        print(f"[Password Reset] Query error: {e}")
        return jsonify({'success': False, 'error': 'Invalid or expired reset token'}), 400
    
    if not reset_row:
        return jsonify({'success': False, 'error': 'Invalid or expired reset token'}), 400
    
    user_id = reset_row['user_id']
    
    # Update password
    password_hash = generate_password_hash(new_password, method='pbkdf2:sha256:260000')
    db.execute('UPDATE users SET password_hash = ? WHERE id = ?', (password_hash, user_id))
    
    # Delete all reset tokens for this user
    db.execute('DELETE FROM password_resets WHERE user_id = ?', (user_id,))
    
    # Invalidate all existing sessions (security measure)
    db.execute('DELETE FROM user_sessions WHERE user_id = ?', (user_id,))
    
    db.commit()
    
    return jsonify({'success': True, 'message': 'Password reset successfully. Please log in with your new password.'})


# ============================================
# GOOGLE OAUTH
# ============================================

@bp.route('/google', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def google_auth():
    """Authenticate with Google OAuth. Accepts Google ID token from frontend."""
    if not HAS_GOOGLE_AUTH:
        return jsonify({'success': False, 'error': 'Google authentication not available'}), 501
    
    if not GOOGLE_CLIENT_ID:
        return jsonify({'success': False, 'error': 'Google OAuth not configured'}), 501
    
    data = request.get_json() or {}
    google_token = data.get('credential') or data.get('token')
    
    if not google_token:
        return jsonify({'success': False, 'error': 'Google token is required'}), 400
    
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Token is valid, extract user info
        google_id = idinfo['sub']
        email = idinfo.get('email', '').lower()
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        if not email:
            return jsonify({'success': False, 'error': 'Email not provided by Google'}), 400
        
    except ValueError as e:
        print(f"[Google Auth] Token verification failed: {e}")
        return jsonify({'success': False, 'error': 'Invalid Google token'}), 401
    
    db = get_db()
    
    # Check if user exists with this email
    user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    
    if user:
        # Existing user - update google_id if not set
        if not user.get('google_id'):
            db.execute('UPDATE users SET google_id = ? WHERE id = ?', (google_id, user['id']))
        user_id = user['id']
        username = user['username']
        role = user['role']
    else:
        # New user - create account
        # Generate username from email (before @)
        base_username = email.split('@')[0][:20]
        username = base_username
        
        # Ensure unique username
        counter = 1
        while db.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create user without password (OAuth users don't need one)
        cursor = db.execute('''
            INSERT INTO users (username, email, google_id, password_hash, avatar_url) 
            VALUES (?, ?, ?, ?, ?)
        ''', (username, email, google_id, '', picture))
        user_id = cursor.lastrowid
        role = 'user'
    
    # Create session
    token = generate_token()
    expires_at_utc = datetime.now(timezone.utc) + timedelta(days=7)
    expires_at = expires_at_utc.replace(tzinfo=None)  # Strip timezone for PostgreSQL TIMESTAMP
    db.execute(
        'INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
        (token, user_id, expires_at)
    )
    db.commit()
    
    # Get is_admin status
    is_admin = False
    try:
        if is_postgres():
            admin_row = db.execute('SELECT is_admin FROM users WHERE id = %s', (user_id,)).fetchone()
        else:
            admin_row = db.execute('SELECT is_admin FROM users WHERE id = ?', (user_id,)).fetchone()
        if admin_row:
            is_admin = bool(admin_row['is_admin']) if admin_row['is_admin'] else False
    except Exception:
        pass
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user_id,
            'username': username,
            'email': email,
            'role': role,
            'is_admin': is_admin
        }
    })


@bp.route('/oauth-config', methods=['GET'])
def oauth_config():
    """Return OAuth configuration for frontend."""
    return jsonify({
        'google': {
            'enabled': bool(GOOGLE_CLIENT_ID and HAS_GOOGLE_AUTH),
            'client_id': GOOGLE_CLIENT_ID if GOOGLE_CLIENT_ID else None
        }
    })
