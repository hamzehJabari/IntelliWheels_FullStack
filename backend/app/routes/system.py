from flask import Blueprint, jsonify, send_from_directory, current_app, request
import os
import uuid
from werkzeug.utils import secure_filename

bp = Blueprint('system', __name__, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'version': '2.0.0'})

@bp.route('/uploads/images/<path:filename>')
def serve_uploaded_image(filename):
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
    
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'File type not allowed'}), 400
    
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
    
    # Return URL path
    url = f"/api/uploads/images/{safe_filename}"
    
    return jsonify({
        'success': True,
        'url': url,
        'path': url,
        'filename': safe_filename
    })
