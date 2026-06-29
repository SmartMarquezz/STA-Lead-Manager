# STA Lead Manager

A production web application for managing STA's sponsor and lead pipeline. Built for daily use by non-technical executives — intuitive, visual, and guided.

## Tech Stack

- **Next.js 14** (App Router) — full-stack React framework, zero-config Vercel deployment
- **TypeScript** — type safety across the codebase
- **Tailwind CSS + shadcn/ui** — polished, accessible UI components
- **Firebase Firestore** — free-tier NoSQL database for leads
- **Firebase Auth** — Google sign-in for quick, secure access
- **Ollama** — local AI summaries (development only, gracefully degrades in production)
- **Vercel** — hosting with automatic deployments from `main`

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

### Client (required for the app)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Admin (required for migration script only)

| Variable | Description |
|----------|-------------|
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account private key (use `\n` for newlines) |

## Local Setup

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Google Auth enabled
- (Optional) Ollama running locally for AI summaries

### Steps

1. **Clone the repository**

   ```bash
   git clone <your-repo-url> sta-lead-manager
   cd sta-lead-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. **Set up Firebase**

   - Create a project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable **Firestore Database** (production mode, then add rules below)
   - Enable **Authentication** → Google sign-in provider
   - Register a web app and copy config values to `.env.local`
   - **No Firebase Storage required** — spreadsheet sync uses Google Drive or manual upload (free)

   **Firestore rules:**

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /leads/{leadId} {
         allow read, write: if request.auth != null;
       }
       match /config/{docId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. **Connect your spreadsheet (free — pick one)**

   **Option A — Google Sheets (recommended for production/Vercel)**

   1. Use your live Google Sheet — share as **Anyone with the link** → Viewer
   2. Copy the sheet ID from the URL (`/d/SHEET_ID/edit`) and add to `.env.local` and Vercel:
      ```
      NEXT_PUBLIC_GOOGLE_SHEETS_ID=your_sheet_id_here
      ```
   3. When Jim updates the sheet, the app auto-syncs every 5 minutes

   **Deploying to Vercel — add environment variables:**

   1. Go to [vercel.com](https://vercel.com) → your **sta-lead-manager** project
   2. Click **Settings** → **Environment Variables**
   3. Add each variable from `.env.example` (all `NEXT_PUBLIC_FIREBASE_*` values plus):
      - **Key:** `NEXT_PUBLIC_GOOGLE_SHEETS_ID`
      - **Value:** `14n5CG6sqUGbWs3d3_5G3ubrbLe6-UG6rIc3fl9UOU48`
      - **Environments:** Production, Preview, Development (check all three)
   4. Click **Save**
   5. Go to **Deployments** → click **⋯** on the latest deployment → **Redeploy** (required for new env vars to take effect)

   **Option B — Local file (development only)**

   1. Place `STA-Sponsors.xlsx` in the project root
   2. Run `npm run dev` — auto-syncs from the local file on load and every 5 minutes

   **Option C — Manual upload**

   1. Sign in → **Settings** → **Upload & Sync Spreadsheet**
   2. Re-upload whenever the Excel file changes

6. **Run data migration** (optional CLI alternative)

   Place `STA-Sponsors.xlsx` in the project root, then:

   ```bash
   npm run migrate
   ```

6. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

7. **(Optional) AI summaries with Ollama**

   ```bash
   ollama serve
   ollama pull llama3
   ```

   AI summaries only work on localhost. In production, the dashboard shows a friendly message instead.

## Vercel Deployment

1. Push this repo to GitHub (repository name: `sta-lead-manager`)
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**
3. Import the `sta-lead-manager` repository
4. Vercel auto-detects Next.js — no build config needed
5. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables from `.env.example` in the Vercel dashboard
6. Click **Deploy**
7. Your app will be live at `https://sta-lead-manager.vercel.app` (or your chosen project name)

No manual configuration beyond environment variables is required.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats, pipeline funnel, tier breakdown, AI summary |
| `/leads` | All leads — Kanban and table views with filters |
| `/leads/new` | Add a new lead |
| `/leads/[id]` | Lead detail with pipeline actions, contacts, notes |
| `/sponsors` | Current sponsors grid |
| `/import` | CSV/XLSX import wizard |
| `/settings` | Account and app info |

## File Structure

```
sta-lead-manager/
├── app/                    # Next.js App Router pages
├── components/             # React components + shadcn/ui
├── lib/                    # Firebase, Firestore, auth, types, Ollama
├── scripts/migrate.ts      # One-time XLSX → Firestore migration
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── package.json
└── README.md
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run migrate` | Run XLSX data migration |
| `npm run lint` | Run ESLint |

## License

Private — internal use for STA.
