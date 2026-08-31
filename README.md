# RemoteReady — Remote Job Application Assistant

RemoteReady is an MVP for finding remote jobs, measuring job fit, tailoring a truthful CV, preparing an application email, sending an approved application through Gmail, and tracking its outcome.

## MVP features

- Firebase email/password and Google authentication
- Career profile, master CV upload/review, and job preferences
- Remote job discovery, filtering, saved jobs, and match analysis
- Job-specific CV tailoring and PDF export
- Editable application emails with explicit review and approval
- Gmail OAuth sending with an attached tailored CV
- Application tracker, status timeline, and dashboard

## Technology

- Frontend: React, Vite, React Router, Firebase Auth
- Backend: Node.js, Express, MongoDB/Mongoose, Firebase Admin
- Integrations: Gemini, Gmail OAuth, remote-job APIs
- Recommended hosting: Vercel (frontend), Railway (backend), MongoDB Atlas

## Local setup

Requirements: Node.js 20 or newer and a MongoDB database.

1. Run `npm install`, `npm install --prefix client`, and `npm install --prefix server`.
2. Copy `client/.env.example` to `client/.env` and enter the Firebase web credentials.
3. Copy `server/.env.example` to `server/.env` and enter the server credentials.
4. Run `npm run dev` from the repository root.

Adzuna is an optional job source. Register for API credentials, then add these values to `server/.env`:

```env
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
ADZUNA_COUNTRY=us
```

Adzuna does not currently expose a Nigerian (`ng`) API market. `ADZUNA_COUNTRY` therefore defaults to its supported US market (`us`) so Adzuna salary figures are returned in USD. RemoteReady keeps only remote listings explicitly open to Nigeria, worldwide, anywhere, global, or Africa-wide candidates. If the credentials are omitted, Adzuna is skipped and the other job sources continue normally; the dedicated jobdataAPI source continues to supply Nigeria-specific listings.

Frontend: `http://localhost:5173`  
API health check: `http://localhost:5000/api/health`

Never commit `.env` files, Firebase private keys, OAuth client secrets, or database credentials.

## Quality checks

```bash
npm test
npm run build
```

`npm test` runs the backend service/API tests and frontend ESLint. The build command creates the production frontend in `client/dist`.

## Production deployment

### 1. MongoDB Atlas

1. Create a production database user with a strong, unique password.
2. In Atlas Network Access, allow the Railway service to connect. Prefer a fixed outbound IP restriction when the hosting plan provides one.
3. Put the production connection string in Railway as `MONGODB_URI`.
4. Confirm the backend starts without a database connection error.

### 2. Backend on Railway

Create a Railway project and add a service from this GitHub repository. Leave the service root at the repository root (`/`).

- Generate a public domain under Settings → Networking

The included root `railway.json` installs only the server production dependencies, starts the API with `npm start --prefix server`, and checks `/api/health`. Railway supplies the `PORT` variable automatically. Do not set Railway's build command to `npm run build`; that command builds the separate Vercel frontend.

In the Railway service Variables tab, add every variable from `server/.env.example`. Production-specific values are:

```env
NODE_ENV=production
CLIENT_URL=https://remote-job-assistant-ba96.vercel.app,https://remote-job-assistant-ba96-git-main-tommys-projects-b8fc9b54.vercel.app
GOOGLE_REDIRECT_URI=https://YOUR-RAILWAY-DOMAIN/api/email/google/callback
```

`CLIENT_URL` accepts comma-separated origins. Do not add paths or trailing slashes. Preserve the complete `FIREBASE_PRIVATE_KEY`, including newline escapes. Generate independent long random values for both Google secrets; changing the token encryption key invalidates stored Gmail tokens.

After deployment, confirm `https://YOUR-RAILWAY-DOMAIN/api/health` returns `{"status":"ok"}`. If startup fails, check Railway deployment logs first for MongoDB access or malformed Firebase private-key errors.

### 3. Frontend on Vercel

The included `vercel.json` builds `client` and supports React Router refreshes. Import the repository and add all values from `client/.env.example`.

```env
VITE_API_URL=https://YOUR-RAILWAY-DOMAIN/api
```

Redeploy after changing a `VITE_` value because Vite embeds it during the build.

### 4. Firebase production domains

In Firebase Console → Authentication → Settings → Authorized domains, add the Vercel hostname and any custom frontend domain. Confirm Email/Password and Google providers are enabled. Frontend and backend Firebase credentials must belong to the same project.

### 5. Google OAuth callback

In Google Cloud Console, configure a Web application OAuth client with this exact Authorized redirect URI:

```text
https://YOUR-RAILWAY-DOMAIN/api/email/google/callback
```

It must exactly equal `GOOGLE_REDIRECT_URI`. Add the frontend origin under Authorized JavaScript origins. While the consent screen is in Testing, add every tester under Test users; otherwise Google returns `403 access_denied`. Public access to the Gmail send scope may require Google verification.

## Acceptance test

Use a new account and a private browser window. Repeat key screens at 320 px, 375 px, 768 px, and desktop width.

1. Register, sign out, and sign back in.
2. Complete the profile and confirm saving shows the completed profile.
3. Upload a PDF/DOCX CV, review and edit parsed data, then save it.
4. Save preferences and confirm the dashboard opens.
5. Refresh/filter jobs, save one, and analyze its match.
6. Tailor a CV; confirm it remains truthful, then download the PDF.
7. Generate/edit the email and confirm or enter the recipient.
8. Review and approve it; confirm nothing sends before approval.
9. Connect Gmail, send, and verify delivery plus attachment in Gmail Sent.
10. Confirm the tracker record, update its status, and check its timeline/dashboard.
11. Prepare a small batch; confirm every job gets separate assets and approval.
12. Confirm signed-out route protection, route refreshes, and absence of console errors, failed requests, clipping, or horizontal scrolling.

## Release checklist

- [ ] MongoDB Atlas production access confirmed from Railway
- [ ] Backend deployed and health endpoint passes
- [ ] Frontend deployed and routes refresh correctly
- [ ] Production CORS and `VITE_API_URL` use final domains
- [ ] Firebase production domains configured
- [ ] Google callback URI configured exactly
- [ ] OAuth test users or verified consent configured
- [ ] Clean-account acceptance test completed
- [ ] Mobile acceptance test completed
- [x] Automated tests, lint, and production build pass locally
