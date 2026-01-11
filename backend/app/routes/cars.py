from flask import Blueprint, request, jsonify, current_app
from ..db import get_db
from ..security import sanitize_string, sanitize_search_query, validate_text_field, validate_integer, validate_float
import json
import sqlite3

bp = Blueprint('cars', __name__, url_prefix='/api/cars')

def car_row_to_dict(row):
    """Helper to convert DB row to dictionary with parsed JSON fields."""
    d = dict(row)
    for field in ['specs', 'engines', 'statistics', 'gallery_images', 'media_gallery', 'image_urls', 'source_sheets']:
        if d.get(field):
            try:
                d[field] = json.loads(d[field])
            except:
                d[field] = None
    # Map image_url to image for frontend compatibility
    if d.get('image_url') and not d.get('image'):
        d['image'] = d['image_url']
    return d

@bp.route('', methods=['GET'])
def get_cars():
    db = get_db()
    args = request.args
    
    base_query = "FROM cars WHERE 1=1"
    params = []

    # Sanitize and validate make filter
    make = args.get('make')
    if make and make != 'all':
        make = sanitize_string(make)[:50]  # Limit length
        base_query += " AND make = ?"
        params.append(make)
    
    # Sanitize search query
    search = args.get('search')
    if search:
        search = sanitize_search_query(search)[:100]  # Limit length
        search_pattern = f"%{search}%"
        base_query += " AND (make LIKE ? ESCAPE '\\' OR model LIKE ? ESCAPE '\\')"
        params.extend([search_pattern, search_pattern])

    # Get total count first
    count_cursor = db.execute(f"SELECT COUNT(*) as total {base_query}", params)
    total = count_cursor.fetchone()['total']

    # Validate pagination parameters - default to 1000 (effectively all) if not specified
    try:
        limit = min(int(args.get('limit', 1000)), 1000)  # Max 1000 per request
        offset = max(int(args.get('offset', 0)), 0)
    except ValueError:
        limit = 1000
        offset = 0
    
    query = f"SELECT * {base_query} ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor = db.execute(query, params)
    cars = [car_row_to_dict(row) for row in cursor.fetchall()]
    
    return jsonify({'success': True, 'cars': cars, 'total': total})

@bp.route('/<int:id>', methods=['GET'])
def get_car(id):
    # id is already validated as int by Flask's route converter
    if id < 1:
        return jsonify({'success': False, 'error': 'Invalid car ID'}), 400
        
    db = get_db()
    row = db.execute("SELECT * FROM cars WHERE id = ?", (id,)).fetchone()
    if row:
        return jsonify({'success': True, 'car': car_row_to_dict(row)})
    return jsonify({'success': False, 'error': 'Car not found'}), 404

@bp.route('', methods=['POST'])
def create_car():
    if not request.is_json:
        return jsonify({'success': False, 'error': 'Content-Type must be application/json'}), 400
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON body'}), 400
    
    # Validate and sanitize required fields
    make = sanitize_string(data.get('make', ''))
    model = sanitize_string(data.get('model', ''))
    
    valid, error = validate_text_field(make, 'Make', required=True, max_length=50)
    if not valid:
        return jsonify({'success': False, 'error': error}), 400
    
    valid, error = validate_text_field(model, 'Model', required=True, max_length=100)
    if not valid:
        return jsonify({'success': False, 'error': error}), 400
    
    # Validate optional numeric fields
    year = data.get('year')
    if year is not None:
        valid, error = validate_integer(year, 'Year', min_val=1900, max_val=2100)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        year = int(year)
    
    price = data.get('price')
    if price is not None:
        valid, error = validate_float(price, 'Price', min_val=0, max_val=100000000)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        price = float(price)
    
    # Sanitize text fields
    currency = sanitize_string(data.get('currency', 'JOD'))[:10]
    description = sanitize_string(data.get('description', ''))[:5000]
    
    # Handle specs as JSON
    specs = data.get('specs', {})
    if not isinstance(specs, dict):
        specs = {}
    
    # Handle image fields
    image_url = sanitize_string(data.get('image', ''))[:500]
    video_url = sanitize_string(data.get('videoUrl', ''))[:500]
    
    # Handle gallery images as JSON array
    gallery_images = data.get('galleryImages', [])
    if not isinstance(gallery_images, list):
        gallery_images = []
    gallery_images = [sanitize_string(url)[:500] for url in gallery_images if isinstance(url, str)]
    
    # Handle media gallery as JSON array
    media_gallery = data.get('mediaGallery', [])
    if not isinstance(media_gallery, list):
        media_gallery = []
    
    db = get_db()
    try:
        cursor = db.execute(
            '''INSERT INTO cars (make, model, year, price, currency, description, specs, image_url, video_url, gallery_images, media_gallery)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (make, model, year, price, currency, description, json.dumps(specs), image_url, video_url, json.dumps(gallery_images), json.dumps(media_gallery))
        )
        db.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid}), 201
    except Exception as e:
        print(f"Create car error: {e}")
        return jsonify({'success': False, 'error': 'Failed to create listing'}), 500

