# Volka Website

Studio website for Volka — a brand and web design studio based in Cotonou, Bénin.

## Tech stack

- **Framework**: TanStack Start (React 19) with SSR via Nitro
- **Styling**: Tailwind CSS v4
- **UI components**: shadcn/ui (Radix primitives)
- **Database / Auth**: Supabase
- **Mail**: SMTP via nodemailer (server-side only)
- **Package manager**: npm (CI uses `npm ci` with `package-lock.json`)
- **Target deploy**: Vercel (Nitro auto-detects it); any Node host works with `NITRO_PRESET=node-server`

## Setup

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your Supabase URL, keys, and SMTP credentials

# 3. Start dev server
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript type-check without emitting |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Unit tests (Vitest) |

## Environment variables

See `.env.example` for all variables. Never commit `.env`. Server secrets (service-role key, SMTP password, `SECRET_SALT`) must never be prefixed with `VITE_`.

## Project structure

```
src/
  routes/         # File-based routes (TanStack Router)
  components/     # Shared UI components
  data/           # Static typed data (case studies, offers)
  integrations/   # Third-party clients (Supabase)
  lib/            # Utilities, inquiry pipeline and server functions
  styles.css      # Global styles and design tokens
supabase/
  migrations/     # SQL migrations (apply in order)
```

## Implementation phases

See `../Docs/volka-implementation-plan.md`.
