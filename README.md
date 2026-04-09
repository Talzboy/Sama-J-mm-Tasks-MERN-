# Sama Jamm Tasks

Full-stack task manager with authentication, personalized task lists, deadlines, and progress tracking.

## Features

- User registration and login with JWT authentication
- Protected APIs and UI routes
- Personalized tasks per user
- Task CRUD (create, update, delete, list)
- Task deadline and priority support
- Progress and overdue indicators
- Search, filter, and sort in dashboard UI

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT + bcrypt

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- Axios

## Project Structure

- backend: API and database layer
- frontend: React user interface

## Prerequisites

- Node.js 18+
- npm 9+

## Setup and Run

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure backend environment

Create backend/.env with:

```env
PORT=5000
JWT_SECRET=replace_with_a_secure_secret
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/sama_jamm_tasks
```

### 3. Start backend

```bash
cd backend
npm run dev
```

Backend runs on http://localhost:5000.

### 4. Start frontend

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173.

## Available Scripts

### Backend

- npm run dev: run API with nodemon
- npm run start: run API once
- npm run test: run automated auth/tasks tests

### Frontend

- npm run dev: run Vite dev server
- npm run build: type-check and production build
- npm run preview: preview production build

## API Overview

### Auth

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Tasks (requires Authorization: Bearer <token>)

- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

## Sorting Options in Dashboard

- Newest first
- Oldest first
- Deadline soonest
- Deadline latest
- Priority high to low
- Priority low to high

## Filtering and Search in Dashboard

- Filter by status: Pending, In Progress, Completed
- Search tasks by title or description (case-insensitive)
- Filtering, search, and sorting are combined in real time in the task list view

## Testing

Run backend tests:

```bash
cd backend
npm test
```

The test suite validates:

- Auth flow (register/login/me)
- Duplicate registration guard
- User task isolation
- Task create/update/delete lifecycle

## Notes

- Ensure MongoDB is running locally before starting the backend.
- For production, set a strong JWT_SECRET and update CORS origin.

## Deployment and Finalization (Netlify)

Netlify is used for the frontend deployment. The backend API should be deployed to a Node.js host (for example Render, Railway, or Fly.io).

### 1. Prepare production environment variables

Backend environment variables (see [backend/.env.example](backend/.env.example)):

- PORT
- JWT_SECRET
- NODE_ENV=production
- MONGODB_URI
- CORS_ORIGIN=https://your-netlify-site.netlify.app

Frontend environment variables (see [frontend/.env.example](frontend/.env.example)):

- VITE_API_BASE_URL=https://your-backend-api.example.com/api

### 2. Deploy backend API

Deploy [backend](backend) on your backend hosting platform.

- Build/install command: npm install
- Start command: npm run start
- Set backend environment variables from [backend/.env.example](backend/.env.example)
- Confirm health endpoint works: GET /api/health

### 2.1 Deploy backend on Render (recommended)

Option A: Blueprint deploy (fastest)

1. Push this repository to GitHub.
2. In Render dashboard, click New + and choose Blueprint.
3. Select your repository.
4. Render will detect [render.yaml](render.yaml) and create the web service automatically.
5. Open the created service and set secret env vars:
	- JWT_SECRET
	- MONGODB_URI
	- CORS_ORIGIN (set this to your Netlify site URL)
6. Trigger deploy.

Option B: Manual Render setup

1. New + -> Web Service.
2. Connect repository.
3. Configure service:
	- Root Directory: backend
	- Runtime: Node
	- Build Command: npm install
	- Start Command: npm run start
4. Add env vars:
	- NODE_ENV=production
	- JWT_SECRET=your_secret
	- MONGODB_URI=your_mongodb_connection_string
	- CORS_ORIGIN=https://your-netlify-site.netlify.app
5. Deploy and verify [health endpoint](https://example.com/api/health).

### 3. Deploy frontend on Netlify

Deploy [frontend](frontend) to Netlify.

- Build command: npm run build
- Publish directory: dist
- Netlify config file already added: [frontend/netlify.toml](frontend/netlify.toml)
- Add env var in Netlify dashboard:
	- VITE_API_BASE_URL=https://your-backend-api.example.com/api

Netlify setup values:

- Base directory: frontend
- Build command: npm run build
- Publish directory: dist

The SPA redirect rule is included in [frontend/netlify.toml](frontend/netlify.toml) so routes like /login and /dashboard work after refresh.

### 4. Final round of testing after deployment

1. Open the Netlify URL.
2. Register a new account.
3. Log in and create a task.
4. Edit task title, description, and deadline.
5. Delete a task.
6. Validate filtering (status), search (title/description), and sorting (deadline/priority).
7. Confirm users can only access their own tasks.

### 5. Local verification commands

Backend tests:

```bash
cd backend
npm test
```

Frontend build:

```bash
cd frontend
npm run build
```
