# Volka Website

## Project rules

- Keep the home page a single editorial scroll; dedicated routes exist only for `/cases`, `/cases/$slug` and `/start`, so shareable deep content gets real URLs.
- Use the Volka palette and Cormorant Garamond / DM Sans pairing; these are the brand's authoritative visual system.
- Case study content lives in `src/data/case-studies.ts` as typed data (and eventually in Supabase — see Phase 5); pages stay presentational.
- Shared page chrome lives in `src/components/site-header.tsx` and `site-footer.tsx`; the home hero uses `<SiteHeader variant="overlay" />` so it floats over the hero image.
- Case studies are `kind: "concept"` (fictional client, illustrative targets, no testimonial) until real. Switch one to `kind: "client"` only with the client's permission and real numbers and quote; never present concept work as a real client.
- Project enquiries are validated with Zod and written through the `submitInquiry` server function, never inserted from the browser.
- All admin mutations must go through `createServerFn` + `requireSupabaseAuth` middleware + an `is_admin()` RLS check.
- Server-only code (mailer, supabaseAdmin, etc.) lives in `*.server.ts` files and is loaded with dynamic `import()` inside handlers.
- Never prefix server secrets with `VITE_` — they would be bundled into the client.

## Stack

TanStack Start (React 19) · Tailwind 4 · shadcn/ui · Supabase · Nitro · npm (lockfile: `package-lock.json`)

## Implementation plan

See `../Docs/volka-implementation-plan.md` for the full phased plan.
