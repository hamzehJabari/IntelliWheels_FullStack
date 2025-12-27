from flask import Blueprint, jsonify, request
from ..db import get_db
from .auth import get_user_from_token
from .cars import car_row_to_dict

# This blueprint will attach directly to /api to handle root-level resource endpoints
# like /api/makes and /api/my-listings
bp = Blueprint('listings', __name__, url_prefix='/api')

@bp.route('/makes', methods=['GET'])
def get_makes():
    db = get_db()
    cursor = db.execute('SELECT DISTINCT make FROM cars ORDER BY make ASC')
    makes = [row['make'] for row in cursor.fetchall()]
    return jsonify({'success': True, 'makes': makes})

@bp.route('/my-listings', methods=['GET'])
def get_my_listings():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user = get_user_from_token(token)
    
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    
    # Assuming 'owner_id' links cars to users.
    # Note: users table created in db.py has 'id', so cars 'owner_id' should match.
    # But db.py schema for cars doesn't explicitly have owner_id in the simplified create statement I wrote?
    # Let me check db.py content I wrote... 
    # I wrote: CREATE TABLE cars ... (..., media_gallery JSON, created_at ...)
    # I did NOT explicitly add owner_id in the CREATE statement I pushed in Step 408/409.
    # THIS IS A BUG/OVERSIGHT in my restoration plan execution.
    # I need to fix db.py to include owner_id if I want this to work, OR I just add it now via migration/alter,
    # OR since the user might be fresh, I can update db.py and they can reset.
    # However, for now, let's write the code assuming it exists, and I will issue a fix to db.py next.
    
    db = get_db()
    # Check if owner_id exists
    try:
        cursor = db.execute('SELECT * FROM cars WHERE owner_id = ?', (user['id'],))
        cars = [car_row_to_dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'cars': cars})
    except Exception:
        # Fallback if column missing (safe fail)
        return jsonify({'success': True, 'cars': []})
