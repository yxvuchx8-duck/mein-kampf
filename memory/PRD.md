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

## Implemented (2026-11-10, phase 3 — header + security)
- Header refactored: pill/capsule bar removed on all routes. New `src/components/Header.tsx` `FloatingHeader` — borderless full-width flex row, logo avatar far left, sun/moon Light/Dark toggle far right (persists via localStorage key `gemer.theme`). Full light-mode CSS layer added to `src/index.css`.
- Security: workspace access-code input is now `type="password"` (native masking dots).
- Verified: no pill classes in header, toggle flips light/dark on all routes, theme survives reload, password input masked, 1769 still unlocks workspace.

## Implemented (2026-11-10, phase 4 — Project → Pages → Log Blocks restructure)
- "Notebooks" concept fully removed. New schema in `src/data/workspace.ts`: Project (name/category/summary/accent) → Page (title, log blocks) → LogBlock (rich text + inline images). New localStorage key `gemer.workspace.v2` (old v1 key auto-purged on save).
- Unified log blocks: each block = markdown textarea + "Insert photo" file tool. `compressImage()` canvas utility downsizes to ≤1100px JPEG q0.72 Base64 data URLs so photos fit the 5MB localStorage quota; quota overflow shows an in-app warning banner instead of throwing.
- Workspace (/workspace): left = Projects rail (+ Add Project), middle = Pages index (+ Add Page), canvas = page editor with project meta fields + "+ Add Log Block" log stream.
- Public (/projects): 3-stage flow — project squares grid → per-project Table of Contents (page rows with block counts + dates) → reading view rendering markdown + inline photos.
- Verified: clean slate after purge, photo upload compressed to ~66KB total storage and persisted across reload, all 3 stages + back navigation.

## Implemented (2026-11-10, phase 5 — Blog + strict Minecraft theme)
- Blog feature: `blogPosts` collection in localStorage state (id/title/datePublished/log blocks). Workspace middle column has Project Pages / Blog Space toggle; Blog Space lists posts chronologically with + Create New Post; canvas editor = Post Title input + log stream with photo inserts. Public `/blog` route = chronological timeline feed (glow-dot rail) rendering markdown + inline photos. Home hero grid now has 4 action cards (added "View Blog", action-blue accent).
- Minecraft theme tightened to the user's strict spec: buttons #4a4a4a with 2px borders (#8b8b8b top/left, #212121 bottom/right), hover → white border + #FFFF55 golden text with dark drop-shadow, border-radius 0 everywhere; panels = #c6c6c6 inventory frames with raised light/dark inset borders; blog feed becomes "server chat log" boards with golden #b38900 titles on gray panels; pixel fonts Press Start 2P (headers) + VT323 (body) via Google Fonts; pixel assets generated with gpt-image-1.5 (deepslate tile, creeper, sword, pickaxe) in /public/assets/mc; creeper guards the password lock, pickaxes mark projects, swords mark pages; success messages = achievement toast. Third toggle state cycles dark → light → minecraft.
- Verified: post create/publish/persist across reload, public feed renders text+photo, empty states, MC theme on blog + lock screen + toggle revert to dark, projects route unaffected.

## Implemented (2026-11-10, phase 6 — visual polish)
- Home ticker words removed: replaced with ParticleStream (14 seeded drifting square particles + ambient glowing line, `.particle-stream` CSS; Minecraft-mode variant tints particles green/gold).
- Minecraft action cards: solid #313131 fill restored under the pixel bevel borders (rule must stay more specific than the general `html.minecraft button` rule); card titles sized down in MC mode (clamp 1rem–1.45rem + word-break) to stop right-edge clipping.
- Blog copy: heading "Things I Think", subtitle "don't know why".
- Verified by testing agent (2 passes): ticker wordless + animating, all 4 cards solid rgb(49,49,49) with full titles visible at 1920px and 1024px, blog copy exact in both themes. Live site not checked; mobile <1024px not checked.

## Implemented (2026-11-10, phase 7 — Supabase cloud migration)
- Supabase connected: direct browser client via @supabase/supabase-js (`src/data/supabase.ts`), VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in frontend/.env (secrets store). Tables provisioned via Management API with a Personal Access Token (in secrets as SUPABASE_ACCESS_TOKEN): projects(id,name,category,summary,accent,created_at), pages(id,project_id→projects CASCADE,title,updated_at), log_blocks(id,page_id→pages CASCADE,type,value jsonb,position_order), blog_posts(id,title,date_published,content_blocks jsonb). RLS enabled with open public_access policies (anon key = write access; access code 1769 is the only gate — acceptable for personal site).
- localStorage persistence fully detached: App loads from cloud on mount; public /projects + /blog read live from Supabase; workspace "Save & Sync" upserts project+page+blocks or post to cloud, deletes sync immediately. App ids are now real UUIDs (crypto.randomUUID()) to match uuid PK columns.
- Verified end-to-end in preview: page + compressed photo saved to cloud, localStorage wiped + reload → data restored from Supabase, public 3-stage reading view renders cloud content (text + base64 photo), blog post appears in /blog. Cloud sync errors surface as a banner instead of failing silently.
- Test data in the cloud db: project "Nebula Atlas" (page "Cloud Sync Test") and blog post "Cloud post test" — user can delete from workspace.

## Backlog / next
- P0: Homepage layout + project grid details — user will provide in next prompt.
- P1: Block reordering (drag or up/down) in the workspace editor.
- P1: Local image upload (object storage) instead of URL-only image blocks.
- P2: Optional backup/export (JSON download) since data lives in localStorage.
