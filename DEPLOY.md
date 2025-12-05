# Railway Deployment Guide

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository with your code

## Step 1: Create Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

## Step 2: Add MongoDB Database

1. In your Railway project, click "New" → "Database" → "MongoDB"
2. Railway will provision a MongoDB instance
3. Copy the `MONGODB_URL` from the MongoDB service variables

## Step 3: Add Redis (Optional)

1. Click "New" → "Database" → "Redis"
2. Copy the `REDIS_URL` from the Redis service variables

## Step 4: Deploy Backend Service

1. Click "New" → "GitHub Repo" → Select your repo
2. In Settings:
   - Set "Root Directory" to `/` (or leave empty)
   - Set "Dockerfile Path" to `Dockerfile.backend`
3. Add Environment Variables:
   ```
   MONGODB_URL=<from step 2>
   MONGODB_DB_NAME=gamified_productivity
   REDIS_URL=<from step 3, or remove if not using>
   JWT_SECRET_KEY=<generate a secure random string>
   GOOGLE_CLIENT_ID=<your Google OAuth client ID>
   GOOGLE_CLIENT_SECRET=<your Google OAuth secret>
   GOOGLE_REDIRECT_URI=https://<your-backend-domain>/auth/google/callback
   GEMINI_API_KEY=<your Gemini API key>
   CORS_ORIGINS=https://<your-frontend-domain>
   FRONTEND_URL=https://<your-frontend-domain>
   DEBUG=false
   ```
4. Generate a domain in Settings → Networking → Generate Domain

## Step 5: Deploy Frontend Service

1. Click "New" → "GitHub Repo" → Select your repo again
2. In Settings:
   - Set "Root Directory" to `/` (or leave empty)
   - Set "Dockerfile Path" to `Dockerfile.frontend`
3. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://<your-backend-domain>
   ```
4. Add Build Arguments (in Settings → Build):
   ```
   NEXT_PUBLIC_API_URL=https://<your-backend-domain>
   ```
5. Generate a domain in Settings → Networking → Generate Domain

## Step 6: Update Google OAuth

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your Railway backend domain to:
   - Authorized JavaScript origins: `https://<your-frontend-domain>`
   - Authorized redirect URIs: `https://<your-backend-domain>/auth/google/callback`

## Step 7: Update CORS

Make sure your backend's `CORS_ORIGINS` includes your frontend domain.

## Environment Variables Reference

### Backend
| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name (default: gamified_productivity) |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET_KEY` | Secret for JWT tokens (use a long random string) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |
| `FRONTEND_URL` | Frontend URL for OAuth redirects |
| `DEBUG` | Set to `false` in production |

### Frontend
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGINS` in backend includes your frontend URL
- Don't include trailing slashes

### OAuth Not Working
- Verify redirect URI matches exactly in Google Console and backend env
- Ensure frontend domain is in authorized JavaScript origins

### Database Connection Issues
- Check MongoDB URL is correct
- Ensure network connectivity between services

## API Configuration

All frontend API calls now use the centralized configuration in `frontend/lib/api.ts`. The API URL is determined by the `NEXT_PUBLIC_API_URL` environment variable, defaulting to `http://localhost:8000` for local development.

## Quick Deploy Commands

If using Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```
