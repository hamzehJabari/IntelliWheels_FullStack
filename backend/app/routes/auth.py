from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from ..db import get_db
from ..security import (
    validate_username, validate_email, validate_password,
    sanitize_string, rate_limit, validate_json_request
)
import secrets
from datetime import datetime, timedelta

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def generate_token():
    return secrets.token_urlsafe(32)

def get_user_from_token(token):
    if not token:
        return None
    
    # Sanitize token input
    token = sanitize_string(token)[:64]  # Tokens shouldn't be longer than this
    
    db = get_db()
    # Check for valid session using parameterized query (already safe)
    # Use COALESCE to handle missing is_admin column gracefully
    try:
        row = db.execute('''
            SELECT u.id, u.username, u.email, u.role, 
                   COALESCE(u.is_admin, FALSE) as is_admin, u.created_at
            FROM users u
            JOIN user_sessions s ON u.id = s.user_id
            WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
        ''', (token,)).fetchone()
    except Exception:
        # Fallback if is_admin column doesn't exist
        row = db.execute('''
            SELECT u.id, u.username, u.email, u.role, u.created_at
            FROM users u
            JOIN user_sessions s ON u.id = s.user_id
            WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
        ''', (token,)).fetchone()
    
    if row:
        return {
            'id': row['id'],
            'username': row['username'],
            'email': row['email'],
            'role': row['role'],
            'is_admin': bool(row.get('is_admin', False)) if row.get('is_admin') is not None else False,
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
        
        # Create session
        token = generate_token()
        expires_at = datetime.utcnow() + timedelta(days=7)
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
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Clean up old sessions for this user (keep last 5)
        db.execute('''
            DELETE FROM user_sessions 
            WHERE user_id = ? AND token NOT IN (
                SELECT token FROM user_sessions 
                WHERE user_id = ? 
                ORDER BY created_at DESC LIMIT 5
            )
        ''', (user['id'], user['id']))
        
        db.execute(
            'INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
            (token, user['id'], expires_at)
        )
        db.commit()

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'is_admin': bool(user.get('is_admin', False)) if user.get('is_admin') is not None else False
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
    user = get_user_from_token(token)
    
    if user:
        return jsonify({'success': True, 'authenticated': True, 'user': user})
    return jsonify({'success': False, 'authenticated': False, 'error': 'Invalid or expired token'}), 401
