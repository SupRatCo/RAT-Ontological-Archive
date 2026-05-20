# Local Setup

## Backend

```bash
cd server
npm install
cp .env.example .env
npm run migrate
npm start
```

The backend runs on `http://localhost:3000`.

`DATABASE_URL` is required for real persistence. Without it the API starts, but database-backed routes return clear errors.

## Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The frontend runs on `http://localhost:5173`.

Set:

```txt
VITE_API_URL=http://localhost:3000
```

## Health Check

Open:

```txt
http://localhost:3000/api/health
```
