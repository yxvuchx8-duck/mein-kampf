# Test Credentials

## Workspace access code
- Code: `1769`
- Enter it in the "yxvuchx8 / Admin workspace access" modal on the home page to open `/workspace` (project editor).

## Supabase (cloud database)
- Project URL: https://apsrdueltpnjfpouxcyx.supabase.co (VITE_SUPABASE_URL in frontend/.env)
- Anon/publishable key: VITE_SUPABASE_ANON_KEY in frontend/.env (also in the secure secrets store)
- Personal access token: SUPABASE_ACCESS_TOKEN (secrets store, live slot) — used only for table provisioning via Management API
- Tables: projects, pages, log_blocks, blog_posts — RLS enabled with open policies; the 1769 access code is the only write gate

## Notes
- All content now lives in the Supabase cloud project, NOT in browser localStorage. Public routes and workspace read/write live data. Deploying ships code only; content is already shared because it lives in the cloud.
- Supabase was fully removed during import — no Supabase keys are needed.
