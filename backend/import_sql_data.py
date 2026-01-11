"""Direct SQL import script - imports from the MySQL dump and creates SQLite database with JOD prices."""
import sqlite3
import re
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "intelliwheels.db"
SQL_DUMP_PATH = BASE_DIR / "data" / "Middle-East-GCC-Car-Database-by-Teoalida-SAMPLE.sql"

# AED to JOD conversion rate (1 AED ≈ 0.19 JOD)
AED_TO_JOD = 0.19

def parse_price_aed(price_str: str) -> float | None:
    """Extract average price from AED price string like 'AED 175,000 - 185,000 (320I M Sport)'"""
    if not price_str or 'AED' not in price_str:
        return None
    
    # Find all AED prices
    matches = re.findall(r'AED\s*([\d,]+)', price_str)
    if not matches:
        return None
    
    prices = [int(m.replace(',', '')) for m in matches]
    if not prices:
        return None
    
    # Return average of all prices found
    return sum(prices) / len(prices)

def extract_star_rating(value: str) -> float | None:
    """Extract star rating from URL like 'star4.jpg' or 'star45.jpg'"""
    if not value:
        return None
    match = re.search(r'star(\d+)', value)
    if match:
        rating = int(match.group(1))
        # star45 = 4.5, star4 = 4.0
        if rating >= 10:
            return rating / 10
        return float(rating)
    return None

def init_db():
    """Initialize SQLite database with proper schema."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop existing tables
    cursor.execute("DROP TABLE IF EXISTS cars")
    cursor.execute("DROP TABLE IF EXISTS users")
    cursor.execute("DROP TABLE IF EXISTS favorites")
    cursor.execute("DROP TABLE IF EXISTS reviews")
    cursor.execute("DROP TABLE IF EXISTS dealers")
    
    # Create cars table
    cursor.execute("""
        CREATE TABLE cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            price REAL,
            currency TEXT DEFAULT 'JOD',
            image_url TEXT,
            image_urls TEXT,
            gallery_images TEXT,
            media_gallery TEXT,
            video_url TEXT,
            rating REAL DEFAULT 0.0,
            reviews INTEGER DEFAULT 0,
            description TEXT,
            specs TEXT,
            engines TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create users table
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create favorites table
    cursor.execute("""
        CREATE TABLE favorites (
            user_id INTEGER NOT NULL,
            car_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, car_id)
        )
    """)
    
    # Create reviews table
    cursor.execute("""
        CREATE TABLE reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            car_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create dealers table
    cursor.execute("""
        CREATE TABLE dealers (
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
    """)
    
    conn.commit()
    return conn

def parse_sql_dump():
    """Parse the SQL dump file and extract car data."""
    with open(SQL_DUMP_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    cars = []
    seen = set()  # Track unique make/model/year combinations
    
    # Find all rows that look like car data - they have Make in position 2
    # Pattern: ('url', 'Make', 'Model', 'Year', ...)
    row_pattern = re.compile(
        r"\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'(\d{4})',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)"
    )
    
    for match in row_pattern.finditer(content):
        groups = match.groups()
        
        url = groups[0]
        make = groups[1]
        model = groups[2]
        year = groups[3]
        image1 = groups[4]
        image2 = groups[5]
        price_uae = groups[6]
        price_ksa = groups[7]
        origin = groups[8]
        car_class = groups[9]
        body = groups[10]
        weight = groups[11]
        good = groups[12]
        bad = groups[13]
        overview = groups[14]
        reliability = groups[15]
        resale = groups[16]
        known_problems = groups[17]
        
        # Skip rows without make/model
        if not make or not model:
            continue
        
        # Create unique key
        key = f"{make}|{model}|{year}"
        if key in seen:
            continue
        seen.add(key)
        
        # Parse price (AED to JOD)
        price_aed = parse_price_aed(price_uae)
        price_jod = round(price_aed * AED_TO_JOD, 2) if price_aed else None
        
        # Calculate rating
        rating1 = extract_star_rating(reliability)
        rating2 = extract_star_rating(resale)
        ratings = [r for r in [rating1, rating2] if r]
        rating = round(sum(ratings) / len(ratings), 1) if ratings else 4.0
        
        # Build specs JSON
        specs = {
            'overview': overview[:500] if overview else f"{make} {model} {year}",
            'origin': origin,
            'class': car_class,
            'bodyStyle': body,
            'weight': weight,
            'pros': good,
            'cons': bad,
        }
        
        # Build gallery
        gallery = [img for img in [image1, image2] if img and img.startswith('http')]
        
        cars.append({
            'make': make,
            'model': model,
            'year': int(year),
            'price': price_jod,
            'currency': 'JOD',
            'image_url': image1 if image1.startswith('http') else None,
            'gallery_images': json.dumps(gallery) if gallery else None,
            'rating': rating,
            'description': overview[:500] if overview else None,
            'specs': json.dumps(specs)
        })
    
    return cars

def main():
    print("🚗 IntelliWheels SQL Import")
    print(f"📂 Reading: {SQL_DUMP_PATH}")
    
    cars = parse_sql_dump()
    print(f"📥 Found {len(cars)} unique cars")
    
    conn = init_db()
    cursor = conn.cursor()
    
    for car in cars:
        cursor.execute("""
            INSERT INTO cars (make, model, year, price, currency, image_url, gallery_images, rating, description, specs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            car['make'],
            car['model'],
            car['year'],
            car['price'],
            car['currency'],
            car['image_url'],
            car['gallery_images'],
            car['rating'],
            car['description'],
            car['specs']
        ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Inserted {len(cars)} cars into {DB_PATH}")
    
    # Verify
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT make, model, year, price, currency FROM cars LIMIT 5")
    print("\n📋 Sample data:")
    for row in cursor.fetchall():
        print(f"   {row[0]} {row[1]} ({row[2]}) - {row[3]:,.2f} {row[4]}" if row[3] else f"   {row[0]} {row[1]} ({row[2]}) - No price")
    conn.close()

if __name__ == "__main__":
    main()
