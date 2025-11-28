## IntelliWheels Monorepo

This folder now contains everything needed to run the IntelliWheels experience locally:

- **Frontend**: Next.js 16 / React 19 app (this folder root)
- **Backend**: Flask API duplicated into `backend/`
- **Shared assets**: DriveArabia SQL dump (`backend/data/Middle-East-GCC-Car-Database-by-Teoalida-SAMPLE.sql`), generated mock dataset (`src/data/cars.json`), models, uploads, etc.

Follow the steps below to boot both tiers.

---

## 1. Frontend (Next.js)

```bash
npm install
npm run dev
```

App runs on [http://localhost:3000](http://localhost:3000). Environment values live in `.env.local` (already created). Key variables:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_GEMINI_API_KEY=your-real-key
```

### DX helpers

- `npm run lint` – ESLint/TypeScript diagnostics
- `node scripts/convert-cars.mjs` – regenerate `src/data/cars.json` from `cars.xlsx` (used when backend is offline)

---

## 2. Backend (Flask) – `backend/`

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# optional: install frontend deps if you need the legacy static files
# npm install

# load DriveArabia SQL dump into SQLite
python ingest_excel_to_db.py

# start the API
python app.py
```

The API listens on `http://localhost:5000` (matching the frontend base URL). Auth, favorites, analytics, uploads, and Gemini helpers all route through these endpoints. If you want the root `http://localhost:5000/` page to link back to the UI, set `FRONTEND_ORIGIN=http://localhost:3000` before launching `app.py`.

> **Tip:** rerun `python ingest_excel_to_db.py` whenever the SQL dump is updated so the API and embeddings remain in sync.

---

## 3. Data workflow

- Source of truth: `backend/data/Middle-East-GCC-Car-Database-by-Teoalida-SAMPLE.sql` (Engine Specs dataset).
- Offline/demo mode: run `node scripts/convert-cars.mjs` to bake the sheet into `src/data/cars.json`. The React app automatically falls back to those records whenever the backend is down or you are not authenticated.
- Online mode: start the Flask API + database after running the SQL ingestion script; the React app will load live data (and still fall back if the server is unreachable).

---

## 4. Folder map

| Path | Description |
| --- | --- |
| `/src` | Next.js app router code, contexts, components, lib helpers |
| `/backend` | Full Flask backend (API, ingestion scripts, models, uploads) |
| `/scripts/convert-cars.mjs` | XLSX → JSON converter for mock data |
| `/cars.xlsx` | Legacy spreadsheet used by the mock-data converter |
| `/backend/data/...sql` | DriveArabia sample dump used for ingestion |

Uploads, embeddings, and trained models from the original project were copied intact so features like image analysis and price guidance continue to work once the backend is running.

---

## 5. Running everything together

1. Start the backend (instructions above). Confirm you see `* Running on http://127.0.0.1:5000/` in the console.
2. In a new terminal, start the frontend with `npm run dev`.
3. Visit [http://localhost:3000](http://localhost:3000), sign up/log in, and you’ll see real inventory, favorites, and AI helpers. If the backend stops, the UI falls back to the generated dataset so you can still demo the experience.

That’s it—you now have a self-contained workspace with both tiers plus data artifacts.
