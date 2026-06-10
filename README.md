# Hum 🩷
> *just us*

A private couples app built with Next.js 15, Supabase, and the Claude API. Mobile-first PWA — works on iOS via Safari "Add to Home Screen".

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + Framer Motion |
| Backend | Next.js API Routes (no separate server) |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Storage | Supabase Storage (profile photos) |
| Realtime | Supabase Realtime (pings, answers) |
| AI | Anthropic Claude API |
| Deploy | Vercel (free) |

---

## Setup

### 1. Clone & install
```bash
git clone <your-repo>
cd hum
npm install
```

### 2. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **SQL Editor** → paste the contents of `supabase/migrations/001_initial_schema.sql` → Run

### 3. Set environment variables
```bash
cp .env.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase > Project Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the same page
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## How the pairing works
1. **Karthik** signs up → gets a unique 6-character invite code (e.g. `AB12CD`)
2. **Akaisha** signs up → goes to pair screen → enters Karthik's code
3. A `couples` row is created linking both profiles
4. Both now see each other's answers, pings, and KZ votes

---

## iOS PWA Install (for Akaisha)
1. Open the deployed Vercel URL in **Safari**
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add** — done ✅

It'll appear as a full-screen app with no browser chrome.

---

## Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Add the same env vars in Vercel dashboard under **Settings > Environment Variables**.

---

## Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup + gender selector
│   ├── (app)/
│   │   ├── home/          # Home screen
│   │   ├── talk/          # Prompts + answers
│   │   ├── kaun/          # Kaun Zyada game
│   │   └── profile/       # Profile + pfp upload
│   ├── api/
│   │   ├── prompt/        # Claude API proxy
│   │   ├── ping/          # Send ping
│   │   └── pair/          # Pair two accounts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── shared/
│       ├── BottomNav.tsx
│       └── PairScreen.tsx
├── lib/
│   ├── constants.ts       # Palette, copy, prompts, KZ questions
│   ├── store.ts           # Zustand global state
│   ├── auth.ts            # Server actions
│   └── supabase/
│       ├── client.ts      # Browser client
│       └── server.ts      # Server client
├── types/
│   └── index.ts           # All TypeScript types
└── middleware.ts           # Auth route protection
```

---

## Features
- 🔐 **Auth** — email/password via Supabase
- 🔗 **Pairing** — 6-digit invite code system
- 💬 **Talk** — daily prompts in Hinglish, AI-generated via Claude
- 🔥 **Kaun Zyada** — Who's More Likely To game, 10 questions/day, AI bonus questions
- 🩷 **Pings** — one-tap emotional check-ins
- 📸 **Profile photos** — individual uploads to Supabase Storage
- 📱 **PWA** — installable on iOS via Safari
- 🔄 **Realtime** — pings and answers update live

---

## Roadmap
- [ ] Push notifications (Web Push API)
- [ ] Voice drops (30s audio messages)
- [ ] Shared bucket list
- [ ] Daily photo ("Aaj ka pal")
- [ ] Streak notifications
- [ ] Dark mode 🌙
