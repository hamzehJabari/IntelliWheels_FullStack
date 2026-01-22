# IntelliWheels - Copilot Instructions

## Project Overview
IntelliWheels is an AI-powered automotive marketplace for Jordan and the GCC region, featuring:
- Next.js 16 frontend with React 19.2 and TypeScript
- Flask 3.0 Python backend with Google Gemini 2.5 AI
- PostgreSQL database (production) / SQLite (development)
- Cloudinary for image/video storage

**Domain:** intelliwheels.co  
**Team:** 3 Co-Founders (33.3% equity each)  
**Funding Model:** Bootstrap (100% founder-owned)

## Tech Stack
- **Frontend:** Next.js 16, React 19.2, TypeScript 5, Tailwind CSS 3.4, Leaflet Maps
- **Backend:** Flask 3.0, Python 3.11+, Gunicorn, sentence-transformers, scikit-learn
- **Database:** PostgreSQL (Render) / SQLite (local)
- **AI:** Google Gemini 2.5 Flash
- **Deployment:** Vercel (frontend), Render (backend)

## Project Structure
```
/                     # Next.js frontend (root)
├── src/app/          # App Router pages
├── src/components/   # React components (AppView.tsx is main shell)
├── src/lib/          # API client, types, utilities
└── src/context/      # Auth context

/backend/             # Flask Python API
├── app/routes/       # API endpoints (ai, auth, cars, dealers, etc.)
├── app/services/     # AI service (Gemini integration)
├── models/           # ML models and embeddings
└── data/             # Sample data files
```

## Development Commands
```bash
# Frontend
npm install && npm run dev    # Runs on localhost:3000

# Backend
cd backend
pip install -r requirements.txt
python run.py                  # Runs on localhost:5000
```

## Key Files
- `src/components/AppView.tsx` - Main application shell (5300+ lines)
- `backend/app/services/ai_service.py` - AI/ML service (820+ lines)
- `src/lib/api.ts` - API client functions
- `backend/app/routes/` - All API endpoints

## Coding Guidelines
- Use TypeScript for frontend code
- Use Python type hints for backend code
- Follow existing code patterns and naming conventions
- Keep components modular and reusable
- Use Tailwind CSS classes for styling
- Maintain bilingual support (English/Arabic RTL)

## Environment Variables
Backend requires: `GEMINI_API_KEY`, `DATABASE_URL`, `FRONTEND_ORIGIN`, `SECRET_KEY`
Frontend requires: `NEXT_PUBLIC_API_URL`
