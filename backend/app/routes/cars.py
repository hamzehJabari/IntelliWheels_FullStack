from flask import Blueprint, request, jsonify, current_app
from ..db import get_db
from ..security import sanitize_string, sanitize_search_query, validate_text_field, validate_integer, validate_float, require_auth
import json

bp = Blueprint('cars', __name__, url_prefix='/api/cars')

def car_row_to_dict(row):
    """Helper to convert DB row to dictionary with parsed JSON fields."""
    d = dict(row)
    for field in ['specs', 'engines', 'statistics', 'gallery_images', 'media_gallery', 'image_urls', 'source_sheets']:
        if d.get(field):
            # Handle both string (SQLite) and already-parsed (PostgreSQL JSONB) data
            if isinstance(d[field], str):
                try:
                    d[field] = json.loads(d[field])
                except:
                    d[field] = None
            # If it's already a list/dict (PostgreSQL), keep it as-is
    # Map image_url to image for frontend compatibility
    if d.get('image_url') and not d.get('image'):
        d['image'] = d['image_url']
    # Map gallery_images to galleryImages for frontend compatibility (camelCase)
    if d.get('gallery_images'):
        d['galleryImages'] = d['gallery_images']
    # Map media_gallery to mediaGallery for frontend compatibility
    if d.get('media_gallery'):
        d['mediaGallery'] = d['media_gallery']
    # Map video_url to videoUrl for frontend
    if d.get('video_url'):
        d['videoUrl'] = d['video_url']
    # Map odometer_km to odometerKm for frontend
    if d.get('odometer_km') is not None:
        d['odometerKm'] = d['odometer_km']
    # Map snake_case to camelCase for new fields
    if d.get('exterior_color'):
        d['exteriorColor'] = d['exterior_color']
    if d.get('interior_color'):
        d['interiorColor'] = d['interior_color']
    if d.get('fuel_type'):
        d['fuelType'] = d['fuel_type']
    if d.get('regional_spec'):
        d['regionalSpec'] = d['regional_spec']
    if d.get('payment_type'):
        d['paymentType'] = d['payment_type']
    # Map owner_id to user_id for messaging compatibility
    if d.get('owner_id') is not None:
        d['user_id'] = d['owner_id']
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
    
    # Category filter
    category = args.get('category')
    if category and category != 'all':
        category = sanitize_string(category)[:20]
        base_query += " AND (category = ? OR category IS NULL)"
        params.append(category)
    
    # Condition filter
    condition = args.get('condition')
    if condition and condition != 'all':
        condition = sanitize_string(condition)[:20]
        base_query += " AND condition = ?"
        params.append(condition)
    
    # Transmission filter
    transmission = args.get('transmission')
    if transmission and transmission != 'all':
        transmission = sanitize_string(transmission)[:20]
        base_query += " AND transmission = ?"
        params.append(transmission)
    
    # Fuel type filter
    fuel_type = args.get('fuelType')
    if fuel_type and fuel_type != 'all':
        fuel_type = sanitize_string(fuel_type)[:20]
        base_query += " AND fuel_type = ?"
        params.append(fuel_type)
    
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
    # Get authenticated user (optional - allows anonymous listings too)
    user = require_auth()
    owner_id = user['id'] if user else None
    
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
    
    # Handle odometer
    odometer_km = data.get('odometerKm')
    if odometer_km is not None:
        valid, error = validate_integer(odometer_km, 'Odometer', min_val=0, max_val=10000000)
        if not valid:
            return jsonify({'success': False, 'error': error}), 400
        odometer_km = int(odometer_km)
    
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
    
    # Handle new optional fields
    category = sanitize_string(data.get('category', 'car'))[:20]
    condition = sanitize_string(data.get('condition', 'used'))[:20]
    exterior_color = sanitize_string(data.get('exteriorColor', ''))[:50]
    interior_color = sanitize_string(data.get('interiorColor', ''))[:50]
    transmission = sanitize_string(data.get('transmission', ''))[:20]
    fuel_type = sanitize_string(data.get('fuelType', ''))[:20]
    regional_spec = sanitize_string(data.get('regionalSpec', ''))[:20]
    payment_type = sanitize_string(data.get('paymentType', 'cash'))[:20]
    city = sanitize_string(data.get('city', ''))[:100]
    neighborhood = sanitize_string(data.get('neighborhood', ''))[:100]
    trim = sanitize_string(data.get('trim', ''))[:50]
    
    db = get_db()
    try:
        cursor = db.execute(
            '''INSERT INTO cars (owner_id, make, model, year, price, currency, odometer_km, description, specs, image_url, video_url, gallery_images, media_gallery, category, condition, exterior_color, interior_color, transmission, fuel_type, regional_spec, payment_type, city, neighborhood, trim)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (owner_id, make, model, year, price, currency, odometer_km, description, json.dumps(specs), image_url, video_url, json.dumps(gallery_images), json.dumps(media_gallery), category, condition, exterior_color, interior_color, transmission, fuel_type, regional_spec, payment_type, city, neighborhood, trim)
        )
        db.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid}), 201
    except Exception as e:
        print(f"Create car error: {e}")
        try:
            db.rollback()
        except:
            pass
        return jsonify({'success': False, 'error': 'Failed to create listing'}), 500


@bp.route('/<int:id>', methods=['PATCH', 'PUT'])
def update_car(id):
    """Update a car listing (only by owner)."""
    user = require_auth()
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    
    db = get_db()
    
    # Check if car exists and user owns it
    car = db.execute("SELECT * FROM cars WHERE id = ?", (id,)).fetchone()
    if not car:
        return jsonify({'success': False, 'error': 'Car not found'}), 404
    
    if car['owner_id'] != user['id']:
        return jsonify({'success': False, 'error': 'Not authorized to edit this listing'}), 403
    
    if not request.is_json:
        return jsonify({'success': False, 'error': 'Content-Type must be application/json'}), 400
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON body'}), 400
    
    # Build update query dynamically based on provided fields
    updates = []
    params = []
    
    if 'make' in data:
        make = sanitize_string(data['make'])[:50]
        updates.append("make = ?")
        params.append(make)
    
    if 'model' in data:
        model = sanitize_string(data['model'])[:100]
        updates.append("model = ?")
        params.append(model)
    
    if 'year' in data:
        year = data['year']
        if year is not None:
            valid, error = validate_integer(year, 'Year', min_val=1900, max_val=2100)
            if not valid:
                return jsonify({'success': False, 'error': error}), 400
            year = int(year)
        updates.append("year = ?")
        params.append(year)
    
    if 'price' in data:
        price = data['price']
        if price is not None:
            valid, error = validate_float(price, 'Price', min_val=0, max_val=100000000)
            if not valid:
                return jsonify({'success': False, 'error': error}), 400
            price = float(price)
        updates.append("price = ?")
        params.append(price)
    
    if 'currency' in data:
        currency = sanitize_string(data['currency'])[:10]
        updates.append("currency = ?")
        params.append(currency)
    
    if 'description' in data:
        description = sanitize_string(data['description'])[:5000]
        updates.append("description = ?")
        params.append(description)
    
    if 'specs' in data:
        specs = data['specs'] if isinstance(data['specs'], dict) else {}
        updates.append("specs = ?")
        params.append(json.dumps(specs))
    
    if 'image' in data:
        image_url = sanitize_string(data['image'])[:500]
        updates.append("image_url = ?")
        params.append(image_url)
    
    if 'videoUrl' in data:
        video_url = sanitize_string(data['videoUrl'])[:500]
        updates.append("video_url = ?")
        params.append(video_url)
    
    if 'galleryImages' in data:
        gallery_images = data['galleryImages']
        if not isinstance(gallery_images, list):
            gallery_images = []
        gallery_images = [sanitize_string(url)[:500] for url in gallery_images if isinstance(url, str)]
        updates.append("gallery_images = ?")
        params.append(json.dumps(gallery_images))
    
    if 'mediaGallery' in data:
        media_gallery = data['mediaGallery']
        if not isinstance(media_gallery, list):
            media_gallery = []
        updates.append("media_gallery = ?")
        params.append(json.dumps(media_gallery))
    
    if 'odometerKm' in data:
        odometer_km = data['odometerKm']
        if odometer_km is not None:
            valid, error = validate_integer(odometer_km, 'Odometer', min_val=0, max_val=10000000)
            if not valid:
                return jsonify({'success': False, 'error': error}), 400
            odometer_km = int(odometer_km)
        updates.append("odometer_km = ?")
        params.append(odometer_km)
    
    # Handle new optional fields in update
    new_text_fields = [
        ('category', 'category', 20),
        ('condition', 'condition', 20),
        ('exteriorColor', 'exterior_color', 50),
        ('interiorColor', 'interior_color', 50),
        ('transmission', 'transmission', 20),
        ('fuelType', 'fuel_type', 20),
        ('regionalSpec', 'regional_spec', 20),
        ('paymentType', 'payment_type', 20),
        ('city', 'city', 100),
        ('neighborhood', 'neighborhood', 100),
        ('trim', 'trim', 50),
    ]
    for frontend_key, db_key, max_len in new_text_fields:
        if frontend_key in data:
            value = sanitize_string(data[frontend_key] or '')[:max_len]
            updates.append(f"{db_key} = ?")
            params.append(value if value else None)
    
    if not updates:
        return jsonify({'success': False, 'error': 'No fields to update'}), 400
    
    # Add updated_at timestamp
    updates.append("updated_at = CURRENT_TIMESTAMP")
    
    # Add car ID to params
    params.append(id)
    
    try:
        query = f"UPDATE cars SET {', '.join(updates)} WHERE id = ?"
        db.execute(query, params)
        db.commit()
        
        # Return updated car
        updated_car = db.execute("SELECT * FROM cars WHERE id = ?", (id,)).fetchone()
        return jsonify({'success': True, 'car': car_row_to_dict(updated_car)})
    except Exception as e:
        print(f"Update car error: {e}")
        try:
            db.rollback()
        except:
            pass
        return jsonify({'success': False, 'error': 'Failed to update listing'}), 500


@bp.route('/<int:id>', methods=['DELETE'])
def delete_car(id):
    """Delete a car listing (only by owner)."""
    user = require_auth()
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    
    db = get_db()
    
    # Check if car exists and user owns it
    car = db.execute("SELECT * FROM cars WHERE id = ?", (id,)).fetchone()
    if not car:
        return jsonify({'success': False, 'error': 'Car not found'}), 404
    
    if car['owner_id'] != user['id']:
        return jsonify({'success': False, 'error': 'Not authorized to delete this listing'}), 403
    
    try:
        db.execute("DELETE FROM cars WHERE id = ?", (id,))
        db.commit()
        return jsonify({'success': True, 'message': 'Listing deleted'})
    except Exception as e:
        print(f"Delete car error: {e}")
        try:
            db.rollback()
        except:
            pass
        return jsonify({'success': False, 'error': 'Failed to delete listing'}), 500

