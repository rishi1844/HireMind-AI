# 🤖 ResumeAI — Full-Stack AI Resume Analyzer & Interview Platform

A production-grade platform with Next.js 14, Spring Boot, MySQL, and Google Gemini AI.

---

## 📁 Project Structure

```
ai-resume-platform/
├── frontend/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Design system + glassmorphism
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── resume/
│   │   │   ├── upload/page.tsx
│   │   │   └── analysis/page.tsx
│   │   ├── interview/page.tsx
│   │   └── history/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx     # Protected page wrapper
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   └── resume/
│   │       ├── ATSScoreRing.tsx # Animated circular chart
│   │       └── ResumeDropzone.tsx
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth guard hook
│   │   └── useSpeech.ts         # Web Speech API
│   ├── lib/
│   │   ├── store.ts             # Zustand auth store
│   │   └── utils.ts
│   ├── services/
│   │   └── api.ts               # Axios API client
│   └── .env.local               # ← Fill in your values
│
├── backend/                     # Spring Boot
│   ├── src/main/java/com/resumeai/
│   │   ├── ResumeAiApplication.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── ResumeController.java
│   │   │   └── InterviewController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── ResumeService.java
│   │   │   ├── InterviewService.java
│   │   │   └── GeminiService.java
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Resume.java
│   │   │   ├── AnalysisResult.java
│   │   │   ├── InterviewSession.java
│   │   │   └── InterviewQA.java
│   │   ├── repository/ (5 repos)
│   │   ├── dto/
│   │   │   ├── AuthDto.java
│   │   │   ├── ResumeDto.java
│   │   │   └── InterviewDto.java
│   │   ├── security/ (JWT + filters)
│   │   ├── config/SecurityConfig.java
│   │   └── exception/GlobalExceptionHandler.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── .env                     # ← Fill in your values
│   └── pom.xml
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

---

### 1. Database Setup

```sql
CREATE DATABASE resume_ai_db;
```

MySQL will auto-create tables via JPA on first run.

---

### 2. Backend Setup

```bash
cd backend

# Fill in your credentials
nano .env       # or edit with any editor
```

Edit `backend/.env`:
```
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your_password
GEMINI_API_KEY=AIza...your_key_here
JWT_SECRET=your_256bit_secret_here_at_least_32_chars
```

Then run:
```bash
mvn spring-boot:run
# Backend starts on http://localhost:8080
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Fill in environment
nano .env.local
```

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Then run:
```bash
npm run dev
# Frontend starts on http://localhost:3000
```

---

## 🔑 Getting a Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google
3. Click "Create API Key"
4. Copy it into `backend/.env` as `GEMINI_API_KEY`

The free tier gives 15 requests/minute and 1 million tokens/day — plenty for development.

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/upload-resume` | Yes | Upload PDF |
| POST | `/api/analyze?resumeId=X` | Yes | AI resume analysis |
| GET | `/api/analysis/{id}` | Yes | Get analysis result |
| GET | `/api/history` | Yes | Resume history |
| POST | `/api/generate-questions` | Yes | Generate interview Qs |
| POST | `/api/evaluate-answer` | Yes | Evaluate answer |
| POST | `/api/interview/save-session` | Yes | Save interview |
| GET | `/api/interview/history` | Yes | Interview history |
| GET | `/api/interview/session/{id}` | Yes | Session details |

---

## 🎨 UI Features

- **Glassmorphism design** with dark theme
- **Framer Motion animations** throughout
- **Responsive** — mobile, tablet, desktop
- **Voice input** via Web Speech API
- **Animated ATS score ring** (SVG)
- **Drag & drop** resume upload
- **Real-time feedback** during interview

---

## 🔐 Security

- Passwords hashed with BCrypt
- JWT tokens (24h expiry by default)
- Protected routes on frontend and backend
- CORS configured for localhost (update for production)

---

## 🚀 Production Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### Backend (Railway / Render / EC2)
```bash
cd backend
mvn clean package -DskipTests
java -jar target/resume-ai-backend-1.0.0.jar
```

Update `CORS_ALLOWED_ORIGINS` to your frontend domain.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| State | Zustand |
| Backend | Spring Boot 3.2, Java 17 |
| Auth | JWT (jjwt 0.12) |
| Database | MySQL 8 + Spring Data JPA |
| AI | Google Gemini 1.5 Flash |
| PDF | Apache PDFBox |
| Voice | Web Speech API |
| HTTP Client | OkHttp (backend), Axios (frontend) |
