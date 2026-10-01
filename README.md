# Volka Website

Studio website for Volka — a brand and web design studio based in Cotonou, Bénin.

## Tech stack

- **Framework**: TanStack Start (React 19) with SSR via Nitro
- **Styling**: Tailwind CSS v4
- **UI components**: shadcn/ui (Radix primitives)
- **Database / Auth**: Supabase
- **Package manager**: Bun
- **Target deploy**: Vercel (Node runtime)

## Setup

```bash
# 1. Clone and install
bun install

# 2. Configure environment
cp .env.example .env
# Fill in your Supabase URL, keys, and SMTP credentials

# 3. Start dev server
bun dev
```

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start dev server |
| `bun build` | Production build |
| `bun preview` | Preview production build locally |
| `bun typecheck` | TypeScript type-check without emitting |
| `bun lint` | ESLint |
| `bun format` | Prettier |

## Environment variables

See `.env.example` for all required variables. Never commit `.env`.

## Project structure

```
src/
  routes/         # File-based routes (TanStack Router)
  components/     # Shared UI components
  data/           # Static typed data (case studies, offers)
  integrations/   # Third-party clients (Supabase)
  lib/            # Utilities and server functions
  styles.css      # Global styles and design tokens
```

## Implementation phases

See `../Docs/volka-implementation-plan.md`.
