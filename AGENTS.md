<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the home page a single editorial scroll; dedicated routes exist only for `/cases`, `/cases/$slug` and `/start`, so shareable deep content gets real URLs.
- Use the supplied Volka palette and Cormorant Garamond/DM Sans pairing; these are the brand's authoritative visual system.
- Case study content lives in `src/data/case-studies.ts` as typed data, so pages stay presentational and new projects are one object.
- Shared page chrome lives in `src/components/site-header.tsx` and `site-footer.tsx`; the home hero keeps its own inline header because it overlays the hero image.
- Project enquiries are validated with Zod and written through the `submitInquiry` server function, never inserted from the browser, so the form cannot be used to write arbitrary rows.
