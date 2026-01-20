"""
User-to-user messaging routes.
"""

from flask import Blueprint, request, jsonify, g
from ..db import get_db, is_postgres
from ..security import token_required, rate_limit, sanitize_string
from datetime import datetime, timezone

bp = Blueprint('messages', __name__, url_prefix='/api/messages')


def ensure_messages_tables():
    """Create messages tables if they don't exist."""
    db = get_db()
    
    try:
        if is_postgres():
            # PostgreSQL - listing_id references cars table (no FK constraint for flexibility)
            db.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    user1_id INTEGER NOT NULL REFERENCES users(id),
                    user2_id INTEGER NOT NULL REFERENCES users(id),
                    listing_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user1_id, user2_id, listing_id)
                )
            ''')
            db.execute('''
                CREATE TABLE IF NOT EXISTS user_messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                    sender_id INTEGER NOT NULL REFERENCES users(id),
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        else:
            # SQLite
            db.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user1_id INTEGER NOT NULL,
                    user2_id INTEGER NOT NULL,
                    listing_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user1_id, user2_id, listing_id),
                    FOREIGN KEY (user1_id) REFERENCES users(id),
                    FOREIGN KEY (user2_id) REFERENCES users(id)
                )
            ''')
            db.execute('''
                CREATE TABLE IF NOT EXISTS user_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    sender_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                    FOREIGN KEY (sender_id) REFERENCES users(id)
                )
            ''')
        db.commit()
    except Exception as e:
        print(f"[Messages] Table creation error (may already exist): {e}")
        # Rollback to clear aborted transaction state in PostgreSQL
        try:
            db.rollback()
        except:
            pass


@bp.route('/conversations', methods=['GET'])
@token_required
@rate_limit(max_requests=30, window_seconds=60)
def get_conversations():
    """Get all conversations for the current user."""
    user = g.current_user
    db = get_db()
    ensure_messages_tables()
    
    try:
        if is_postgres():
            rows = db.execute('''
                SELECT c.id, c.user1_id, c.user2_id, c.listing_id, c.updated_at,
                       CASE WHEN c.user1_id = %s THEN u2.username ELSE u1.username END as other_username,
                       CASE WHEN c.user1_id = %s THEN c.user2_id ELSE c.user1_id END as other_user_id,
                       car.make, car.model, car.year,
                       (SELECT content FROM user_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT COUNT(*) FROM user_messages WHERE conversation_id = c.id AND sender_id != %s AND is_read = FALSE) as unread_count
                FROM conversations c
                JOIN users u1 ON c.user1_id = u1.id
                JOIN users u2 ON c.user2_id = u2.id
                LEFT JOIN cars car ON c.listing_id = car.id
                WHERE c.user1_id = %s OR c.user2_id = %s
                ORDER BY c.updated_at DESC
            ''', (user['id'], user['id'], user['id'], user['id'], user['id'])).fetchall()
        else:
            rows = db.execute('''
                SELECT c.id, c.user1_id, c.user2_id, c.listing_id, c.updated_at,
                       CASE WHEN c.user1_id = ? THEN u2.username ELSE u1.username END as other_username,
                       CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
                       car.make, car.model, car.year,
                       (SELECT content FROM user_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT COUNT(*) FROM user_messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
                FROM conversations c
                JOIN users u1 ON c.user1_id = u1.id
                JOIN users u2 ON c.user2_id = u2.id
                LEFT JOIN cars car ON c.listing_id = car.id
                WHERE c.user1_id = ? OR c.user2_id = ?
                ORDER BY c.updated_at DESC
            ''', (user['id'], user['id'], user['id'], user['id'], user['id'])).fetchall()
        
        conversations = []
        for row in rows:
            conversations.append({
                'id': row['id'],
                'other_user_id': row['other_user_id'],
                'other_username': row['other_username'],
                'listing_id': row['listing_id'],
                'listing_title': f"{row['make']} {row['model']} {row['year']}" if row['make'] else None,
                'last_message': row['last_message'],
                'unread_count': row['unread_count'] or 0,
                'updated_at': row['updated_at']
            })
        
        return jsonify({'success': True, 'conversations': conversations})
    except Exception as e:
        print(f"Error fetching conversations: {e}")
        try:
            db.rollback()
        except:
            pass
        return jsonify({'success': False, 'error': 'Failed to fetch conversations'}), 500


@bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@token_required
@rate_limit(max_requests=60, window_seconds=60)
def get_messages(conversation_id):
    """Get messages for a specific conversation."""
    user = g.current_user
    db = get_db()
    ensure_messages_tables()
    
    try:
        # Verify user is part of conversation
        if is_postgres():
            conv = db.execute('''
                SELECT * FROM conversations WHERE id = %s AND (user1_id = %s OR user2_id = %s)
            ''', (conversation_id, user['id'], user['id'])).fetchone()
        else:
            conv = db.execute('''
                SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)
            ''', (conversation_id, user['id'], user['id'])).fetchone()
        
        if not conv:
            return jsonify({'success': False, 'error': 'Conversation not found'}), 404
        
        # Get messages
        if is_postgres():
            rows = db.execute('''
                SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at, u.username as sender_username
                FROM user_messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = %s
                ORDER BY m.created_at ASC
            ''', (conversation_id,)).fetchall()
            
            # Mark messages as read
            db.execute('''
                UPDATE user_messages SET is_read = TRUE 
                WHERE conversation_id = %s AND sender_id != %s AND is_read = FALSE
            ''', (conversation_id, user['id']))
        else:
            rows = db.execute('''
                SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at, u.username as sender_username
                FROM user_messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at ASC
            ''', (conversation_id,)).fetchall()
            
            # Mark messages as read
            db.execute('''
                UPDATE user_messages SET is_read = 1 
                WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
            ''', (conversation_id, user['id']))
        
        db.commit()
        
        messages = []
        for row in rows:
            messages.append({
                'id': row['id'],
                'sender_id': row['sender_id'],
                'sender_username': row['sender_username'],
                'content': row['content'],
                'is_read': bool(row['is_read']),
                'created_at': row['created_at'],
                'is_mine': row['sender_id'] == user['id']
            })
        
        return jsonify({'success': True, 'messages': messages})
    except Exception as e:
        print(f"Error fetching messages: {e}")
        try:
            db.rollback()
        except:
            pass
        return jsonify({'success': False, 'error': 'Failed to fetch messages'}), 500


@bp.route('/send', methods=['POST'])
@token_required
@rate_limit(max_requests=30, window_seconds=60)
def send_message():
    """Send a message to another user."""
    user = g.current_user
    data = request.get_json() or {}
    db = get_db()
    ensure_messages_tables()
    
    recipient_id = data.get('recipient_id')
    listing_id = data.get('listing_id')  # Optional
    content = sanitize_string(data.get('content', ''))
    
    if not recipient_id or not content:
        return jsonify({'success': False, 'error': 'Recipient and content are required'}), 400
    
    if recipient_id == user['id']:
        return jsonify({'success': False, 'error': 'Cannot message yourself'}), 400
    
    if len(content) > 2000:
        return jsonify({'success': False, 'error': 'Message too long (max 2000 characters)'}), 400
    
    try:
        # Ensure consistent ordering (lower id is always user1)
        user1_id = min(user['id'], recipient_id)
        user2_id = max(user['id'], recipient_id)
        
        # Find or create conversation
        if is_postgres():
            if listing_id:
                conv = db.execute('''
                    SELECT id FROM conversations WHERE user1_id = %s AND user2_id = %s AND listing_id = %s
                ''', (user1_id, user2_id, listing_id)).fetchone()
            else:
                conv = db.execute('''
                    SELECT id FROM conversations WHERE user1_id = %s AND user2_id = %s AND listing_id IS NULL
                ''', (user1_id, user2_id)).fetchone()
            
            if not conv:
                cursor = db.execute('''
                    INSERT INTO conversations (user1_id, user2_id, listing_id) VALUES (%s, %s, %s) RETURNING id
                ''', (user1_id, user2_id, listing_id))
                conv_id = cursor.fetchone()['id']
            else:
                conv_id = conv['id']
            
            # Insert message
            db.execute('''
                INSERT INTO user_messages (conversation_id, sender_id, content) VALUES (%s, %s, %s)
            ''', (conv_id, user['id'], content))
            
            # Update conversation timestamp
            db.execute('''
                UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
            ''', (conv_id,))
        else:
            if listing_id:
                conv = db.execute('''
                    SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ? AND listing_id = ?
                ''', (user1_id, user2_id, listing_id)).fetchone()
            else:
                conv = db.execute('''
                    SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ? AND listing_id IS NULL
                ''', (user1_id, user2_id)).fetchone()
            
            if not conv:
                cursor = db.execute('''
                    INSERT INTO conversations (user1_id, user2_id, listing_id) VALUES (?, ?, ?)
                ''', (user1_id, user2_id, listing_id))
                conv_id = cursor.lastrowid
            else:
                conv_id = conv['id']
            
            # Insert message
            db.execute('''
                INSERT INTO user_messages (conversation_id, sender_id, content) VALUES (?, ?, ?)
            ''', (conv_id, user['id'], content))
            
            # Update conversation timestamp
            db.execute('''
                UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
            ''', (conv_id,))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'conversation_id': conv_id,
            'message': 'Message sent'
        })
    except Exception as e:
        print(f"Error sending message: {e}")
        try:
            db.rollback()
        except:
            pass
        return jsonify({'success': False, 'error': 'Failed to send message'}), 500


@bp.route('/unread-count', methods=['GET'])
@token_required
@rate_limit(max_requests=60, window_seconds=60)
def get_unread_count():
    """Get total unread message count."""
    user = g.current_user
    db = get_db()
    ensure_messages_tables()
    
    try:
        if is_postgres():
            row = db.execute('''
                SELECT COUNT(*) as count FROM user_messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE (c.user1_id = %s OR c.user2_id = %s) AND m.sender_id != %s AND m.is_read = FALSE
            ''', (user['id'], user['id'], user['id'])).fetchone()
        else:
            row = db.execute('''
                SELECT COUNT(*) as count FROM user_messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE (c.user1_id = ? OR c.user2_id = ?) AND m.sender_id != ? AND m.is_read = 0
            ''', (user['id'], user['id'], user['id'])).fetchone()
        
        return jsonify({'success': True, 'unread_count': row['count'] if row else 0})
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return jsonify({'success': True, 'unread_count': 0})
