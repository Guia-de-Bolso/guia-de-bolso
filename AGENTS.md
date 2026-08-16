<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Standard local commands live in `package.json` and `docs/contributing.md`; the app service is the Next.js dev server for the mobile-first Guia de Bolso product.
- Real catalog, auth, admin, and AI discovery flows require valid Supabase public env vars plus `ANTHROPIC_API_KEY`. Placeholder env values are enough for lint/build/dev startup checks, but they leave the app with empty categories and failing data/API requests.
- If dependencies are refreshed while `npm run dev` is already running, restart the dev server afterward. Turbopack can panic after `node_modules` changes under a live process.
