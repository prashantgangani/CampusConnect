# CampusConnect

## Deployment Setup

This project is configured for:
- Frontend (`client`) on Vercel
- Backend (`server`) on Render

### 1) Deploy Backend on Render

Set Render service root to `server` and start command:

```bash
npm start
```

Set backend environment variables on Render:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
```

After deploy, note your Render backend URL, for example:

```text
https://campusconnect-api.onrender.com
```

### 2) Deploy Frontend on Vercel

Set Vercel project root to `client`.

Set frontend environment variable on Vercel:

```env
VITE_API_URL=https://campusconnect-api.onrender.com
```

`VITE_API_URL` can be base domain or include `/api`; the client normalizes both formats.

### 3) Local Development

Use:
- `client/.env` based on `client/.env.example`
- `server/.env` based on `server/.env.example`

Default local values:

```env
# client/.env
VITE_API_URL=http://localhost:5000
```

```env
# server/.env
PORT=5000
CLIENT_ORIGINS=http://localhost:5173
```