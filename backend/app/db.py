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
        
        # Seed sample cars if table is empty
        car_count = cursor.execute('SELECT COUNT(*) FROM cars').fetchone()[0]
        if car_count == 0:
            sample_cars = [
                ('Toyota', 'Camry', 2023, 28000, 'JOD', 'Reliable sedan with excellent fuel economy', '{"horsepower": 203, "engine": "2.5L 4-Cylinder", "transmission": "Automatic", "fuelType": "Gasoline"}'),
                ('BMW', '3 Series', 2022, 45000, 'JOD', 'Luxury sports sedan with premium features', '{"horsepower": 255, "engine": "2.0L Turbo", "transmission": "Automatic", "fuelType": "Gasoline"}'),
                ('Mercedes-Benz', 'C-Class', 2023, 52000, 'JOD', 'Elegant luxury sedan with advanced technology', '{"horsepower": 255, "engine": "2.0L Turbo", "transmission": "9-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Honda', 'Accord', 2023, 26000, 'JOD', 'Spacious and comfortable mid-size sedan', '{"horsepower": 192, "engine": "1.5L Turbo", "transmission": "CVT", "fuelType": "Gasoline"}'),
                ('Lexus', 'ES', 2022, 48000, 'JOD', 'Premium luxury sedan with smooth ride', '{"horsepower": 302, "engine": "3.5L V6", "transmission": "8-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Audi', 'A4', 2023, 47000, 'JOD', 'German engineering with quattro AWD', '{"horsepower": 201, "engine": "2.0L TFSI", "transmission": "7-Speed S tronic", "fuelType": "Gasoline"}'),
                ('Nissan', 'Altima', 2023, 24000, 'JOD', 'Affordable sedan with modern styling', '{"horsepower": 188, "engine": "2.5L 4-Cylinder", "transmission": "CVT", "fuelType": "Gasoline"}'),
                ('Hyundai', 'Sonata', 2023, 23000, 'JOD', 'Feature-packed sedan with great warranty', '{"horsepower": 191, "engine": "2.5L 4-Cylinder", "transmission": "8-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Kia', 'K5', 2023, 25000, 'JOD', 'Stylish design with turbocharged performance', '{"horsepower": 180, "engine": "1.6L Turbo", "transmission": "8-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Mazda', '6', 2022, 27000, 'JOD', 'Sporty handling with upscale interior', '{"horsepower": 187, "engine": "2.5L 4-Cylinder", "transmission": "6-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Toyota', 'Land Cruiser', 2023, 85000, 'JOD', 'Legendary off-road SUV with luxury features', '{"horsepower": 409, "engine": "3.5L Twin-Turbo V6", "transmission": "10-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Range Rover', 'Sport', 2023, 95000, 'JOD', 'Premium luxury SUV with dynamic capability', '{"horsepower": 395, "engine": "3.0L Inline-6", "transmission": "8-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Porsche', 'Cayenne', 2023, 110000, 'JOD', 'Sports car performance in an SUV', '{"horsepower": 348, "engine": "3.0L V6 Turbo", "transmission": "8-Speed Tiptronic", "fuelType": "Gasoline"}'),
                ('BMW', 'X5', 2023, 75000, 'JOD', 'Versatile luxury SUV with powerful engines', '{"horsepower": 335, "engine": "3.0L Turbo I6", "transmission": "8-Speed Automatic", "fuelType": "Gasoline"}'),
                ('Mercedes-Benz', 'GLE', 2023, 78000, 'JOD', 'Spacious luxury SUV with cutting-edge tech', '{"horsepower": 255, "engine": "2.0L Turbo", "transmission": "9-Speed Automatic", "fuelType": "Gasoline"}'),
            ]
            
            cursor.executemany(
                'INSERT INTO cars (make, model, year, price, currency, description, specs) VALUES (?, ?, ?, ?, ?, ?, ?)',
                sample_cars
            )
            
            # Seed sample dealers
            sample_dealers = [
                ('AutoHouse Jordan', 'Amman, Jordan', 4.8, 156, 'contact@autohouse.jo', '+962-6-555-1234'),
                ('Elite Motors', 'Dubai, UAE', 4.9, 243, 'sales@elitemotors.ae', '+971-4-555-5678'),
                ('Premium Auto Gallery', 'Riyadh, Saudi Arabia', 4.7, 198, 'info@premiumauto.sa', '+966-11-555-9012'),
                ('Luxury Wheels', 'Kuwait City, Kuwait', 4.6, 87, 'sales@luxurywheels.kw', '+965-2-555-3456'),
            ]
            
            cursor.executemany(
                'INSERT INTO dealers (name, location, rating, reviews_count, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)',
                sample_dealers
            )
            
            db.commit()
            print("Database seeded with sample data")

def init_app(app):
    app.teardown_appcontext(close_db)
    init_db(app)
