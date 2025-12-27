import sqlite3
import os
from flask import g, current_app

def get_db():
    if 'db' not in g:
        db_path = current_app.config['DATABASE']
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db(app):
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Create Users Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create Sessions Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Create Cars Table (Simplified schema based on earlier context)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER,
                make TEXT NOT NULL,
                model TEXT NOT NULL,
                year INTEGER,
                price REAL,
                currency TEXT DEFAULT 'JOD',
                description TEXT,
                specs JSON,
                engines JSON,
                statistics JSON,
                gallery_images JSON,
                media_gallery JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create Dealers Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dealers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT,
                rating REAL DEFAULT 0,
                reviews_count INTEGER DEFAULT 0,
                image_url TEXT,
                contact_email TEXT,
                contact_phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create Favorites Table
        cursor.execute('''
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

def init_app(app):
    app.teardown_appcontext(close_db)
    init_db(app)
