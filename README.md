# 🚀 FaceAccess V3

**FaceAccess V3** is a high-performance, premium facial recognition access and loyalty system. It has been completely rebuilt from the ground up to offer a seamless "face-as-a-key" experience with a robust loyalty program integration.

## ✨ Key Features

- **Local Face Detection**: Ultra-fast browser-side descriptor generation using `face-api.js`.
- **Intelligent Access**: Instant building access verification based on mathematical face vector comparison.
- **Loyalty Program**: Automatically earn points and level up through tiers (**Bronze, Silver, Gold, Platinum**) with every check-in.
- **Admin Dashboard**: Real-time analytics, user distribution, and system health monitoring.
- **Zero-Config Database**: Powered by SQLite for immediate "plug-and-play" functionality.

---

## 🏗️ Technical Architecture

### **The Stack**
- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Premium Glassmorphism Design)
- **Backend**: [Express.js](https://expressjs.com/) (TypeScript + ESM)
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **Database**: [SQLite](https://sqlite.org/)
- **AI/ML Engine**: Browser-side [face-api.js](https://github.com/vladmandic/face-api)

### **Why this architecture?**
1. **Privacy & Speed**: Face descriptors are generated locally in the user's browser. We never send raw images to the server—only encrypted-like mathematical embeddings.
2. **Stability**: By moving the AI heavy-lifting to the client, the backend remains extremely lightweight and avoids common Windows-native dependency conflicts.
3. **Scale**: The system is designed to handle thousands of users with sub-second response times.

---

## 🚦 Getting Started

### 1. Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
*Backend runs at: [http://localhost:4000](http://localhost:4000)*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: [http://localhost:3000](http://localhost:3000)*

---

## 📂 Project Structure

```text
faceaccess-v3/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Business logic for Users & Access
│   │   ├── routes/        # API Endpoints
│   │   └── services/      # Facial matching algorithms
│   ├── prisma/             # Schema & SQLite Database
│   └── .env               # Server configuration
└── frontend/
    ├── src/
    │   ├── app/           # Next.js Pages (Register, Access, Dashboard)
    │   ├── components/    # Reusable Camera & UI components
    │   └── lib/           # API Client & Helpers
    └── public/            # AI Model weights
```

## 📜 License
Internal Hackathon Project. All rights reserved.

---

*Built with ❤️ by the Antigravity AI Team.*
