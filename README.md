# TM Hub — Entity Training & Development Platform

A full-stack Django + React application for AIESEC entity TM (Talent Management) to manage courses, quizzes, and member progress.

---

## Project Structure

```
tm-hub/
├── backend/          # Django REST API
│   ├── api/          # Courses, Quizzes, Members, Dashboard
│   ├── login/        # EXPA OAuth, Member model, JWT
│   ├── backend/      # Django config (settings, urls)
│   ├── venv/         # Python virtual environment
│   ├── .env          # Environment variables
│   └── manage.py
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── pages/    # Login, Dashboard, Courses, Quizzes, Progress, Scores, Admin
        ├── components/
        ├── api/      # Axios instance with JWT interceptor
        └── store/    # Zustand auth store
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Neon (or any PostgreSQL) database
- EXPA app credentials (client ID + secret from EXPA Developer settings)

---

## Backend Setup

```bash
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env (already has DATABASE_URL)
# Add your EXPA credentials:
#   EXPA_CLIENT_ID=your_client_id
#   EXPA_CLIENT_SECRET=your_client_secret
#   EXPA_REDIRECT_URI=http://localhost:5173/auth/callback

# Apply migrations
python manage.py migrate

# Start dev server
python manage.py runserver 8000
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Runs at http://localhost:5173
```

---

## EXPA OAuth Setup

1. Go to your EXPA Developer settings
2. Create an OAuth app
3. Set the redirect URI to: `http://localhost:5173/auth/callback`
4. Copy the **Client ID** and **Client Secret** into `backend/.env`

---

## API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/auth/login/` | Returns EXPA auth URL |
| GET | `/api/auth/callback/?code=...` | Exchanges code, issues JWT |
| GET | `/api/auth/me/` | Current member profile |
| POST | `/api/token/refresh/` | Refresh JWT |

### Courses
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/api/courses/` | List / Create |
| GET/PATCH/DELETE | `/api/courses/{id}/` | Detail |
| POST | `/api/courses/{id}/upload/` | Upload file |
| POST | `/api/courses/{id}/progress/` | Update progress |

### Quizzes
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/api/quizzes/` | List / Create with questions |
| GET/PATCH/DELETE | `/api/quizzes/{id}/` | Detail |
| POST | `/api/quizzes/{id}/submit/` | Submit answers, get score |
| GET | `/api/quizzes/{id}/attempts/` | Attempt history |

### Members (TM/PM only)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/members/` | All members with stats |
| GET/PATCH | `/api/members/{id}/` | Detail / Update function |

### Dashboard
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/dashboard/` | Member's courses, quizzes, progress |
| GET | `/api/dashboard/admin/` | Entity-wide stats (TM/PM only) |

---

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/login` | EXPA login page |
| `/auth/callback` | OAuth callback handler |
| `/{function}` | Member dashboard (e.g. `/tm`, `/igv`) |
| `/{function}/courses` | Courses list & viewer |
| `/{function}/quizzes` | Quizzes list & runner |
| `/{function}/progress` | Progress rings |
| `/{function}/scores` | Score history & chart |
| `/admin` | Admin panel (TM/PM only) |
| `/admin/courses/new` | Course creator with file upload |
| `/admin/quizzes/new` | Quiz builder |
| `/admin/members` | Members table |

---

## Key Features

- **EXPA OAuth** — Single sign-on via AIESEC EXPA
- **JWT Auth** — 15-min access tokens, 7-day refresh, auto-renewal
- **Role-based access** — TM/PM can create content & view all members
- **File uploads** — PDF, DOC, PPT, MP4, MOV, WEBM up to 500 MB
- **Quiz engine** — MCQ & True/False, server-side scoring, timed quizzes
- **Progress tracking** — Per-course progress bars and circular rings
- **Score analytics** — Line chart of score trends over time
- **Admin dashboard** — Member stats, avg scores per function (bar chart)
