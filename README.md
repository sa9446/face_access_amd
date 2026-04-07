# FaceAccess V3

**FaceAccess V3** is a facial recognition access and loyalty system. It offers a "face-as-a-key" experience with a built-in loyalty program integration.

---

## Key Features

- **Local Face Detection**: Browser-side descriptor generation using `face-api.js` — no raw images sent to server.
- **Intelligent Access**: Building access verification based on face vector comparison.
- **Loyalty Program**: Earn points and level up through tiers (Bronze, Silver, Gold, Platinum) on every check-in.
- **Admin Dashboard**: Real-time analytics, user distribution, and system health monitoring.
- **Zero-Config Database**: SQLite — no external database setup required.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS |
| Backend | Express.js (TypeScript + ESM) |
| ORM | Prisma 6 |
| Database | SQLite (`backend/dev.db`) |
| AI/ML | Browser-side `face-api.js` + `@vladmandic/face-api` |

---

## Project Location

```
C:\Users\HP\Documents\GitHub\face_access_amd_temp\
├── backend\
│   ├── src\
│   │   ├── controllers\   # Business logic for Users & Access
│   │   ├── routes\        # API Endpoints
│   │   └── services\      # Facial matching algorithms
│   ├── prisma\            # Schema & SQLite Database
│   ├── dev.db             # SQLite database file
│   └── .env               # Server config (PORT=4000, DATABASE_URL)
└── frontend\
    ├── src\
    │   ├── app\           # Next.js Pages (Register, Access, Dashboard)
    │   ├── components\    # Reusable Camera & UI components
    │   └── lib\           # API Client & Helpers
    └── public\            # AI Model weights
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### First-Time Setup

```bash
# Backend
cd "C:\Users\HP\Documents\GitHub\face_access_amd_temp\backend"
npm install
npx prisma db push

# Frontend
cd "C:\Users\HP\Documents\GitHub\face_access_amd_temp\frontend"
npm install
```

### Running the App

**Terminal 1 — Backend (port 4000):**
```bash
cd "C:\Users\HP\Documents\GitHub\face_access_amd_temp\backend"
npm run dev
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd "C:\Users\HP\Documents\GitHub\face_access_amd_temp\frontend"
npm run dev
```

### URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

> Note: If port 3000 is occupied, Next.js will automatically use 3001.

---

## Environment

Backend `.env` defaults:
```
DATABASE_URL=file:./dev.db
PORT=4000
NODE_ENV=development
```

---

## License

Internal Hackathon Project. All rights reserved.
