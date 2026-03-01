# LOMS (Law Office Management System)

Full-stack application for case, client, document, fee, and user management.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma, MySQL
- Frontend: React, Vite, TypeScript, Tailwind CSS

## Project Structure

- `backend/` API server
- `frontend/` web application

## 1) Run Locally

### Requirements

- Node.js 20+
- npm 10+
- MySQL 8+

### Backend setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

### Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default local URLs:

- Backend: `http://localhost:5001`
- Frontend: `http://localhost:3000`

## 2) Publish to GitHub

From repository root:

```bash
git init
git add .
git commit -m "Initial publish-ready LOMS"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Before pushing, verify:

- `.env` files are not tracked
- Secrets are not hardcoded
- Database credentials are only in deployment environment variables

## 3) Deploy Online (Recommended)

### Backend on Render (or Railway)

1. Create a new Web Service from the `backend/` folder.
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT` (provided by platform, optional)
   - `HOST=0.0.0.0`
   - `CORS_ORIGIN=https://<your-frontend-domain>`
5. Run database migrations once:
   - `npx prisma migrate deploy`

### Frontend on Vercel (or Netlify)

1. Import the repository and set root directory to `frontend/`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable:
   - `VITE_API_URL=https://<your-backend-domain>/api`

## 4) CI (GitHub Actions)

CI workflow runs on every push/PR:

- Backend: install + build
- Frontend: install + build

See `.github/workflows/ci.yml`.

## Notes

- For production, use a strong `JWT_SECRET` (at least 32 random chars).
- Keep `DATABASE_URL` and all secrets only in platform environment settings.
- If CORS errors occur in production, update `CORS_ORIGIN` to your exact frontend URL.
