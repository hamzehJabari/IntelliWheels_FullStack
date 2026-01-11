"""
Security utilities for IntelliWheels backend.
Provides input validation, sanitization, and rate limiting.
"""

import re
import html
import time
from functools import wraps
from collections import defaultdict
from flask import request, jsonify, g

# ============================================
# Input Validation
# ============================================

# Allowed characters for different field types
USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{3,30}$')
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
SAFE_TEXT_PATTERN = re.compile(r'^[\w\s.,!?\'"-]+$', re.UNICODE)

# Maximum lengths for text fields
MAX_LENGTHS = {
    'username': 30,
    'email': 100,
    'password': 128,
    'make': 50,
    'model': 100,
    'description': 5000,
    'query': 1000,
    'chat_message': 4000,
}

def validate_username(username: str) -> tuple[bool, str]:
    """Validate username format."""
    if not username:
        return False, "Username is required"
    if len(username) > MAX_LENGTHS['username']:
        return False, f"Username must be at most {MAX_LENGTHS['username']} characters"
    if not USERNAME_PATTERN.match(username):
        return False, "Username can only contain letters, numbers, underscores, and hyphens (3-30 chars)"
    return True, ""

def validate_email(email: str) -> tuple[bool, str]:
    """Validate email format."""
    if not email:
        return False, "Email is required"
    if len(email) > MAX_LENGTHS['email']:
        return False, f"Email must be at most {MAX_LENGTHS['email']} characters"
    if not EMAIL_PATTERN.match(email):
        return False, "Invalid email format"
    return True, ""

def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength."""
    if not password:
        return False, "Password is required"
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if len(password) > MAX_LENGTHS['password']:
        return False, f"Password must be at most {MAX_LENGTHS['password']} characters"
    # Check for at least one number and one letter
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, ""

def validate_text_field(value: str, field_name: str, required: bool = False, max_length: int = None) -> tuple[bool, str]:
    """Validate a generic text field."""
    if not value:
        if required:
            return False, f"{field_name} is required"
        return True, ""
    
    max_len = max_length or MAX_LENGTHS.get(field_name.lower(), 1000)
    if len(value) > max_len:
        return False, f"{field_name} must be at most {max_len} characters"
    
    return True, ""

def validate_integer(value, field_name: str, min_val: int = None, max_val: int = None) -> tuple[bool, str]:
    """Validate an integer field."""
    try:
        num = int(value)
        if min_val is not None and num < min_val:
            return False, f"{field_name} must be at least {min_val}"
        if max_val is not None and num > max_val:
            return False, f"{field_name} must be at most {max_val}"
        return True, ""
    except (TypeError, ValueError):
        return False, f"{field_name} must be a valid integer"

def validate_float(value, field_name: str, min_val: float = None, max_val: float = None) -> tuple[bool, str]:
    """Validate a float field."""
    try:
        num = float(value)
        if min_val is not None and num < min_val:
            return False, f"{field_name} must be at least {min_val}"
        if max_val is not None and num > max_val:
            return False, f"{field_name} must be at most {max_val}"
        return True, ""
    except (TypeError, ValueError):
        return False, f"{field_name} must be a valid number"

# ============================================
# Input Sanitization
# ============================================

def sanitize_string(value: str) -> str:
    """Sanitize a string to prevent XSS and injection attacks."""
    if not value:
        return ""
    # HTML escape to prevent XSS
    sanitized = html.escape(str(value).strip())
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    return sanitized

def sanitize_search_query(query: str) -> str:
    """Sanitize a search query for safe use in LIKE clauses."""
    if not query:
        return ""
    # Escape SQL LIKE special characters
    sanitized = query.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
    # Also HTML escape
    return sanitize_string(sanitized)

# ============================================
# Rate Limiting (Simple In-Memory)
# ============================================

# Store: {ip: [(timestamp, count), ...]}
_rate_limit_store = defaultdict(list)

def rate_limit(max_requests: int = 10, window_seconds: int = 60):
    """
    Decorator to rate limit endpoints.
    
    Args:
        max_requests: Maximum requests allowed in the time window
        window_seconds: Time window in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            if ip:
                ip = ip.split(',')[0].strip()
            
            current_time = time.time()
            window_start = current_time - window_seconds
            
            # Clean old entries and count recent requests
            _rate_limit_store[ip] = [
                t for t in _rate_limit_store[ip] 
                if t > window_start
            ]
            
            if len(_rate_limit_store[ip]) >= max_requests:
                return jsonify({
                    'success': False,
                    'error': 'Too many requests. Please try again later.',
                    'retry_after': window_seconds
                }), 429
            
            _rate_limit_store[ip].append(current_time)
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# ============================================
# Request Validation Decorator
# ============================================

def validate_json_request(required_fields: list = None, optional_fields: list = None):
    """
    Decorator to validate JSON request body.
    
    Args:
        required_fields: List of required field names
        optional_fields: List of optional field names
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'success': False,
                    'error': 'Content-Type must be application/json'
                }), 400
            
            data = request.get_json(silent=True)
            if data is None:
                return jsonify({
                    'success': False,
                    'error': 'Invalid JSON body'
                }), 400
            
            # Check required fields
            if required_fields:
                missing = [f for f in required_fields if f not in data or data[f] is None]
                if missing:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required fields: {", ".join(missing)}'
                    }), 400
            
            # Store validated data in g for route access
            g.validated_data = data
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# ============================================
# Security Headers Middleware
# ============================================

def add_security_headers(response):
    """Add security headers to response."""
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Enable XSS filter
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response
