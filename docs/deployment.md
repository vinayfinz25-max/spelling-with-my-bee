# Deployment Setup

## Accounts

- GitHub: host the repository and run CI.
- Supabase free tier: anonymous auth, Postgres, RLS, and Realtime.
- Vercel free tier: deploy the Vite app.

## Environment Variables

Set these in `.env.local` for local development and in Vercel project settings:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only use the public anon key in the frontend. Never add service-role keys to Vite
environment variables.

## Supabase Checklist

1. Create a Supabase project.
2. Enable anonymous sign-ins in Authentication settings.
3. Run `supabase/migrations/20260630_000001_multiplayer_foundation.sql`.
4. Confirm RLS is enabled on every public table.
5. Confirm Realtime is enabled for `room_members`, `room_guesses`, and
   `room_events`.
6. Copy the project URL and anon key into `.env.local`.

## GitHub Checklist

1. Create an empty GitHub repository.
2. Push this project folder.
3. Confirm the `CI` workflow passes on `main`.

## Vercel Checklist

1. Import the GitHub repository into Vercel.
2. Framework preset: Vite.
3. Build command: `pnpm build`.
4. Output directory: `dist`.
5. Add the Supabase environment variables.
6. Deploy.

The included `vercel.json` rewrites all routes to `index.html`, so direct links
such as `/daily` and `/troop/new` work after deployment.
