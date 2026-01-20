# IntelliWheels FullStack

**AI-Powered Automotive Marketplace for Jordan & GCC**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green)](https://flask.palletsprojects.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

> Transform your car buying experience with AI-powered assistance, vision analysis, and fair price estimation.

## 🌟 Features

- 🤖 **AI Chatbot** - 24/7 bilingual assistant (Arabic/English)
- 📸 **Vision Analysis** - Identify cars from photos
- 💰 **Price Estimator** - ML-based fair market pricing
- 🔍 **Semantic Search** - Natural language car search
- ✅ **Verified Dealers** - Trusted dealer network
- 🌐 **Bilingual** - Full RTL Arabic support
- 💱 **Multi-Currency** - JOD, USD, EUR support

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Full Documentation](./docs/FULL_DOCUMENTATION.md) | Complete technical documentation |
| [Visual Diagrams](./docs/VISUAL_DIAGRAMS.md) | Architecture & flow diagrams |
| [Business Plan](./docs/BUSINESS_PLAN.md) | Business strategy & financials |
| [Business Readiness](./docs/BUSINESS_READINESS_CHECKLIST.md) | Launch checklist |
| [Terms of Service](./docs/legal/TERMS_OF_SERVICE.md) | User agreement |
| [Privacy Policy](./docs/legal/PRIVACY_POLICY.md) | Data handling policy |
| [Dealer Agreement](./docs/legal/DEALER_AGREEMENT.md) | Dealer partner terms |

## 📁 Structure

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

## Environment Variables

### Backend (Render)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (provided by Render) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI features |
| `BACKEND_URL` | Yes | Full backend URL (e.g., `https://intelliwheels.onrender.com`) |
| `FRONTEND_ORIGIN` | Yes | Frontend URL for CORS (e.g., `https://intelliwheels.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | Recommended | Cloudinary cloud name for persistent image/video storage |
| `CLOUDINARY_API_KEY` | Recommended | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Recommended | Cloudinary API secret |

### Cloudinary Setup (Recommended)
Without Cloudinary, uploaded images/videos are stored locally and **will be lost on every redeploy** (Render uses ephemeral storage).

To enable persistent storage:
1. Create a free Cloudinary account at https://cloudinary.com
2. Go to Dashboard → Settings → Access Keys
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your Render environment variables

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g., `https://intelliwheels.onrender.com/api`) |

## 🚀 Pre-Launch Checklist

Before going to production, complete these steps:

### Legal & Business
- [ ] Register company (LLC in Jordan)
- [ ] Reserve trade name "IntelliWheels"
- [ ] Open business bank account
- [ ] Complete Terms of Service (customize template)
- [ ] Complete Privacy Policy (customize template)
- [ ] Complete Dealer Agreement (customize template)

### Technical
- [ ] Purchase domain (intelliwheels.com or .jo)
- [ ] Configure SSL certificates (auto via Vercel/Render)
- [ ] Enable database backups (Render PostgreSQL)
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Complete security audit
- [ ] Load test for 1000+ concurrent users

### Operations
- [ ] Set up support email (support@intelliwheels.com)
- [ ] Set up WhatsApp Business
- [ ] Create social media accounts
- [ ] Prepare dealer onboarding materials
- [ ] Train support team

See [Business Readiness Checklist](./docs/BUSINESS_READINESS_CHECKLIST.md) for complete details.

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Contact

For inquiries: [your-email@example.com]
