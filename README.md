# IntelliWheels FullStack

**AI-Powered Automotive Marketplace for Jordan & GCC**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green)](https://flask.palletsprojects.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow)](https://python.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

> Transform your car buying experience with AI-powered assistance, vision analysis, and fair price estimation.

**🌐 Domain:** intelliwheels.co  
**👥 Team:** 3 Co-Founders (33.3% equity each)  
**📍 Location:** Amman, Jordan

## 🌟 Features

- 🤖 **AI Chatbot** - 24/7 bilingual assistant (Arabic/English) powered by Google Gemini 2.5
- 📸 **Vision Analysis** - Upload car photos to identify make, model, year & get price estimates
- 💰 **Price Estimator** - ML-based fair market pricing with regional adjustments
- 🔍 **Semantic Search** - Natural language car search ("luxury SUV under 50k")
- ✅ **Verified Dealers** - Trusted dealer network with application/approval workflow
- 🌐 **Bilingual** - Full RTL Arabic support with 200+ translated strings
- 💱 **Multi-Currency** - JOD, USD, EUR, SAR, AED, KWD support
- 💬 **Messaging** - Direct buyer-seller communication
- ❤️ **Favorites** - Save and track listings
- 📊 **Analytics** - Dealer dashboard with performance metrics

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Full Documentation](./docs/FULL_DOCUMENTATION.md) | Complete technical documentation |
| [Step-by-Step Action Plan](./docs/STEP_BY_STEP_ACTION_PLAN.md) | **NEW** - Detailed launch checklist |
| [Future Roadmap](./docs/FUTURE_ROADMAP.md) | Business expansion plan |
| [Visual Diagrams](./docs/VISUAL_DIAGRAMS.md) | Architecture & flow diagrams |
| [Business Plan](./docs/BUSINESS_PLAN.md) | Business strategy & financials |
| [Business Readiness](./docs/BUSINESS_READINESS_CHECKLIST.md) | Launch checklist |
| [Pitch Deck Outline](./docs/PITCH_DECK_OUTLINE.md) | Investor/presentation guide |
| [Terms of Service](./docs/legal/TERMS_OF_SERVICE.md) | User agreement |
| [Privacy Policy](./docs/legal/PRIVACY_POLICY.md) | Data handling policy |
| [Dealer Agreement](./docs/legal/DEALER_AGREEMENT.md) | Dealer partner terms |

## 📁 Project Structure

```
IntelliWheels_FullStack/
├── src/                          # Next.js Frontend
│   ├── app/                      # App Router pages
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── cars/[id]/page.tsx    # Car detail page
│   │   └── dealers/[id]/page.tsx # Dealer detail page
│   ├── components/
│   │   ├── AppView.tsx           # Main app shell (5300+ lines)
│   │   ├── CarDetailView.tsx     # Car detail component
│   │   ├── DealerDetailView.tsx  # Dealer profile component
│   │   └── DealerMap.tsx         # Leaflet maps integration
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication state
│   └── lib/
│       ├── api.ts                # API client (40+ functions)
│       ├── config.ts             # Configuration constants
│       ├── types.ts              # TypeScript interfaces
│       └── vehicleDatabase.ts    # Make/model reference data
├── backend/                      # Flask Python API
│   ├── app/
│   │   ├── __init__.py           # Flask app factory
│   │   ├── db.py                 # Database (SQLite/PostgreSQL)
│   │   ├── security.py           # Auth helpers
│   │   ├── routes/               # API endpoints
│   │   │   ├── ai.py             # AI features
│   │   │   ├── auth.py           # Authentication
│   │   │   ├── cars.py           # Car CRUD
│   │   │   ├── dealers.py        # Dealer management
│   │   │   ├── favorites.py      # User favorites
│   │   │   ├── listings.py       # Listing management
│   │   │   ├── messages.py       # Messaging system
│   │   │   ├── reviews.py        # Review system
│   │   │   └── system.py         # Health checks
│   │   └── services/
│   │       └── ai_service.py     # Gemini AI integration (820+ lines)
│   ├── models/
│   │   └── fair_price_model.joblib # Trained price model
│   └── data/                     # Sample data files
├── docs/                         # Documentation
│   ├── FULL_DOCUMENTATION.md     # Complete technical docs
│   ├── VISUAL_DIAGRAMS.md        # Architecture diagrams
│   ├── BUSINESS_PLAN.md          # Business strategy
│   ├── BUSINESS_READINESS_CHECKLIST.md
│   └── legal/                    # Legal documents
└── public/                       # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 with App Router
- **UI:** React 19.2 with React Compiler
- **Styling:** Tailwind CSS 3.4
- **Language:** TypeScript 5
- **Maps:** Leaflet + React-Leaflet

### Backend
- **Framework:** Flask 3.0
- **AI:** Google Gemini 2.5 Flash
- **ML:** scikit-learn, sentence-transformers
- **Database:** PostgreSQL (prod) / SQLite (dev)
- **Storage:** Cloudinary (images/videos)

### Deployment
- **Frontend:** Vercel (intelli-wheels.vercel.app)
- **Backend:** Render (intelliwheels.onrender.com)
- **Database:** Render PostgreSQL

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

The platform supports these AI capabilities:
- **AI Chatbot:** Natural language Q&A about cars, prices, comparisons
- **Vision Helper:** Upload car photos for automatic make/model/price detection
- **Listing Assistant:** Conversational guided listing creation
- **Semantic Search:** Find cars by describing what you want
- **Price Estimator:** ML-based fair market value calculation

## 🚀 Deployment

### Frontend (Vercel)
- **Root Directory**: Leave empty (default)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Framework Preset**: Next.js

### Backend (Render)
- **Root Directory**: `backend`
- **Build Command**: `bash render-build.sh`
- **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT`
- **Python Version**: 3.11+

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm or yarn

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt

