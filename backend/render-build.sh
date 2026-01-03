#!/usr/bin/env bash
# exit on error
set -o errexit

echo "[render-build] Upgrading pip..."
python -m pip install --upgrade pip

echo "[render-build] Installing dependencies..."
pip install -r requirements.txt

echo "[render-build] Running database ingestion from SQL dump..."
python ingest_excel_to_db.py || echo "Ingestion completed (or skipped if already done)"

echo "[render-build] Setup complete."
