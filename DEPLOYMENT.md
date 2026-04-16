# Deployment guide — MongoDB Atlas + Render + Heroku

Summary
- This project's backend lives in the `server/` directory. Use MongoDB Atlas for the database and Render/Heroku for hosting.

## MongoDB Atlas
- Create a cluster (if not already created).
- In *Database Access* create a database user (username + password).
- In *Network Access* add an IP allowlist entry. For initial deploy you can add `0.0.0.0/0` (less secure) or the specific outbound IPs from Render/Heroku.
- Copy the connection string (SRV). Example:

  mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/ecommerce?retryWrites=true&w=majority

## Render Deployment
### Backend (Web Service)
- In Render, create a new **Web Service** connected to your GitHub repo.
- Settings to use (or set in `render.yaml`):
  - Root Directory: `server`
  - Environment: `Node`
  - Build Command: `cd server && npm install`
  - Start Command: `cd server && npm start`
  - Branch: the branch you want to deploy (e.g., `main`)

Environment variables (set in Render dashboard):
- `MONGODB_URI` — Paste your Atlas connection string.
- `JWT_SECRET` — A long random secret string.
- `NODE_ENV` — `production`
- `PORT` — `5000` (optional)

### Frontend (Static Site)
- In Render, create a new **Static Site** connected to the same repo.
- Settings:
  - Root Directory: `frontend`
  - Build Command: `cd frontend && npm install && npm run build`
  - Publish Directory: `frontend/dist`
  - Branch: `main`

Environment variables:
- `VITE_API_URL` — URL of your deployed backend (e.g., https://your-backend.onrender.com)

## Heroku Deployment
### Backend
- Install Heroku CLI and login.
- In `server/` directory:
  ```bash
  heroku create your-app-name
  heroku config:set MONGODB_URI="your_atlas_connection_string"
  heroku config:set JWT_SECRET="your_secret"
  heroku config:set NODE_ENV=production
  git push heroku main
  ```

### Frontend
- For static frontend, use Heroku's Node buildpack to build and serve.
- In `frontend/` directory, add a `Procfile`:
  ```
  web: npm run preview
  ```
- Then:
  ```bash
  heroku create your-frontend-app
  heroku config:set VITE_API_URL="your_backend_url"
  git push heroku main
  ```

## Repository Hygiene
- Do NOT commit sensitive values. `.gitignore` ignores `server/.env`.
- Copy `server/.env.example` → `server/.env` for local dev.

## Local Dev
- In `server/`:
  ```bash
  npm install
  npm start
  ```
- In `frontend/`:
  ```bash
  npm install
  npm run dev
  ```

Notes
- Update `render.yaml` with your repo details if needed.
- For Heroku, ensure Procfile is in `server/` for backend deploy.
