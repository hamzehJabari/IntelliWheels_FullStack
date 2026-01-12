# IntelliWheels FullStack

This repository contains the full stack application for IntelliWheels - an intelligent automotive marketplace.

## Structure

- **/**: The Next.js React application (Root).
- **backend/**: The Flask Python API.

## Customization

### Logo
The website logo is located at `public/intelliwheels_logo_exact_m4.png`. Replace this file to update the logo.

### Theme & Colors
The application uses an elegant gradient background that adapts to light/dark theme. The gradients are defined in `src/components/AppView.tsx` in the `backgroundImageStyle` constant.

### Languages
The application supports:
- **English (en)** - Default
- **Arabic (ar)** - Full RTL support with comprehensive translations

Switch languages via the settings menu in the header.

### AI Features
The AI features (chatbot, vision helper, listing assistant) require a valid **Gemini API key**:
1. Get a free API key from https://aistudio.google.com/app/apikey
2. Set `GEMINI_API_KEY` in your environment (locally in `backend/.env`, on Render in Environment Variables)

## Deployment

### Frontend (Vercel)
- **Root Directory**: Leave empty (default)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`

### Backend (Render)
- **Root Directory**: `backend`
- **Build Command**: `bash render-build.sh`
- **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT`

## Local Development

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
