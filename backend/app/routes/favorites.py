from flask import Blueprint, request, jsonify
import os
from ..db import get_db
from .auth import get_user_from_token
from .cars import car_row_to_dict

bp = Blueprint('favorites', __name__, url_prefix='/api/favorites')

def is_postgres():
    """Check if we're using PostgreSQL based on DATABASE_URL."""
    return bool(os.environ.get('DATABASE_URL'))

@bp.route('', methods=['GET'])
def get_favorites():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user = get_user_from_token(token)
    
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    db = get_db()
    cursor = db.execute('''
        SELECT c.* 
        FROM cars c
        JOIN favorites f ON c.id = f.car_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    ''', (user['id'],))
    
    cars = [car_row_to_dict(row) for row in cursor.fetchall()]
    return jsonify({'success': True, 'cars': cars})

@bp.route('', methods=['POST'])
def add_favorite():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user = get_user_from_token(token)
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    data = request.json
    car_id = data.get('car_id')
    
    if not car_id:
        return jsonify({'success': False, 'error': 'car_id required'}), 400

    db = get_db()
    
    # Ensure favorites table exists
    try:
        db.execute('''
            CREATE TABLE IF NOT EXISTS favorites (
                user_id INTEGER NOT NULL,
                car_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, car_id),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE
            )
        ''')
        db.commit()
    except Exception as e:
        print(f"Favorites table creation note: {e}")

    try:
        if is_postgres():
            # PostgreSQL: use ON CONFLICT DO NOTHING
            db.execute(
                'INSERT INTO favorites (user_id, car_id) VALUES (%s, %s) ON CONFLICT (user_id, car_id) DO NOTHING',
                (user['id'], car_id)
            )
        else:
            # SQLite: use INSERT OR IGNORE
            db.execute('INSERT OR IGNORE INTO favorites (user_id, car_id) VALUES (?, ?)', (user['id'], car_id))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:car_id>', methods=['DELETE'])
def remove_favorite(car_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user = get_user_from_token(token)
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    db = get_db()
    db.execute('DELETE FROM favorites WHERE user_id = ? AND car_id = ?', (user['id'], car_id))
    db.commit()
    return jsonify({'success': True})