# Create .env file with:
# GEMINI_API_KEY=your_key_here
# FRONTEND_ORIGIN=http://localhost:3000

python run.py
# API runs on http://localhost:5000
```

## 🔐 Environment Variables

### Backend (Render)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (provided by Render) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI features |
| `SECRET_KEY` | Yes | 32+ character secure random string for sessions |
| `BACKEND_URL` | Yes | Full backend URL (e.g., `https://intelliwheels.onrender.com`) |
| `FRONTEND_ORIGIN` | Yes | Frontend URL for CORS (e.g., `https://intelli-wheels.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | Recommended | Cloudinary cloud name for persistent image/video storage |
| `CLOUDINARY_API_KEY` | Recommended | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Recommended | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | Optional | For Google OAuth login |

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

## 📋 API Endpoints

The backend exposes these API routes:

| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/auth/signup`, `/login`, `/logout`, `/me`, `/profile`, `/google` |
| **Cars** | `GET/POST /api/cars`, `GET/PATCH/DELETE /api/cars/:id` |
| **AI** | `POST /api/chatbot`, `/vision-helper`, `/price-estimate`, `GET /api/semantic-search` |
| **Dealers** | `GET /api/dealers`, `/dealers/:id`, `POST /api/dealers/applications` |
| **Favorites** | `GET/POST/DELETE /api/favorites` |
| **Reviews** | `GET/POST /api/reviews/car/:carId` |
| **Messages** | `GET/POST /api/messages`, `GET /api/conversations` |
| **System** | `GET /api/health`, `/stats`, `/swagger.json` |

Full API documentation available at `/api/docs` (Swagger UI).

## ✅ Pre-Launch Checklist

Before going to production, complete these steps:

### Legal & Business
- [ ] Register company (LLC in Jordan)
- [ ] Reserve trade name "IntelliWheels"
- [ ] Open business bank account
- [ ] Customize Terms of Service (template in `docs/legal/`)
- [ ] Customize Privacy Policy (template in `docs/legal/`)
- [ ] Customize Dealer Agreement (template in `docs/legal/`)

### Technical
- [ ] Purchase domain (intelliwheels.co) ✅
- [ ] Configure SSL certificates (auto via Vercel/Render)
- [ ] Enable database backups (Render PostgreSQL)
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Complete security audit
- [ ] Load test for concurrent users

### Operations
- [ ] Set up support email (support@intelliwheels.co)
- [ ] Set up WhatsApp Business
- [ ] Create social media accounts
- [ ] Prepare dealer onboarding materials

See [Business Readiness Checklist](./docs/BUSINESS_READINESS_CHECKLIST.md) for complete details.

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Contact

For inquiries: [Intelliwheels03@gmail.com]

---

**IntelliWheels** - *Jordan's Smartest Car Marketplace*

© 2025-2026 IntelliWheels. All rights reserved.
