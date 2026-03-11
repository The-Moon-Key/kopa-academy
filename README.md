# KOPA Academy

Internal platform for the KOPA AI Apprentice Programme — a structured learning path taking non-technical employees from zero to independently shipping AI-powered tools.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Netlify (CDN)                         │
│              React + Vite SPA (dist/)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Dashboard │ │ Projects │ │   KC     │ │ Portfolio │  │
│  │  Page    │ │  & Layers│ │Interface │ │   Page    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       └─────────────┴────────────┴─────────────┘        │
│                         │                                │
│              @supabase/supabase-js                       │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┴───────────────────────────────┐
│                     Supabase                             │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │   Auth     │ │  PostgreSQL  │ │  Edge Functions   │   │
│  │ (email/pw) │ │  (+ RLS)     │ │  (AI Assistant    │   │
│  └────────────┘ └──────────────┘ │   AI Evaluator)   │   │
│  ┌────────────┐ ┌──────────────┐ └──────────────────┘   │
│  │  Storage   │ │  Realtime    │                         │
│  │ (files)    │ │ (subscriptions)│                       │
│  └────────────┘ └──────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **State**: Zustand
- **Routing**: React Router 7
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **AI**: Claude API (via Supabase Edge Functions)
- **Hosting**: Netlify

## User Roles

| Role | Access |
|------|--------|
| **Apprentice** | Dashboard, projects, submissions, knowledge checks, portfolio |
| **Coach** | Review queue, apprentice progress, KC transcripts, custom questions |
| **Admin** | User management, cohorts, AI prompts, audit log, KC overrides |

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project

### 1. Clone & Install

```bash
git clone <repo-url>
cd kopa-academy
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### 3. Database Setup

Run the migration and seed files against your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor:
# 1. Run supabase/migrations/001_initial_schema.sql
# 2. Run supabase/seed.sql
```

### 4. Edge Functions

Deploy the Supabase Edge Functions:

```bash
supabase functions deploy ai-assistant
supabase functions deploy ai-evaluator
```

Set the required secrets:

```bash
supabase secrets set ANTHROPIC_API_KEY=your-key-here
```

### 5. Development

```bash
npm run dev
```

### 6. Build

```bash
npm run build
```

The built files will be in `dist/` ready for Netlify deployment.

## Project Structure

```
src/
├── components/       # Shared UI components
│   ├── Layout.tsx    # App shell (sidebar, header)
│   ├── StatusBadge.tsx
│   ├── TierBadge.tsx
│   └── EmptyState.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── apprentice/   # Apprentice-facing pages
│   │   ├── DashboardPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── LayerDetailPage.tsx
│   │   ├── KnowledgeChecksPage.tsx
│   │   ├── KnowledgeCheckSessionPage.tsx
│   │   └── PortfolioPage.tsx
│   ├── coach/        # Coach-facing pages
│   │   ├── CoachDashboardPage.tsx
│   │   ├── ReviewPage.tsx
│   │   ├── ApprenticeListPage.tsx
│   │   └── KCTranscriptsPage.tsx
│   └── admin/        # Admin-facing pages
│       ├── UserManagementPage.tsx
│       ├── CohortManagementPage.tsx
│       ├── AIPromptsPage.tsx
│       ├── AuditLogPage.tsx
│       └── KCOverridePage.tsx
├── hooks/            # Custom React hooks
│   ├── useAuth.ts
│   └── useSupabaseQuery.ts
├── lib/              # Utilities
│   ├── supabase.ts   # Supabase client
│   └── store.ts      # Zustand store
├── types/            # TypeScript types
│   └── index.ts
├── App.tsx           # Router setup
├── main.tsx          # Entry point
└── index.css         # Tailwind + theme
supabase/
├── migrations/
│   └── 001_initial_schema.sql
├── functions/
│   ├── ai-assistant/index.ts
│   └── ai-evaluator/index.ts
└── seed.sql
```

## Deployment

The app is configured for Netlify deployment. Push to `main` to trigger a deploy.

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Target domain**: `academy.kopamarket.io`
- **SPA redirects**: All routes → `index.html`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables.
