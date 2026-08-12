# TARS — Tactical Autonomous Reconnaissance System for Web

> **"An intelligence for exploration."**

TARS is an advanced, futuristic AI voice assistant inspired by mechanical space exploration AI units (like TARS from science-fiction space missions). Built with React, TypeScript, Vite, Web Audio API, Express, and Groq LLM API.

---

## Key Features

- **Real-Time Modular Voice Engine**:
  - Voice Activity Detection (VAD) & Web Audio API input frequency analysis.
  - Browser Speech Recognition (`SpeechRecognition` / `webkitSpeechRecognition`) with live interim transcription.
  - Sentence-based Text-to-Speech (`SpeechSynthesis`) sentence queueing for low-latency audio delivery.
  - Instant Barge-in / Interruption System: Speaking or clicking stops AI speech synthesis immediately and resets engine to listening.
- **Configurable 7-Axis Personality Engine**:
  - Customize TARS's behavioral identity in real-time across 7 sliders (0-100%):
    - `Humor`, `Honesty`, `Confidence`, `Formality`, `Sarcasm`, `Empathy`, `Verbosity`.
  - Server-side system prompt generator dynamically adapts AI response style.
- **Audio-Reactive Canvas Visualizer**:
  - HTML5 Canvas visualizer with concentric mechanical rings & monolithic core.
  - Dynamically reacts to microphone amplitude (`listening`), processing pulses (`processing`), and speech output waveforms (`speaking`).
- **Server-Side Groq LLM Provider**:
  - Powered by Groq API (`llama-3.3-70b-versatile`) with server-side API key protection.
  - Seamless streaming via SSE (`POST /api/chat/stream`).
  - Fallback simulation mode when no API key is present so the app runs out-of-the-box.
- **Autonomous Tool Calling**:
  - Built-in safe tools: Calculator, Weather (Open-Meteo), Time, Web Search (DuckDuckGo).
  - Automated function execution loop with UI status updates.
- **Memory & Mission Log Management**:
  - Conversation history: Create, rename, search, delete mission logs.
  - Memory Manager: Short-term context & long-term fact/preference storage.
- **Futuristic Aesthetics**:
  - Sleek mechanical UI with dark slate aesthetics, JetBrains Mono typography, glowing status indicators, and keyboard shortcuts (`SPACE` to talk, `ESC` to interrupt).

---

## Technology Stack

- **Client**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Web Audio API, Speech Synthesis & Speech Recognition.
- **Server**: Node.js, Express, TypeScript, Groq SDK, Zod, Vitest.
- **Shared**: Monorepo types for contracts and messages.

---

## Installation & Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `server/.env`:
   ```bash
   cp .env.example server/.env
   ```
   Edit `server/.env`:
   ```env
   PORT=3001
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Run Development Mode**:
   Launch both Client & Server concurrently:
   ```bash
   npm run dev
   ```
   - Client UI: `http://localhost:5173`
   - Server Backend: `http://localhost:3001`

4. **Run Unit Tests**:
   ```bash
   npm test
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Security Notes

- Private `GROQ_API_KEY` is NEVER exposed to frontend JavaScript.
- All Groq API requests stream strictly server-side through Express SSE endpoints.
- Input validation sanitizes tool parameters.
