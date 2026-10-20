# Fix local sign-in (AADSTS9002326) for RAKTA-FIN foundry-agent-webapp

## Context
Local sign-in at http://localhost:5173 hangs on "Preparing your session…". The token
request to login.microsoftonline.com returns 400:

> AADSTS9002326: Cross-origin token redemption is permitted only for the
> 'Single-Page Application' client-type. Request origin: 'http://localhost:5173'

The page spins instead of showing an error because the app only leaves the spinner
once an account exists ([AppContext.tsx:76-80]); `useMsalAuthentication` errors are ignored ([App.tsx:15]).

## Root cause (verified against live app config, 2026-10-12)
App `Foundry_Demo_adhinan` (`bd13e90e-…`) currently has:
- SPA: `http://localhost:5173`
- Web: `http://localhost:8080` + 6 `global.consent.azure-apim.net` connector URIs

**Entra ignores the port for `localhost` redirect URIs.** When the same app has several
localhost redirect URIs that differ only by port, the sign-in service picks one arbitrarily
and applies **that entry's type**. Here it picks the Web `localhost:8080` entry, so the
authorization code is bound to the Web client type, and redeeming it from the browser
(CORS) fails with 9002326.

Evidence that rules out other causes:
- The authorize step **succeeded** (a code was issued), so redirect-URI matching and **consent are
  not blocking** (correcting my earlier assumption that admin consent was required).
- Redirect type, URI value (no trailing slash), scope name (`SopeAdhinan`, set via
  `VITE_ENTRA_SCOPE_NAME` / `ENTRA_SCOPE_NAME`) and identifier URI are all correct.
- **No local workaround exists:** every `localhost` origin (5173 or 8080) hits the same port-blind
  match, and no non-localhost URI is registered. The app registration **must** be edited.
- The browser never uses 8080 for sign-in: Vite proxies `/api` → `http://localhost:8080`
  ([vite.config.ts:33-39]), so the Web 8080 entry has no purpose here. I wrongly called it harmless earlier.

Constraint (confirmed 2026-10-13): a Graph PATCH removing the URI with your login returned **403 Insufficient privileges**; your account has no directory roles and the app has no owners. **Chosen path: Entra admin removes the URI.**

## Plan
1. **Remove the Web redirect URI `http://localhost:8080`** (the only change).
   Leave all `azure-apim.net` URIs and the SPA `http://localhost:5173` untouched.
   - You: Authentication → Web → tick `http://localhost:8080` → Delete → Save; or
   - Admin request (if greyed out): *"In App registrations → Foundry_Demo_adhinan
     (bd13e90e-2769-450c-9bac-0b90f4327a30) → Authentication, delete the Web redirect URI
     http://localhost:8080 only. Alternatively add me as an Owner of the app."*
2. Wait 2–5 minutes for the change to take effect.
3. **I restart both servers** (they stop when the Claude session ends): free ports 8080/5173
   (only processes from this repo), then `dotnet run --launch-profile http` in `backend/WebApp.Api`
   and `npm run dev -- --strictPort` in `frontend`, then check `/api/health` and the page title "AI Agent".
4. **You sign in in a normal Edge window with your work profile, not InPrivate.** InPrivate
   doesn't carry the Windows device identity, and the error's `capolids` claim shows Conditional
   Access policies apply. First clear stale MSAL state: F12 → Application → Storage → Clear site data
   for localhost:5173.
5. **Optional code improvement** (only if you approve it): in [App.tsx] read `error` from
   `useMsalAuthentication(...)` and show the AADSTS message with a "Try again" button instead of
   the endless spinner. Small change; uses the existing Fluent UI components.

## Verification
- DevTools → Network: the `token` request returns **200** (no 9002326).
- Backend log shows `GET /api/agent` → 200 (token accepted: audience `api://bd13e90e-…`, scope `SopeAdhinan`).
- Chat UI loads with agent `RAK-TA-Fin-Agent`; sending "hello" streams a reply. The backend calls
  Foundry using your `az login` (Foundry User role, already verified).
- If something else fails, paste the AADSTS code:
  `53000/53003` = Conditional Access (device/MFA) → admin; `65001` = consent → admin pre-authorizes the
  client under Expose an API; API 401 → check `scp`/`aud` in the backend log; Foundry 403 → RBAC.

## Notes
- Uncommitted code changes from earlier (configurable scope name; default unchanged):
  `backend/WebApp.Api/Program.cs`, `frontend/src/config/authConfig.ts`, `frontend/src/config/__tests__/authConfig.test.ts`.
- Status: plan not yet approved. On approval, rename to `plans/approved_entra-local-signin-fix.md`.
