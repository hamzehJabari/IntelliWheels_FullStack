#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "[render-build] Upgrading pip"
python -m pip install --upgrade pip

echo "[render-build] Installing backend dependencies"
python -m pip install --no-cache-dir -r requirements.txt

echo "[render-build] Ensuring SQLite database is seeded"
if [ -f "intelliwheels.db" ]; then
  echo "[render-build] Existing database detected; skipping ingestion"
else
  python ingest_excel_to_db.py
fi

if [ "${DISABLE_AI:-false}" = "true" ] || [ "${DISABLE_AI:-false}" = "1" ]; then
  echo "[render-build] Skipping AI model training (DISABLE_AI is set)"
else
  echo "[render-build] Training fair-price model"
  python models/train_price_model.py || echo "⚠️ Price model training failed, continuing..."

  echo "[render-build] Building semantic embeddings"
  python models/build_embeddings.py || echo "⚠️ Embedding build failed, continuing..."
fi

echo "[render-build] Build pipeline completed"
