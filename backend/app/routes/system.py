from flask import Blueprint, jsonify, send_from_directory, current_app, request
import os
import uuid
from werkzeug.utils import secure_filename

bp = Blueprint('system', __name__, url_prefix='/api')

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'webm'}

def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_video_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

# Keep backward compatibility
def allowed_file(filename):
    return allowed_image_file(filename)

@bp.route('/health')
def health_check():
    # Check if GEMINI_API_KEY is configured
    gemini_key = os.environ.get('GEMINI_API_KEY', '')
    ai_configured = bool(gemini_key and len(gemini_key) > 10)
    
    # Check which model is actually active
    from ..services.ai_service import ai_service
    active_model = getattr(ai_service, 'active_model_name', None)
    gemini_working = ai_service.gemini_model is not None
    init_error = getattr(ai_service, '_init_error', None)
    
    return jsonify({
        'status': 'healthy',
        'version': '2.0.0',
        'ai_enabled': ai_configured,
        'ai_working': gemini_working,
        'ai_model': active_model,
        'ai_error': init_error if not gemini_working else None,
        'frontend_origin': os.environ.get('FRONTEND_ORIGIN', 'not set')
    })

@bp.route('/uploads/images/<path:filename>')
def serve_uploaded_image(filename):
    upload_dir = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_dir, filename)

@bp.route('/uploads/videos/<path:filename>')
def serve_uploaded_video(filename):
    upload_dir = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_dir, filename)

@bp.route('/uploads/images', methods=['POST', 'OPTIONS'])
def upload_image():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        return response
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if not allowed_image_file(file.filename):
        return jsonify({'success': False, 'error': 'File type not allowed. Allowed: png, jpg, jpeg, gif, webp'}), 400
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    safe_filename = secure_filename(unique_filename)
    
    # Ensure upload directory exists
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    filepath = os.path.join(upload_dir, safe_filename)
    file.save(filepath)
    
    # Return full backend URL (not relative path) so frontend can load images from backend
    # On Render, the backend URL is intelliwheels.onrender.com
    backend_url = os.environ.get('BACKEND_URL', '')
    if backend_url:
        url = f"{backend_url}/api/uploads/images/{safe_filename}"
    else:
        # Fallback to relative path for local development
        url = f"/api/uploads/images/{safe_filename}"
    
    return jsonify({
        'success': True,
        'url': url,
        'path': f"/api/uploads/images/{safe_filename}",
        'filename': safe_filename
    })

@bp.route('/uploads/videos', methods=['POST', 'OPTIONS'])
def upload_video():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        return response
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if not allowed_video_file(file.filename):
        return jsonify({'success': False, 'error': 'File type not allowed. Allowed: mp4, mov, avi, mkv, webm'}), 400
    
    # Check file size (max 100MB for videos)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Seek back to start
    if file_size > 100 * 1024 * 1024:
        return jsonify({'success': False, 'error': 'Video file too large. Maximum size is 100MB'}), 400
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    safe_filename = secure_filename(unique_filename)
    
    # Ensure upload directory exists
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    filepath = os.path.join(upload_dir, safe_filename)
    file.save(filepath)
    
    # Return full backend URL
    backend_url = os.environ.get('BACKEND_URL', '')
    if backend_url:
        url = f"{backend_url}/api/uploads/videos/{safe_filename}"
    else:
        url = f"/api/uploads/videos/{safe_filename}"
    
    return jsonify({
        'success': True,
        'url': url,
        'path': f"/api/uploads/videos/{safe_filename}",
        'filename': safe_filename
    })
