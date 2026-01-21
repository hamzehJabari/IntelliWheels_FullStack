"""Generate semantic embeddings for the IntelliWheels catalog."""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import List

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB = BASE_DIR.parent / "intelliwheels.db"
OUTPUT_PATH = BASE_DIR / "car_embeddings.json"
DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def load_cars(db_path: Path) -> pd.DataFrame:
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")

    with sqlite3.connect(db_path) as conn:
        query = "SELECT id, make, model, year, specs, price, currency, rating FROM cars"
        df = pd.read_sql_query(query, conn)
    return df


def build_document(row: pd.Series) -> str:
    """Build a rich semantic document for embedding that captures car characteristics."""
    parts: List[str] = []
    make = row['make'] or ''
    model = row['model'] or ''
    
    parts.append(f"{make} {model}")
    if row.get("year"):
        parts.append(str(row["year"]))
    
    try:
        specs = json.loads(row["specs"]) if isinstance(row["specs"], str) else (row["specs"] or {})
    except json.JSONDecodeError:
        specs = {}

    # Add specs
    for key in ("bodyStyle", "engine", "fuelEconomy", "class", "origin"):
        value = specs.get(key)
        if value:
            parts.append(f"{key}: {value}")
    
    # Add semantic descriptors based on make/model characteristics
    make_lower = make.lower()
    model_lower = model.lower()
    
    # Economy/eco-friendly brands
    economy_makes = {'toyota', 'honda', 'nissan', 'hyundai', 'kia', 'mazda', 'suzuki', 'mitsubishi', 'subaru'}
    luxury_makes = {'mercedes', 'bmw', 'audi', 'lexus', 'porsche', 'bentley', 'jaguar', 'land rover', 'infiniti'}
    
    # Performance models (not eco-friendly)
    performance_keywords = ['m3', 'm5', 'm4', 'm6', 'amg', 'rs', 'raptor', 'gt', 'sport', 'turbo', 'v8', 'v6']
    is_performance = any(kw in model_lower for kw in performance_keywords)
    
    if make_lower in economy_makes and not is_performance:
        parts.append("economy fuel-efficient affordable reliable practical")
    elif make_lower in luxury_makes or is_performance:
        parts.append("luxury premium performance sporty powerful")
    
    # Parse fuel economy and add descriptors
    fuel_economy = specs.get('fuelEconomy', '')
    if fuel_economy:
        import re
        match = re.search(r'(\d+\.?\d*)', str(fuel_economy))
        if match:
            consumption = float(match.group(1))
            if consumption <= 7:
                parts.append("very fuel efficient eco-friendly economical low consumption green")
            elif consumption <= 9:
                parts.append("fuel efficient good mileage economical")
            elif consumption > 12:
                parts.append("high consumption thirsty")
    
    # Add pros if available (often contains eco-related terms)
    if specs.get('pros'):
        parts.append(f"pros: {specs['pros']}")
    
    if row.get("rating"):
        parts.append(f"rating {row['rating']}")
    if row.get("price"):
        parts.append(f"price {row['price']} {row.get('currency', 'JOD')}")
    
    return " | ".join(parts)


def main(db_path: Path, model_name: str) -> None:
    print(f"📥 Loading cars from {db_path}")
    df = load_cars(db_path)
    if df.empty:
        raise RuntimeError("No cars found to embed.")

    print(f"🧠 Loading embedding model: {model_name}")
    model = SentenceTransformer(model_name)

    docs = [build_document(row) for _, row in df.iterrows()]
    print(f"⚙️ Encoding {len(docs)} documents")
    embeddings = model.encode(docs, normalize_embeddings=True)

    payload = [
        {
            "car_id": int(row["id"]),
            "text": docs[idx],
            "embedding": embeddings[idx].tolist(),
        }
        for idx, (_, row) in enumerate(df.iterrows())
    ]

    OUTPUT_PATH.write_text(json.dumps(payload))
    print(f"✅ Saved embeddings to {OUTPUT_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build semantic embeddings for IntelliWheels cars")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL)
    args = parser.parse_args()
    main(args.db, args.model)
