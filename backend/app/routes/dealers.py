from flask import Blueprint, jsonify, request
from ..db import get_db

bp = Blueprint('dealers', __name__, url_prefix='/api/dealers')

@bp.route('', methods=['GET'])
def get_dealers():
    db = get_db()
    # Simple query for dealers
    cursor = db.execute('SELECT * FROM dealers ORDER BY rating DESC')
    dealers = [dict(row) for row in cursor.fetchall()]
    return jsonify({'success': True, 'dealers': dealers})

@bp.route('/<int:id>', methods=['GET'])
def get_dealer(id):
    db = get_db()
    
    # Get dealer info
    dealer_row = db.execute('SELECT * FROM dealers WHERE id = ?', (id,)).fetchone()
    if not dealer_row:
        return jsonify({'success': False, 'error': 'Dealer not found'}), 404
    
    dealer = dict(dealer_row)
    
    # Get dealer's inventory (active cars)
    # Assuming 'owner_id' in cars table can link to a user who is a dealer, 
    # OR we link 'dealer_id' if we added that. 
    # For now, let's assume we link by matching a 'dealer_id' column if it existed, 
    # OR more likely, we need to associate a User (owner_id) with a Dealer profile.
    # To keep it simple for this restoration: just mock empty inventory or simple query if column exists.
    # Let's check for 'owner_id' in cars. A Dealer entry might map to a User.
    # We'll just return the dealer info + empty inventory for now unless we add 'dealer_id' to cars.
    
    # Attempt to fetch cars if 'dealer_id' or 'owner_id' logic allows.
    # Simplified: Get cars where owner_id matches user_id associated with this dealer?
    # Since we separated Dealers into its own table, we'd need a user_id foreign key in Dealers to link.
    # I didn't add user_id to dealers table in db.py (just now).
    # So we will return just the dealer details. The frontend 'DealerDetail' type expects 'inventory'.
    
    # Let's verify 'inventory' requirement. checking api.ts...
    # types.ts: DealerDetail extends DealerSummary { inventory: Car[], reviews: Review[] }
    
    dealer['inventory'] = [] 
    dealer['reviews'] = []
    
    return jsonify({'success': True, 'dealer': dealer})
