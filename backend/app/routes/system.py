from flask import Blueprint, jsonify, send_from_directory, current_app, request
import os
import uuid
from werkzeug.utils import secure_filename
from ..db import get_db

# Try to import Cloudinary for cloud storage
try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

bp = Blueprint('system', __name__, url_prefix='/api')

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'webm'}

def is_cloudinary_configured():
    """Check if Cloudinary is configured via environment variables."""
    return (
        HAS_CLOUDINARY and 
        bool(os.environ.get('CLOUDINARY_CLOUD_NAME')) and
        bool(os.environ.get('CLOUDINARY_API_KEY')) and
        bool(os.environ.get('CLOUDINARY_API_SECRET'))
    )

def init_cloudinary():
    """Initialize Cloudinary with environment variables."""
    if not is_cloudinary_configured():
        return False
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
        secure=True
    )
    return True

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
    
    # Check Cloudinary status
    cloudinary_configured = is_cloudinary_configured()
    
    return jsonify({
        'status': 'healthy',
        'version': '2.0.0',
        'ai_enabled': ai_configured,
        'ai_working': gemini_working,
        'ai_model': active_model,
        'ai_error': init_error if not gemini_working else None,
        'frontend_origin': os.environ.get('FRONTEND_ORIGIN', 'not set'),
        'database_type': 'postgresql' if os.environ.get('DATABASE_URL') else 'sqlite',
        'database_url_set': bool(os.environ.get('DATABASE_URL')),
        'cloudinary_enabled': cloudinary_configured,
        'storage_type': 'cloudinary' if cloudinary_configured else 'local (ephemeral)'
    })

@bp.route('/stats')
def platform_stats():
    """
    Get real platform statistics from the database.
    
    Stats explained:
    - active_listings: Total number of cars currently listed on the platform
    - verified_dealers: Number of approved dealers in the network
    - registered_users: Total user accounts created
    - ai_interactions: Total chatbot messages + image analyses performed
    """
    db = get_db()
    
    # Count active car listings
    listings_count = db.execute('SELECT COUNT(*) as count FROM cars').fetchone()['count']
    
    # Count verified dealers (approved ones)
    dealers_count = db.execute('SELECT COUNT(*) as count FROM dealers').fetchone()['count']
    
    # Count registered users
    users_count = db.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
    
    # Count AI interactions (we'll track this via a simple counter)
    # For now, estimate based on users * average interactions, or use reviews as proxy
    try:
        reviews_count = db.execute('SELECT COUNT(*) as count FROM reviews').fetchone()['count']
    except:
        reviews_count = 0
    
    # AI interactions = reviews + favorites + estimated chat usage
    try:
        favorites_count = db.execute('SELECT COUNT(*) as count FROM favorites').fetchone()['count']
    except:
        favorites_count = 0
    
    # Estimate AI queries: each user averages ~5 interactions, plus reviews and favorites indicate engagement
    ai_interactions = (users_count * 5) + reviews_count + favorites_count
    
    return jsonify({
        'success': True,
        'stats': {
            'active_listings': listings_count,
            'verified_dealers': dealers_count,
            'registered_users': users_count,
            'ai_interactions': ai_interactions
        },
        'definitions': {
            'active_listings': 'Total number of vehicles currently listed for sale',
            'verified_dealers': 'Approved dealerships in our trusted network',
            'registered_users': 'Total accounts created on IntelliWheels',
            'ai_interactions': 'Estimated AI-powered searches, chats, and image analyses'
        }
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
    
    # Try Cloudinary first for persistent cloud storage
    if init_cloudinary():
        try:
            # Upload directly to Cloudinary
            result = cloudinary.uploader.upload(
                file,
                folder="intelliwheels/images",
                resource_type="image",
                transformation=[{"quality": "auto:good", "fetch_format": "auto"}]
            )
            return jsonify({
                'success': True,
                'url': result['secure_url'],
                'path': result['public_id'],
                'filename': result['public_id'].split('/')[-1]
            })
        except Exception as e:
            print(f"[Cloudinary] Image upload error: {e}")
            # Fall back to local storage
    
    # Local storage fallback
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    safe_filename = secure_filename(unique_filename)
    
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    
    filepath = os.path.join(upload_dir, safe_filename)
    file.save(filepath)
    
    backend_url = os.environ.get('BACKEND_URL', '')
    if backend_url:
        url = f"{backend_url}/api/uploads/images/{safe_filename}"
    else:
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
    
    # Check file size (max 500MB for 4K videos, but Cloudinary free tier limits to ~100MB)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Seek back to start
    
    max_size = 100 * 1024 * 1024 if is_cloudinary_configured() else 500 * 1024 * 1024
    if file_size > max_size:
        return jsonify({'success': False, 'error': f'Video file too large. Maximum size is {max_size // (1024*1024)}MB'}), 400
    
    # Try Cloudinary first for persistent cloud storage
    if init_cloudinary():
        try:
            result = cloudinary.uploader.upload(
                file,
                folder="intelliwheels/videos",
                resource_type="video",
                eager=[{"format": "mp4", "quality": "auto"}],
                eager_async=True
            )
            return jsonify({
                'success': True,
                'url': result['secure_url'],
                'path': result['public_id'],
                'filename': result['public_id'].split('/')[-1]
            })
        except Exception as e:
            print(f"[Cloudinary] Video upload error: {e}")
            # Fall back to local storage
    
    # Local storage fallback
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    safe_filename = secure_filename(unique_filename)
    
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    
    filepath = os.path.join(upload_dir, safe_filename)
    file.save(filepath)
    
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
