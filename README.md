# 🎙️ AI Meeting Summarizer

> A production-ready full-stack AI SaaS that records meetings, transcribes them, and generates structured summaries with downloadable PDF reports.

---

## 🚀 What This App Does

AI Meeting Summarizer turns raw audio, video, or live recordings into:

- 🧠 Clean meeting summaries
- 📄 Professional PDF reports
- ✅ Extracted action items
- 📌 Key decisions
- ⏰ Detected deadlines
- 📊 Discussion point breakdown
- 💬 Full searchable transcript
- 🔍 Meeting history dashboard

---

## 🎯 Input Methods

| Method | Details |
|---|---|
| 🎤 Live Recording | Record directly from browser microphone — stops automatically trigger AI processing |
| 📂 Upload Audio | Supports `.mp3`, `.wav`, `.m4a` |
| 🎬 Upload Video | Supports `.mp4`, `.mov` — audio is extracted automatically |

---

## 🧠 AI Pipeline

```
Audio / Video / Recording
         ↓
  Whisper (Speech-to-Text)
         ↓
    Clean Transcript
         ↓
    LLM Processing
         ↓
  Structured JSON Output
         ↓
   Database Storage
         ↓
    PDF Generator
```

---

## ✨ AI Features

- 🎙️ **Speech-to-Text** — Faster-Whisper for accurate, fast transcription
- 🧠 **Smart Summarization** — LLM-powered executive summaries
- ✅ **Action Item Extraction** — Who does what, by when
- ⏰ **Deadline Detection** — Surfaces time-sensitive commitments
- 📊 **Key Topic Extraction** — Structured discussion breakdown
- ⚠️ **Risk Detection** — Flags issues and blockers
- 👥 **Speaker Labeling** *(optional)* — Pyannote diarization
- 💬 **Chat with Meeting** *(RAG-ready)* — Ask questions about any meeting

---

## 📄 Generated Report Structure

Each meeting produces a professional report containing:

1. Cover page with meeting title
2. Date & duration
3. Executive summary
4. Key discussion points
5. Decisions made
6. Action items & owners
7. Deadlines
8. Risks & issues
9. Full transcript
10. AI tags & keywords
11. Footer with page numbers

---

## 🏗️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- React Router
- Framer Motion

### Backend
- Flask
- Flask-CORS
- Flask-JWT-Extended
- SQLAlchemy

### AI Layer
- Faster-Whisper *(speech-to-text)*
- Groq / Local LLM *(summarization)*
- Pyannote *(optional speaker diarization)*

### Database
- PostgreSQL

### DevOps *(optional)*
- Docker + Docker Compose

---

## 📁 Project Structure

```
ai-meeting-summarizer/
├── frontend/          # React + Vite UI
├── backend/           # Flask API + AI pipeline
├── database/          # Schema & migrations
├── docs/              # API docs & architecture notes
└── docker/            # Docker & Compose configs
```

---

## ⚙️ How It Works

```
1. User uploads or records a meeting
2. Backend saves the file
3. Whisper converts speech → text
4. LLM analyzes the transcript
5. Structured JSON summary is created
6. Summary is stored in the database
7. PDF report is generated
8. User downloads or views the result
```

---

## 📡 API Endpoints

### Authentication
```
POST  /api/register
POST  /api/login
```

### Meetings
```
POST   /api/upload
POST   /api/record
GET    /api/meetings
GET    /api/meeting/<id>
DELETE /api/meeting/<id>
```

### AI Processing
```
POST  /api/meeting/<id>/process
POST  /api/meeting/<id>/chat
```

### Export
```
GET   /api/meeting/<id>/pdf
```

---

## 🧪 Roadmap

- [ ] 🔴 Real-time transcription during live meetings
- [ ] 👥 Full speaker identification
- [ ] 🌍 Multi-language support
- [ ] 💬 AI chat with meeting memory (RAG)
- [ ] 📅 Google Calendar integration
- [ ] ☁️ Cloud storage (AWS S3 / GCP)
- [ ] 📱 Mobile app
- [ ] 🤝 Team collaboration features

---

## 💡 Why This Project Matters

This is not just a demo — it's a **real SaaS product idea** with production-level thinking.

It demonstrates:

- Full-stack engineering (React + Flask)
- AI integration (Whisper + LLMs)
- Real-world SaaS architecture
- File processing pipelines
- JWT authentication
- PDF generation
- Backend system design

Suitable for **freelancing portfolios** (Fiverr / Upwork) or **startup demos**.

---

## 👨‍💻 Author

**Rafeh Maddouri**

[![GitHub](https://img.shields.io/badge/GitHub-Rafeh--18-181717?logo=github)](https://github.com/Rafeh-18)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-rafeh--maddouri-0A66C2?logo=linkedin)](https://www.linkedin.com/in/rafeh-maddouri/)
[![Fiverr](https://img.shields.io/badge/Fiverr-rafeh__datasc-1DBF73?logo=fiverr)](https://www.fiverr.com/rafeh_datasc)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-6FDA44?logo=upwork)](https://www.upwork.com/freelancers/~01ff6a856ff95e9be9)

---

## 📜 License

MIT License — free to use and modify.
