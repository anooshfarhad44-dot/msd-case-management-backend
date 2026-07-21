# MSD CMS — Backend API

Pure Node.js + Express + MongoDB REST API for MSD Case Management System.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Make sure MongoDB is running on localhost:27017

# 3. Seed the database (creates all users)
npm run seed

# 4. Start dev server
npm run dev
```

API runs on: `http://localhost:5000`

---

## Seeded Users (password: `MsdCms2026!`)

| Role        | Email                             | Name              |
|-------------|-----------------------------------|-------------------|
| director    | director@msdsolicitors.co.uk      | Mohsin Masaud     |
| supervisor  | supervisor@msdsolicitors.co.uk    | Naveed Ahmed      |
| fee_earner  | solicitor@msdsolicitors.co.uk     | Hassan Ali        |
| admin       | admin@msdsolicitors.co.uk         | Izzah Amal        |
| admin       | admin2@msdsolicitors.co.uk        | Zenab Hussain     |
| compliance  | compliance@msdsolicitors.co.uk    | Naveed Compliance |
| sales       | sales@msdsolicitors.co.uk         | Zaheer Khan       |
| client      | client@msdsolicitors.co.uk        | Demo Client       |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint    | Auth | Description                     |
|--------|-------------|------|---------------------------------|
| POST   | /login      | ✗    | Login → returns JWT + cookie    |
| POST   | /logout     | ✗    | Clears auth cookie              |
| GET    | /me         | ✓    | Get current user                |
| POST   | /refresh    | ✓    | Issue fresh token               |

### Users — `/api/users` (director/admin only)
| Method | Endpoint        | Description             |
|--------|-----------------|-------------------------|
| GET    | /               | List all users          |
| POST   | /               | Create a user           |
| PATCH  | /:id/status     | Toggle active/inactive  |

### Health
```
GET /api/health
```

---

## Project Structure

```
src/
├── config/
│   └── db.js               ← MongoDB connection
├── controllers/
│   ├── authController.js   ← login, logout, me, refresh
│   └── userController.js   ← CRUD users
├── middleware/
│   ├── auth.js             ← JWT authenticate + authorize
│   └── errorHandler.js     ← global error + 404
├── models/
│   └── User.js             ← Mongoose schema + bcrypt
├── routes/
│   ├── auth.js
│   └── users.js
├── scripts/
│   └── seed.js             ← DB seeder
├── utils/
│   └── jwt.js              ← sign/verify helpers
├── app.js                  ← Express setup
└── server.js               ← Entry point ← START HERE
```
