<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Astro-Noctum (Bazodiac)

A high-end fusion astrology platform combining Western Astrology, Chinese BaZi (Four Pillars), and Wu-Xing (Five Elements).

## 📖 Documentation

For detailed technical information, please refer to the following documents:

- [**BAZODIAC.md**](./docs/BAZODIAC.md): Product overview, USP, and high-level architecture.
- [**API_REFERENCE.md**](./docs/API_REFERENCE.md): Backend endpoints, request/response formats, and external API integrations.
- [**FRONTEND_INTERNALS.md**](./docs/FRONTEND_INTERNALS.md): React components, state management, and the Fusion Ring engine.
- [**DATABASE_SCHEMA.md**](./docs/DATABASE_SCHEMA.md): Supabase PostgreSQL tables, RLS policies, and triggers.
- [**STRUCTURE.md**](./docs/STRUCTURE.md): Codebase directory map.

## 🚀 Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Environment Setup:**
   Copy `.env.example` to `.env.local` and fill in all required secrets (Gemini, Supabase, Stripe, ElevenLabs).
3. **Start the application:**
   ```bash
   # Terminal 1: Vite Frontend (port 3000)
   npm run dev
   
   # Terminal 2: Express Backend (port 3001)
   PORT=3001 node server.mjs
   ```

## 🛠 Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, Framer Motion, Three.js, Pixi.js.
- **Backend:** Node.js (Express), BAFE API Proxy.
- **Infrastructure:** Supabase (Auth & DB), Railway (Deployment), Stripe (Payments).
- **AI:** Google Gemini (Horoscope Generation), ElevenLabs (Voice Agent).

## 📡 Runtime Requirements

- **Node.js:** >= 20.19.0 (pinned in `.nvmrc`)
- **npm:** >= 10.x

---
*Bazodiac · DYAI2025 · Confidential*
