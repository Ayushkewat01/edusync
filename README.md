# EduSync

> 🎓 Smart Classroom Management Software for Enhanced Learning Environments

A full-stack web application that helps teachers manage attendance, assignments, and communication with students, making classroom activities more organized and effective.

## ✨ Features

### 📱 QR-Based Attendance (Killer Feature)
- Teacher generates time-limited QR codes (30-second expiry)
- Students scan to mark attendance instantly
- Anti-proxy detection (device fingerprint + IP monitoring)
- CSV export of attendance records

### 📝 Assignment Management
- Teachers create assignments with deadlines
- Students submit through the platform
- Auto deadline tracking — Submitted / Late / Missing status
- Submission counting and grading support

### 📢 Communication Hub
- Broadcast announcements to classes
- Priority levels: Normal, Important, Urgent
- Real-time updates via Socket.io

### 🤖 AI Assistant (Powered by Gemini)
- Generate quiz questions from any topic
- Summarize lecture notes automatically
- Create grading rubrics
- Chat-style interface with preset prompts

### 📊 Performance Dashboard
- Attendance % analytics with charts
- Assignment completion tracking
- At-risk student detection (<75% attendance)
- Visual stats cards with trends

### 🎨 Premium UI/UX
- Glassmorphism design system
- Dark mode support
- Smooth Framer Motion animations
- Inter + JetBrains Mono typography
- Fully responsive design

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS v4 |
| UI Components | ShadCN-inspired, Lucide Icons |
| State | Zustand |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| AI | Google Gemini API |
| Animations | Framer Motion |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install
```

### 2. Configure Environment

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edusync
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key  # optional
```

### 3. Run

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Get Started
1. Register as a **Teacher**
2. Create a **Class** → share the join code
3. Register as a **Student** → join with the code
4. Start using attendance, assignments, and announcements!

## 📂 Project Structure

```
edusync/
├── client/                     # React frontend
│   └── src/
│       ├── components/layout/  # Sidebar, Navbar, AppLayout
│       ├── pages/              # All page components
│       ├── store/              # Zustand stores
│       ├── services/           # API client
│       └── lib/                # Utilities
│
└── server/                     # Express backend
    ├── controllers/            # Business logic
    ├── models/                 # Mongoose schemas
    ├── routes/                 # API endpoints
    ├── middleware/              # JWT auth
    └── config/                 # DB connection
```

## 📡 API Endpoints

| Module | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Auth | POST | `/api/auth/register` | Register |
| Auth | POST | `/api/auth/login` | Login |
| Classes | POST | `/api/classes` | Create class |
| Classes | POST | `/api/classes/join` | Join class |
| Attendance | POST | `/api/attendance/generate-qr` | Generate QR |
| Attendance | POST | `/api/attendance/mark` | Mark attendance |
| Assignments | POST | `/api/assignments` | Create assignment |
| Assignments | POST | `/api/assignments/:id/submit` | Submit |
| Announcements | POST | `/api/announcements` | Post announcement |
| AI | POST | `/api/ai/generate-quiz` | Generate quiz |
| AI | POST | `/api/ai/summarize` | Summarize notes |

## 👥 Team

Built for hackathon with ❤️

## 📄 License

MIT
