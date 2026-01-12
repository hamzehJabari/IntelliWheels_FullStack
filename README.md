# IntelliWheels FullStack

This repository contains the full stack application for IntelliWheels - an intelligent automotive marketplace.

## Structure

- **/**: The Next.js React application (Root).
- **backend/**: The Flask Python API.

## Customization

### Logo
The website logo is located at `public/intelliwheels_logo_exact_m4.png`. Replace this file to update the logo.

### Background Image
To add a custom background image showing an Arabic car seller handing keys to a customer:
1. Add an image file named `car-handover-bg.jpg` to the `public/` folder
2. Recommended: Use a high-quality image (1920x1080 or higher) showing a car sale/handover scene
3. The image will automatically be applied with a subtle overlay for readability

### Languages
The application supports:
- **English (en)** - Default
- **Arabic (ar)** - Full RTL support with comprehensive translations

Switch languages via the settings menu in the header.

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
