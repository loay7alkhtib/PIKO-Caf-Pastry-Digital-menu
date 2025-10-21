# Security Guidelines

This project uses Supabase for data and storage. Please follow these guidelines to keep credentials secure.

## Environment Variables

Required variables (set in `.env.local`, never commit real values):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- VITE_SUPABASE_ANON_KEY: safe for public client usage but still rotate if leaked in code history.
- SUPABASE_SERVICE_ROLE_KEY: highly sensitive, server-side only. Do not expose to client code or public repos.

## Key Rotation

If a key has been exposed or you want to rotate periodically:

1. Supabase Dashboard → Project Settings → API
2. Click “Generate new” for the Anon key and/or Service Role key
3. Update `.env.local` with new values
4. Restart local dev and redeploy any environments

## Script Usage

- `scripts/import-menu-data.mjs` requires `SUPABASE_SERVICE_ROLE_KEY` and must be run locally or in a secure server environment.
- `scripts/generate-static-menu.js` reads with the anon/public key only.
- Do not run service-role scripts from client-side or CI logs that may expose secrets.

## Git Hygiene

- Ensure `.env*` files are gitignored
- Never commit real keys to the repository or docs
- If keys were committed, rotate immediately
