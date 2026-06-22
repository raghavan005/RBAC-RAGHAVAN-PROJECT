# Setup Guide

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A MongoDB Atlas account (or local MongoDB)
- Git

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Raghavan-RBAC-Project
```

---

## 2. Backend Setup

### Install dependencies

```bash
cd backend
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/companydb?retryWrites=true&w=majority

# JWT secrets — use long random strings in production
JWT_SECRET=your-very-strong-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-very-strong-refresh-secret-min-32-chars

# Frontend origin(s) allowed to call the API (comma-separated, no trailing slash)
ALLOWED_ORIGINS=http://localhost:3000
```

**Generating secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`.

### Start the backend

```bash
npm run dev
```

You should see:
```
MongoDB connected
Server running on http://localhost:5000
Swagger docs at http://localhost:5000/api/docs
```

---

## 3. Frontend Setup

### Install dependencies

```bash
# from the project root
npm install
```

### Configure environment

```bash
cp .env.sample .env.local
```

The default `.env.local` content:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

If your backend runs on a different port or host, update this value.

### Start the frontend

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 4. Running Both Simultaneously

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd /path/to/Raghavan-RBAC-Project/backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd /path/to/Raghavan-RBAC-Project
npm run dev
```

> Always start the backend first.

---

## 5. Running Tests

```bash
cd backend
npm test                   # run all 31 tests
npm run test:coverage      # with coverage report
```

Tests use an in-memory MongoDB instance (via `mongodb-memory-server`) — no Atlas connection required.

---

## 6. Production Build

### Backend
```bash
cd backend
npm run build      # compiles TypeScript → dist/
npm start          # runs dist/server.js
```

### Frontend
```bash
# from project root
npm run build
npm start
```

---

## 7. MongoDB Atlas Setup (if starting fresh)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and create a free cluster.
2. Under **Database Access**, create a user with read/write permissions.
3. Under **Network Access**, add `0.0.0.0/0` (or your server IP) to the allowlist.
4. Click **Connect → Drivers** and copy the connection string.
5. Replace `<username>`, `<password>`, and set the database name to `companydb`.
6. Paste the full URI into `backend/.env` as `MONGODB_URI`.

---

## 8. Accessing Swagger UI

With the backend running, open:

```
http://localhost:5000/api/docs
```

To test protected endpoints:
1. Register or login via `/auth/register` or `/auth/login`.
2. Copy the `accessToken` from the response.
3. Click **Authorize** (🔒) at the top of the Swagger UI.
4. Paste the token (without `Bearer ` prefix) and click **Authorize**.

---

## 9. Deployment Checklist

- [ ] Set `NODE_ENV=production` on the backend
- [ ] Use strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `ALLOWED_ORIGINS` to your exact frontend domain
- [ ] Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
- [ ] Ensure MongoDB Atlas network access allows your server IP
- [ ] Enable HTTPS (the refresh cookie uses `Secure: true` in production)
