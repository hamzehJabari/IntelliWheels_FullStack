# IntelliWheels - Complete Project Explanation

A comprehensive guide for your graduation presentation. Read this to understand everything.

---

## Table of Contents

1. [What is IntelliWheels?](#1-what-is-intelliwheels)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Backend Deep Dive](#4-backend-deep-dive)
5. [Frontend Deep Dive](#5-frontend-deep-dive)
6. [AI Features](#6-ai-features)
7. [Database Design](#7-database-design)
8. [Security](#8-security)
9. [Deployment](#9-deployment)
10. [Common Committee Questions](#10-common-committee-questions)

---

## 1. What is IntelliWheels?

**IntelliWheels** is an AI-powered automotive marketplace for Jordan and the GCC region.

### Core Features

| Feature | Description |
|---------|-------------|
| **Car Listings** | Users can list cars for sale with images, videos, specs |
| **AI Chatbot** | Natural language car assistant powered by Google Gemini |
| **Vision AI** | Upload a car photo → AI identifies make/model/price |
| **Price Estimation** | Get fair market value based on car details |
| **Semantic Search** | "Find me a luxury SUV under 30k" works |
| **Dealer Network** | Dealers can apply, get approved, list inventory |
| **Messaging** | Buyer-seller direct communication |
| **Bilingual** | Full Arabic/English support with RTL |

### Business Model

- **Target Market:** Jordan, GCC (UAE, Saudi, Qatar, Kuwait, Bahrain, Oman)
- **Revenue:** Future plans for dealer subscriptions, featured listings
- **Ownership:** 3 co-founders, 33.3% each
- **Domain:** intelliwheels.co

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend Hosting)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js 16 App                         │  │
│  │  • React 19.2 Components                                  │  │
│  │  • TypeScript                                             │  │
│  │  • Tailwind CSS                                           │  │
│  │  • AuthContext (manages login state)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RENDER (Backend Hosting)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Flask 3.0 API                          │  │
│  │  • REST Endpoints (/api/*)                                │  │
│  │  • JWT Token Authentication                               │  │
│  │  • AI Service (Gemini Integration)                        │  │
│  │  • Security (validation, sanitization, rate limiting)     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │PostgreSQL│   │ Gemini   │   │  Cloudinary  │
        │ Database │   │   AI     │   │   (Images)   │
        └──────────┘   └──────────┘   └──────────────┘
```

### Data Flow Example: User Searches for "Toyota under 15000"

1. User types in search box
2. Frontend calls `GET /api/semantic-search?q=toyota+under+15000`
3. Backend `ai_service.semantic_search()` parses query
4. Extracts: keyword="toyota", max_price=15000
5. Scores all cars in database by relevance
6. Returns top matches sorted by score
7. Frontend displays results

---

## 3. Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | React framework with App Router |
| **React** | 19.2 | UI components |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 3.4 | Styling |
| **Leaflet** | - | Interactive maps for dealers |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 3.0 | Python web framework |
| **Gunicorn** | - | Production WSGI server |
| **SQLite** | - | Local development database |
| **PostgreSQL** | - | Production database (Render) |
| **google-generativeai** | - | Gemini AI SDK |

### External Services

| Service | Purpose |
|---------|---------|
| **Google Gemini 2.5 Flash** | AI chatbot, vision, text generation |
| **Cloudinary** | Image/video CDN and storage |
| **Vercel** | Frontend hosting |
| **Render** | Backend + database hosting |

---

## 4. Backend Deep Dive

### File Structure

```
backend/
├── run.py              # Entry point (starts Flask app)
├── app/
│   ├── __init__.py     # App factory, CORS, blueprints
│   ├── db.py           # Database connections (SQLite + PostgreSQL)
│   ├── security.py     # Validation, sanitization, rate limiting
│   ├── routes/         # API endpoints
│   │   ├── ai.py       # /chatbot, /price-estimate, /vision-helper
│   │   ├── auth.py     # /signup, /login, /logout, Google OAuth
│   │   ├── cars.py     # CRUD for car listings
│   │   ├── dealers.py  # Dealer directory + applications
│   │   ├── favorites.py# User wishlists
│   │   ├── listings.py # My listings management
│   │   ├── messages.py # User-to-user messaging
│   │   ├── reviews.py  # Car reviews and ratings
│   │   └── system.py   # /health, /makes, /models
│   └── services/
│       └── ai_service.py # All AI logic (Gemini, pricing, search)
├── models/
│   ├── fair_price_model.joblib  # ML model (NOT used yet)
│   └── train_price_model.py     # Training script
└── data/
    └── cars.json        # Sample car data
```

### Key Files Explained

#### `app/__init__.py` - App Factory

Creates the Flask app:
- Loads environment variables
- Sets up CORS (Cross-Origin Resource Sharing)
- Registers all route blueprints
- Configures security headers

```python
def create_app():
    app = Flask(__name__)
    CORS(app)  # Allow frontend to call backend
    init_db(app)  # Setup database
    
    # Register all routes
    app.register_blueprint(cars.bp)
    app.register_blueprint(ai.bp)
    # ...
```

#### `app/db.py` - Database Layer

**Dual-database support** - same code works with SQLite (local) and PostgreSQL (production):

```python
def is_postgres():
    return bool(os.environ.get('DATABASE_URL'))

# Wrapper classes make PostgreSQL work like SQLite
class PostgresCursorWrapper:
    def execute(self, sql, params):
        # Converts ? to %s automatically
        sql = sql.replace('?', '%s')
```

#### `app/security.py` - Security Utilities

| Function | Purpose |
|----------|---------|
| `validate_username()` | Check 3-30 chars, alphanumeric |
| `validate_email()` | Regex email validation |
| `validate_password()` | Min 8 chars, letter + number |
| `sanitize_string()` | Remove dangerous characters |
| `rate_limit()` | Prevent API abuse (X requests per minute) |
| `require_auth()` | Decorator to protect endpoints |

### API Endpoints Summary

#### Authentication (`/api/auth/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/signup` | POST | Create new account |
| `/login` | POST | Get auth token |
| `/logout` | POST | Invalidate token |
| `/verify` | GET | Check token validity |
| `/google` | POST | Google OAuth login |
| `/forgot-password` | POST | Request password reset |
| `/reset-password` | POST | Set new password |

#### Cars (`/api/cars/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cars` | GET | List all cars (with filters) |
| `/cars/:id` | GET | Get single car details |
| `/cars` | POST | Create listing (auth required) |
| `/cars/:id` | PATCH | Update listing (owner only) |
| `/cars/:id` | DELETE | Delete listing (owner only) |

#### AI (`/api/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chatbot` | POST | Chat with AI assistant |
| `/price-estimate` | POST | Get price estimate |
| `/vision-helper` | POST | Analyze car image |
| `/semantic-search` | GET | Natural language search |
| `/listing-assistant` | POST | Help create listing |

---

## 5. Frontend Deep Dive

### File Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with AuthProvider
│   ├── page.tsx        # Home page
│   ├── globals.css     # Global styles
│   └── cars/[id]/      # Dynamic car detail page
├── components/
│   ├── AppView.tsx     # MAIN COMPONENT (5300+ lines!)
│   ├── CarDetailView.tsx
│   ├── DealerDetailView.tsx
│   └── DealerMap.tsx
├── context/
│   └── AuthContext.tsx # Authentication state management
└── lib/
    ├── api.ts          # All API call functions
    ├── config.ts       # Environment config, currency rates
    ├── types.ts        # TypeScript interfaces
    └── mockData.ts     # (Unused) test data
```

### Key Files Explained

#### `AppView.tsx` - The Main Component

This is the **heart of the frontend** (5300+ lines). It contains:

- **Navigation** - Top bar, mobile menu
- **All Pages** - Home, Listings, Favorites, Profile, etc.
- **State Management** - Cars, filters, chat sessions
- **Bilingual Text** - English and Arabic translations

```typescript
// Page navigation
type PageKey = 'home' | 'listings' | 'favorites' | 'chatbot' | 'profile' | ...

// Translations object
const translations = {
  en: {
    navHome: 'Home',
    navChatbot: 'AI Assistant',
    // 400+ translation keys...
  },
  ar: {
    navHome: 'الرئيسية',
    navChatbot: 'المساعد الذكي',
    // Arabic versions...
  }
}
```

#### `AuthContext.tsx` - Authentication State

React Context that provides auth everywhere:

```typescript
const AuthContext = {
  user: UserProfile | null,     // Current logged-in user
  token: string | null,         // JWT token
  login: () => Promise,         // Login function
  logout: () => Promise,        // Logout function
  currency: CurrencyCode,       // User's preferred currency
  formatPrice: () => string,    // Price formatting with conversion
}
```

**How it works:**
1. On page load, checks localStorage for saved token
2. Validates token with backend (`/api/auth/verify`)
3. If valid, loads user profile
4. Provides `user` and `token` to all components

#### `api.ts` - API Client

Functions that call the backend:

```typescript
// Every API call goes through this wrapper
async function apiRequest(path, options) {
  // Auto-attaches token from localStorage
  // Handles errors consistently
}

// Exported functions
export async function fetchCars(filters) { ... }
export async function getPriceEstimate(payload) { ... }
export async function handleChatbotMessage(payload) { ... }
```

#### `types.ts` - Type Definitions

TypeScript interfaces for type safety:

```typescript
interface Car {
  id: number;
  make: string;
  model: string;
  year?: number;
  price?: number;
  currency?: CurrencyCode;
  // ...
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
}
```

---

## 6. AI Features

### What AI Powers IntelliWheels?

| Feature | Technology | Type |
|---------|------------|------|
| **Chatbot** | Google Gemini 2.5 Flash | Deep Learning (LLM) |
| **Vision Analysis** | Google Gemini Vision | Deep Learning |
| **Price Estimation** | Rule-Based Expert System | Symbolic AI |
| **Semantic Search** | Keyword Scoring | Information Retrieval |

### Chatbot (`ai_service.chat()`)

**What it does:**
- Answers car-related questions
- Supports Arabic and English
- Can extract listing data from conversation
- Can analyze uploaded images

**How it works:**
1. Detects language (Arabic if >30% Arabic characters)
2. Builds system prompt with car expertise
3. Sends to Gemini API
4. Parses response for listing JSON if present

```python
# Language detection
def is_arabic(text):
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    return arabic_chars > len(text) * 0.3
```

### Vision Helper (`ai_service.analyze_image()`)

**What it does:**
- Upload a car photo
- AI identifies: make, model, year, body style
- Estimates price in JOD

**How it works:**
1. Decode base64 image
2. Send to Gemini with structured prompt
3. Prompt includes Jordanian price guides
4. Parse JSON response

### Price Estimation (`ai_service.estimate_price()`)

**This is NOT machine learning** - it's a rule-based expert system.

**Algorithm:**
```python
# 1. Categorize by brand
if make in ['mercedes', 'bmw', 'audi']:
    base_price = 45000  # Luxury
elif make in ['toyota', 'honda']:
    base_price = 18000  # Standard

# 2. Apply depreciation by age
if age <= 3:
    price *= (1 - age * 0.08)  # -8% per year
elif age <= 7:
    price *= (0.76 - (age-3) * 0.05)  # -5% per year

# 3. Adjust for specs
if horsepower > 300:
    price *= 1.15  # +15%
```

### Semantic Search (`ai_service.semantic_search()`)

**Not using embeddings/vectors** - uses keyword scoring instead.

**How it works:**
1. Parse query for keywords and price constraints
2. Score each car in database:
   - +50 points for exact make match
   - +45 points for exact model match
   - +40 points for category match ("luxury")
   - +15 points if under budget
3. Sort by score, return top results

---

## 7. Database Design

### Tables Overview

```
┌─────────────────┐     ┌─────────────────┐
│     users       │     │      cars       │
├─────────────────┤     ├─────────────────┤
│ id              │◄────│ owner_id        │
│ username        │     │ id              │
│ email           │     │ make            │
│ password_hash   │     │ model           │
│ role            │     │ year            │
│ is_admin        │     │ price           │
│ phone           │     │ specs (JSON)    │
│ created_at      │     │ image_url       │
└─────────────────┘     │ gallery_images  │
        │               │ description     │
        │               │ created_at      │
        │               └─────────────────┘
        │
        │
┌───────┴─────────┐     ┌─────────────────┐
│   favorites     │     │    reviews      │
├─────────────────┤     ├─────────────────┤
│ user_id ────────┤     │ id              │
│ car_id          │     │ car_id          │
│ created_at      │     │ user_id         │
└─────────────────┘     │ rating (1-5)    │
                        │ comment         │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  conversations  │     │  user_messages  │
├─────────────────┤     ├─────────────────┤
│ id              │◄────│ conversation_id │
│ buyer_id        │     │ id              │
│ seller_id       │     │ sender_id       │
│ car_id          │     │ content         │
│ updated_at      │     │ is_read         │
└─────────────────┘     │ created_at      │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────────┐
│    dealers      │     │ dealer_applications │
├─────────────────┤     ├─────────────────────┤
│ id              │     │ id                  │
│ name            │     │ name                │
│ city            │     │ email               │
│ phone           │     │ phone               │
│ rating          │     │ status              │
│ logo_url        │     │ admin_notes         │
└─────────────────┘     └─────────────────────┘
```

### SQLite vs PostgreSQL

| Aspect | SQLite (Dev) | PostgreSQL (Prod) |
|--------|--------------|-------------------|
| Placeholders | `?` | `%s` |
| Auto-increment | `AUTOINCREMENT` | `SERIAL` |
| JSON | TEXT + parse | Native JSONB |
| Timestamps | `CURRENT_TIMESTAMP` | `NOW()` |

The `db.py` wrapper handles these differences automatically.

---

## 8. Security

### Authentication Flow

```
1. User submits login form
         │
         ▼
2. Backend validates credentials
         │
         ▼
3. Generate random token (secrets.token_urlsafe(32))
         │
         ▼
4. Store token in user_sessions table
         │
         ▼
5. Return token to frontend
         │
         ▼
6. Frontend stores in localStorage
         │
         ▼
7. All future requests include: Authorization: Bearer <token>
```

### Security Measures

| Measure | Implementation |
|---------|----------------|
| **Password Hashing** | werkzeug.security (bcrypt) |
| **Input Sanitization** | HTML escape, regex validation |
| **Rate Limiting** | X requests per Y seconds per IP |
| **CORS** | Restricted to frontend domain in production |
| **SQL Injection** | Parameterized queries (never string concat) |
| **XSS Prevention** | Content-Security-Policy headers |

### Validation Examples

```python
# Username: 3-30 chars, alphanumeric only
USERNAME_PATTERN = r'^[a-zA-Z0-9_-]{3,30}$'

# Password: 8+ chars, must have letter AND number
def validate_password(password):
    if len(password) < 8: return False
    if not re.search(r'[A-Za-z]', password): return False
    if not re.search(r'[0-9]', password): return False
    return True
```

---

## 9. Deployment

### Production Setup

```
Frontend (Vercel)
├── Automatic deployment from main branch
├── Environment: NEXT_PUBLIC_API_URL=https://iw-backend.onrender.com
└── Domain: intelliwheels.co

Backend (Render)
├── Web Service running Gunicorn
├── PostgreSQL database
├── Environment variables:
│   ├── SECRET_KEY (32+ char random string)
│   ├── DATABASE_URL (PostgreSQL connection)
│   ├── GEMINI_API_KEY (Google AI API key)
│   ├── FRONTEND_ORIGIN (allowed CORS origin)
│   └── CLOUDINARY_* (image upload config)
└── render.yaml defines the service
```

### Local Development

```bash
# Terminal 1: Frontend
npm install
npm run dev
# → http://localhost:3000

# Terminal 2: Backend
cd backend
pip install -r requirements.txt
python run.py
# → http://localhost:5000
```

---

## 10. Common Committee Questions

### Architecture & Design

**Q: Why separate frontend and backend?**
> A: Separation of concerns. Frontend handles UI/UX, backend handles business logic and data. They communicate via REST API. This allows independent scaling and different tech stacks optimized for each role.

**Q: Why Flask instead of Django?**
> A: Flask is lightweight and flexible. We don't need Django's admin panel or ORM. Flask gave us more control with less boilerplate.

**Q: Why Next.js instead of plain React?**
> A: Next.js provides server-side rendering (SEO), file-based routing, and easy deployment to Vercel. It's the industry standard for React apps.

### AI & ML

**Q: What AI technologies do you use?**
> A: Google Gemini 2.5 Flash for chatbot and vision analysis (deep learning). Rule-based expert system for price estimation (symbolic AI). Keyword scoring for search (information retrieval).

**Q: Why not use machine learning for pricing?**
> A: We have only ~80 car listings. ML needs hundreds or thousands of samples to outperform simple rules. Our expert system is more accurate with limited data. We have a trained ML model ready for when we have more data.

**Q: Is your price estimation "AI"?**
> A: Yes - it's a rule-based expert system, which is a form of classical/symbolic AI. It encodes domain expertise into explicit rules. This is distinct from machine learning but still AI.

**Q: How does bilingual support work?**
> A: Frontend has translation dictionaries for 400+ text strings. Backend detects Arabic characters (>30%) and switches system prompts. RTL layout applies automatically for Arabic.

### Security

**Q: How do you prevent SQL injection?**
> A: All database queries use parameterized statements. We never concatenate user input into SQL strings.

**Q: How are passwords stored?**
> A: Using werkzeug's password hashing (bcrypt algorithm). We never store plain-text passwords.

**Q: What about API abuse?**
> A: Rate limiting decorator limits requests per IP. For example, signup is limited to 5 attempts per minute.

### Business

**Q: What's your revenue model?**
> A: Currently free for users. Future plans: dealer subscriptions, featured listings, premium analytics.

**Q: Why focus on Jordan/GCC?**
> A: Underserved market for tech-enabled car buying. Strong demand for used cars, growing internet penetration, bilingual population.

**Q: How is it different from existing platforms?**
> A: AI-powered features (chatbot, vision, smart search), modern tech stack, bilingual from day one, focus on user experience over classified ads.

---

## Quick Reference Card

### Key Commands

```bash
# Run frontend
npm run dev

# Run backend
cd backend && python run.py

# Install dependencies
npm install            # frontend
pip install -r requirements.txt  # backend
```

### Key Endpoints

```
POST /api/auth/login     → Get auth token
GET  /api/cars           → List cars
POST /api/chatbot        → Chat with AI
POST /api/vision-helper  → Analyze image
POST /api/price-estimate → Get price
GET  /api/semantic-search?q=... → Smart search
```

### Key Files

```
Frontend:
  src/components/AppView.tsx   → Main UI
  src/context/AuthContext.tsx  → Auth state
  src/lib/api.ts               → API calls

Backend:
  backend/app/__init__.py      → App setup
  backend/app/services/ai_service.py → AI logic
  backend/app/routes/cars.py   → Car CRUD
```

---

**Good luck with your presentation!**
