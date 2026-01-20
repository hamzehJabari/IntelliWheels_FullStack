from flask import Blueprint, request, jsonify
from ..db import get_db
from ..security import sanitize_string, validate_text_field, require_auth
import json

bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')


@bp.route('/car/<int:car_id>', methods=['GET'])
def get_car_reviews(car_id):
    """Get all reviews for a specific car."""
    if car_id < 1:
        return jsonify({'success': False, 'error': 'Invalid car ID'}), 400
    
    db = get_db()
    
    # Ensure reviews table exists
    try:
        db.execute('''
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                car_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(car_id, user_id)
            )
        ''')
        db.commit()
    except Exception as e:
        print(f"Reviews table creation note: {e}")
        try:
            db.rollback()
        except:
            pass
    
    try:
        # Get reviews with user info - use LEFT JOIN to handle missing users gracefully
        print(f"[Reviews] Fetching reviews for car_id: {car_id}")
        cursor = db.execute('''
            SELECT r.id, r.car_id, r.user_id, r.rating, r.comment, r.created_at, r.updated_at,
                   COALESCE(u.username, 'Anonymous') as user_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.car_id = ?
            ORDER BY r.created_at DESC
        ''', (car_id,))
        
        reviews = []
        for row in cursor.fetchall():
            review_data = {
                'id': row['id'],
                'car_id': row['car_id'],
                'user_id': row['user_id'],
                'user_name': row['user_name'],
                'rating': row['rating'],
                'comment': row['comment'],
                'created_at': str(row['created_at']) if row['created_at'] else None,
                'updated_at': str(row['updated_at']) if row['updated_at'] else None
            }
            print(f"[Reviews] Found review: {review_data}")
            reviews.append(review_data)
        
        # Calculate average rating
        avg_cursor = db.execute('''
            SELECT AVG(rating) as avg_rating, COUNT(*) as count
            FROM reviews WHERE car_id = ?
        ''', (car_id,))
        stats = avg_cursor.fetchone()
        
        result = {
            'success': True,
            'reviews': reviews,
            'stats': {
                'average_rating': round(float(stats['avg_rating']), 1) if stats['avg_rating'] else 0,
                'total_reviews': int(stats['count']) if stats['count'] else 0
            }
        }
        print(f"[Reviews] Returning: {result}")
        return jsonify(result)
    except Exception as e:
        print(f"Get reviews error: {e}")
        # Return empty reviews rather than 500 error
        return jsonify({
            'success': True,
            'reviews': [],
            'stats': {
                'average_rating': 0,
                'total_reviews': 0
            }
        })


@bp.route('/car/<int:car_id>', methods=['POST'])
def add_review(car_id):
    """Add a review for a car (authenticated users only)."""
    user = require_auth()
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    
    if car_id < 1:
        return jsonify({'success': False, 'error': 'Invalid car ID'}), 400
    
    if not request.is_json:
        return jsonify({'success': False, 'error': 'Content-Type must be application/json'}), 400
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON body'}), 400
    
    # Validate rating
    rating = data.get('rating')
    if rating is None or not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
        return jsonify({'success': False, 'error': 'Rating must be between 1 and 5'}), 400
    rating = int(rating)
    
    # Sanitize comment
    comment = sanitize_string(data.get('comment', ''))[:1000]
    
    db = get_db()
    
    # Ensure reviews table exists with proper schema
    try:
        # First try to add the unique index if it doesn't exist
        db.execute('''
            CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_car_user 
            ON reviews(car_id, user_id)
        ''')
        db.commit()
    except Exception as idx_err:
        # Index might already exist or table structure differs
        print(f"Reviews index note: {idx_err}")
        try:
            db.rollback()
        except:
            pass
    
    # Check if car exists
    car = db.execute('SELECT id FROM cars WHERE id = ?', (car_id,)).fetchone()
    if not car:
        return jsonify({'success': False, 'error': 'Car not found'}), 404
    
    try:
        # Check if user already has a review for this car
        existing = db.execute(
            'SELECT id FROM reviews WHERE car_id = ? AND user_id = ?',
            (car_id, user['id'])
        ).fetchone()
        
        if existing:
            # Update existing review
            db.execute('''
                UPDATE reviews 
                SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (rating, comment, existing['id']))
            db.commit()
            update_car_rating(db, car_id)
            return jsonify({
                'success': True,
                'message': 'Review updated successfully',
                'review_id': existing['id']
            }), 200
        else:
            # Insert new review
            cursor = db.execute('''
                INSERT INTO reviews (car_id, user_id, rating, comment)
                VALUES (?, ?, ?, ?)
            ''', (car_id, user['id'], rating, comment))
            db.commit()
            update_car_rating(db, car_id)
            return jsonify({
                'success': True,
                'message': 'Review submitted successfully',
                'review_id': cursor.lastrowid
            }), 201
    except Exception as e:
        import traceback
        print(f"Add review error: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to submit review: {str(e)[:100]}'}), 500


@bp.route('/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    """Delete a review (only by the review author)."""
    user = require_auth()
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    
    if review_id < 1:
        return jsonify({'success': False, 'error': 'Invalid review ID'}), 400
    
    db = get_db()
    
    # Get review and check ownership
    review = db.execute('SELECT * FROM reviews WHERE id = ?', (review_id,)).fetchone()
    if not review:
        return jsonify({'success': False, 'error': 'Review not found'}), 404
    
    if review['user_id'] != user['id']:
        return jsonify({'success': False, 'error': 'Not authorized to delete this review'}), 403
    
    car_id = review['car_id']
    
    try:
        db.execute('DELETE FROM reviews WHERE id = ?', (review_id,))
        db.commit()
        
        # Update car's average rating
        update_car_rating(db, car_id)
        
        return jsonify({'success': True, 'message': 'Review deleted'})
    except Exception as e:
        print(f"Delete review error: {e}")
        return jsonify({'success': False, 'error': 'Failed to delete review'}), 500


@bp.route('/user/me', methods=['GET'])
def get_my_reviews():
    """Get all reviews by the current user."""
    user = require_auth()
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    
    db = get_db()
    cursor = db.execute('''
        SELECT r.id, r.car_id, r.rating, r.comment, r.created_at,
               c.make, c.model, c.year, c.image_url
        FROM reviews r
        JOIN cars c ON r.car_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    ''', (user['id'],))
    
    reviews = []
    for row in cursor.fetchall():
        reviews.append({
            'id': row['id'],
            'car_id': row['car_id'],
            'rating': row['rating'],
            'comment': row['comment'],
            'created_at': row['created_at'],
            'car': {
                'make': row['make'],
                'model': row['model'],
                'year': row['year'],
                'image': row['image_url']
            }
        })
    
    return jsonify({'success': True, 'reviews': reviews})


def update_car_rating(db, car_id):
    """Update the car's rating and review count based on all reviews."""
    cursor = db.execute('''
        SELECT AVG(rating) as avg_rating, COUNT(*) as count
        FROM reviews WHERE car_id = ?
    ''', (car_id,))
    stats = cursor.fetchone()
    
    avg_rating = round(stats['avg_rating'], 1) if stats['avg_rating'] else None
    review_count = stats['count']
    
    db.execute('''
        UPDATE cars SET rating = ?, reviews = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (avg_rating, review_count, car_id))
    db.commit()
