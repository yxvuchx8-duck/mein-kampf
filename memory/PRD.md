# Gemer — Interactive Project Showcase (imported from Bolt)

## Original problem statement
User imported an existing React/Tailwind project from Bolt (ZIP). Reconstruct the project structure, keep all UI states/components intact, ensure the opening splash animation works in preview, verify routing/state transitions to the main landing page, and keep the homepage as a placeholder pending the user's layout/grid details in the next prompt.

## User decisions (2026-11-10)
- NO database anywhere: Supabase fully removed. Projects live in a hardcoded mock array in the React app (`/app/frontend/src/data/projects.ts`). Site is 100% frontend-driven.
- Keep the codebase Vite + TypeScript exactly as exported from Bolt.
- Workspace access code stays `1769`.

## Architecture
- Frontend: Vite 7 + React 18 + TypeScript + Tailwind CSS 3 in `/app/frontend` (served by supervisor `yarn start` → `vite --host 0.0.0.0 --port 3000`).
- Backend: `/app/backend` (FastAPI) still runs per environment rules but the app makes zero API calls to it.
- Routes (history pushState, no router lib): `/` home (splash → hero → marquee → action cards), `/projects` public gallery, `/workspace` code-gated editor (code 1769).
- Project CRUD is in-memory React state seeded from `mockProjects` (adds/edits/removes reset on page reload — by design, user declined a database).
- Motion: framer-motion (hero masked line reveal, scroll-reveals, hero parallax) + lenis smooth scrolling.

## Implemented (2026-11-10)
- Imported Bolt ZIP into `/app/frontend` (App.tsx, index.css, main.tsx, vite/ts/tailwind/postcss configs, logo asset `public/assets/Screenshot_2026-11-10_133726.png`).
- Removed Supabase client + env; replaced with `src/data/projects.ts` mock array (4 sample projects).
- Added data-testids across all interactive elements.
- Added editorial marquee + masked line-by-line hero reveal + parallax glow (award-polish pass), keeping the original design system (#111818 bg, #c7f36b accent, Inter).
- Verified in preview: splash animation, hero reveal, /projects navigation, back-home, access modal (wrong code denied, 1769 unlocks), add-project in workspace appears in public gallery.

## Implemented (2026-11-10, phase 2 — clean-slate Joplin-style rebuild)
- PURGED all sample/mock projects and boilerplate (deleted `src/data/projects.ts`, removed unused shadcn `components/ui`).
- Client-side dataset only: hierarchical Notebook → SubPage → Blocks (markdown / image / video / code) persisted to `localStorage` under key `gemer.workspace.v1` (`src/data/workspace.ts`). Zero backend, zero Supabase.
- Workspace (/workspace): three-panel Joplin-style layout — notebook rail, sub-page list, editor canvas with title/category/accent/summary/external-link + add/remove blocks (text, image, video, code), autosaves on every change.
- Projects (/projects): gallery groups pages by notebook; each page renders as a project card (accent gradient, category, summary); clicking opens an editorial reading view rendering markdown, images, YouTube/Vimeo/mp4 embeds and code blocks.
- Home page: unchanged (splash animation, masked hero reveal, marquee, three action cards) — placeholder intact for the user's upcoming layout/grid details.
- Verified in preview: clean-slate empty gallery, notebook+page creation, block editing, localStorage persistence across reload, public reading view rendering all block types.

## Backlog / next
- P0: Homepage layout + project grid details — user will provide in next prompt.
- P1: Block reordering (drag or up/down) in the workspace editor.
- P1: Local image upload (object storage) instead of URL-only image blocks.
- P2: Optional backup/export (JSON download) since data lives in localStorage.
