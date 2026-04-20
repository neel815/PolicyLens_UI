# 📖 Complete Vercel Deployment Guide for PolicyLens

**Date**: April 17, 2026  
**Status**: Complete & Ready to Deploy  
**Deployment Platform**: Vercel (Frontend) + Railway (Backend)  
**Repository**: https://github.com/neel815/PolicyLens_UI.git

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Account Setup](#account-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Testing & Verification](#testing--verification)
8. [Post-Deployment](#post-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools & Accounts
- ✅ GitHub account with repo: `neel815/PolicyLens_UI`
- ✅ Vercel account (free tier available)
- ✅ Railway account (free tier available)
- ✅ API keys: Groq, Google Gemini
- ✅ Node.js 18+ (for local testing)
- ✅ Python 3.9+ (for local testing)

### Project Status
- ✅ Code is in GitHub repository
- ✅ Next.js frontend in `frontend/` directory
- ✅ FastAPI backend in `backend/` directory
- ✅ PostgreSQL database ready for migration
- ✅ All dependencies in `requirements.txt` and `package.json`

---

## Account Setup

### 1. Vercel Account (2 min)

```bash
# Option A: Sign up at https://vercel.com/signup
# Choose: Sign up with GitHub
# Authorize Vercel to access your GitHub repos
```

**Why GitHub?** Automatic deployment on every push to main branch.

### 2. Railway Account (2 min)

```bash
# Go to https://railway.app/login
# Sign up with GitHub
# Authorize Railway to access your GitHub repos
```

### 3. Get API Keys (5-10 min)

**Groq API Key:**
1. Go to https://console.groq.com
2. Sign up with GitHub
3. Create API key
4. Copy and save (you'll need it later)

**Google Gemini API Key:**
1. Go to https://aistudio.google.com
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and save

---

## Frontend Deployment

### Step 1: Create Vercel Project

1. Open https://vercel.com/new
2. Click **"Continue with GitHub"**
3. Authorize Vercel if prompted
4. Select repository: **neel815/PolicyLens_UI**
5. Click **Import**

### Step 2: Configure Build Settings

When importing, Vercel shows configuration dialog:

| Setting | Value |
|---------|-------|
| **Framework** | Next.js (auto-detected ✓) |
| **Root Directory** | `frontend/` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Development Command** | `npm run dev` |
| **Node Version** | 18.x |

❗ **IMPORTANT**: Set Root Directory to `frontend/` (this is critical!)

### Step 3: Add Environment Variables

**Leave these for now** - we'll add after Railway setup.

For now, click **Deploy** with no environment variables.

### Step 4: Wait for Deployment

- First build takes 2-5 minutes
- You'll see deployment logs
- When complete, you get a public URL like:
  ```
  https://policylens.vercel.app
  ```

✅ **Save this URL** - you'll need it for backend configuration.

---

## Backend Deployment

### Step 1: Create Railway Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Authorize Railway if prompted
4. Select repository: **neel815/PolicyLens_UI**
5. Select branch: **main**
6. Railway auto-detects Python project ✅
7. Click **Deploy**

### Step 2: Add PostgreSQL Database

In Railway project dashboard:

1. Click **Create** (next to "Services")
2. Search for **PostgreSQL**
3. Click **PostgreSQL**
4. Railway creates a new database instance
5. Go to PostgreSQL service → **Variables** tab
6. Copy `DATABASE_URL`

Example format:
```
postgresql://postgres:password123@pg-xxxx.railway.app:5432/railway
```

### Step 3: Configure Backend Environment Variables

Go to FastAPI service in Railway → **Variables** tab

**Click "Add Variable"** and add each:

```
ENV=production
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
```

Generate these using the `generate_env_vars.py` script:

```bash
cd c:\Users\neel8\Desktop\PolicyLens
python generate_env_vars.py
```

This gives you:

```
SECRET_KEY=<generated>
JWT_SECRET=<generated>
DB_PASSWORD=<generated>
GROQ_API_KEY=<your-key>
GOOGLE_GEMINI_API_KEY=<your-key>
DATABASE_URL=<from-postgresql>
CORS_ORIGINS=https://policylens.vercel.app
```

**Add each to Railway variables:**

| Variable | Value | Example |
|----------|-------|---------|
| `ENV` | `production` | `production` |
| `DEBUG` | `false` | `false` |
| `API_HOST` | `0.0.0.0` | `0.0.0.0` |
| `API_PORT` | `8000` | `8000` |
| `LOG_LEVEL` | `INFO` | `INFO` |
| `SECRET_KEY` | (from script) | `abc123...` |
| `JWT_SECRET` | (from script) | `xyz789...` |
| `DB_PASSWORD` | (from script) | `pass123...` |
| `DATABASE_URL` | (from PostgreSQL) | `postgresql://...` |
| `GROQ_API_KEY` | (from console.groq.com) | `gsk_...` |
| `GOOGLE_GEMINI_API_KEY` | (from aistudio.google.com) | `AIzaSy...` |
| `CORS_ORIGINS` | (Vercel URL) | `https://policylens.vercel.app` |

### Step 4: Wait for Backend Deployment

- Railway auto-deploys when you add variables
- Check **Logs** tab for deployment progress
- Should complete in 2-5 minutes
- Look for green checkmark ✅

✅ **Save Railway backend URL**, e.g.:
```
https://policylens-api-prod-xxxx.railway.app
```

### Step 5: Update Frontend with Backend URL

Go back to Vercel project:

1. **Settings** → **Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://policylens-api-prod-xxxx.railway.app
   NEXT_PUBLIC_API_PORT=8000
   ```
3. Save
4. Vercel auto-redeploys ✅

---

## Database Setup

### Step 1: Run Migrations

Install Railway CLI:

```bash
npm install -g @railway/cli
```

Login and connect:

```bash
railway login
cd c:\Users\neel8\Desktop\PolicyLens\backend
railway link
```

Run migrations:

```bash
railway run python -m alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxxx, Initial migration
INFO  [alembic.runtime.migration] Done
```

### Step 2: Verify Database

```bash
railway run python -c "from app.models import User; print('Database connected!')"
```

Should print: `Database connected!` ✅

---

## Environment Variables

### Summary Table

| Platform | Variable | Value |
|----------|----------|-------|
| **Vercel** | `NEXT_PUBLIC_API_BASE_URL` | `https://policylens-api-xxx.railway.app` |
| **Vercel** | `NEXT_PUBLIC_API_PORT` | `8000` |
| **Railway** | `ENV` | `production` |
| **Railway** | `DEBUG` | `false` |
| **Railway** | `DATABASE_URL` | (auto from PostgreSQL) |
| **Railway** | `SECRET_KEY` | (generated) |
| **Railway** | `JWT_SECRET` | (generated) |
| **Railway** | `GROQ_API_KEY` | (from console) |
| **Railway** | `GOOGLE_GEMINI_API_KEY` | (from Google) |
| **Railway** | `CORS_ORIGINS` | `https://policylens.vercel.app` |

---

## Testing & Verification

### Test 1: Frontend is Live

```bash
# Visit Vercel URL
https://policylens.vercel.app
```

✅ Should show PolicyLens UI
✅ No 404 errors

### Test 2: Backend is Live

```bash
# Visit Railway health endpoint
https://policylens-api-xxx.railway.app/api/health
```

✅ Should return:
```json
{"status": "healthy"}
```

### Test 3: API Connectivity

Open Vercel URL in browser:

1. Press **F12** (open DevTools)
2. Go to **Network** tab
3. Click around the app
4. Look for API calls to `policylens-api-xxx.railway.app`
5. Verify status is **200** ✅

### Test 4: Database Connectivity

```bash
railway run python << 'EOF'
from app.db.database import get_db
from sqlalchemy import text

for db in get_db():
    result = db.execute(text("SELECT 1"))
    print("✅ Database connected!")
    break
EOF
```

✅ Should print: `✅ Database connected!`

---

## Post-Deployment

### 1. Monitor & Logs

**Vercel Logs:**
- Dashboard → Project → **Logs**
- Check for errors during builds/requests

**Railway Logs:**
- Dashboard → FastAPI service → **Logs**
- Check for application errors

### 2. Set Up Monitoring (Optional)

Consider adding:
- Error tracking: [Sentry](https://sentry.io)
- Uptime monitoring: [Uptimerobot](https://uptimerobot.com)
- Analytics: [Vercel Analytics](https://vercel.com/analytics)

### 3. Custom Domain (Optional)

**Add custom domain to Vercel:**
1. Settings → Domains
2. Enter your domain
3. Update DNS records
4. Wait for verification (5-30 min)

**For Railway:**
- Settings → Domain
- Add custom domain
- Update DNS records

### 4. Configure CI/CD

Both Vercel and Railway auto-deploy on git push:

```bash
# Push to GitHub
git add .
git commit -m "Production deployment"
git push origin main

# Check deployments
# Vercel Dashboard → Deployments tab
# Railway Dashboard → Logs tab
```

---

## Troubleshooting

### Issue: "API Connection Refused"

**Solution 1: Check Railway URL**
```bash
# Verify Railway URL is correct in Vercel
Settings → Environment Variables → NEXT_PUBLIC_API_BASE_URL
```

**Solution 2: Check Railway Status**
```bash
# Open Railway dashboard
# FastAPI service should have green checkmark
```

**Solution 3: Check CORS**
```bash
# Railway environment variables
CORS_ORIGINS should include: https://policylens.vercel.app
```

---

### Issue: "Build Failed on Vercel"

**Check 1: Root Directory**
```
Settings → General → Root Directory should be: frontend/
```

**Check 2: Dependencies**
```bash
# From frontend directory
npm install
npm run build
```

**Check 3: TypeScript Errors**
```bash
cd frontend
npm run build
# Look for TypeScript errors
```

---

### Issue: "Database Connection Error"

**Check 1: DATABASE_URL**
```
Railway → FastAPI service → Variables
DATABASE_URL should start with: postgresql://
```

**Check 2: Run Migrations**
```bash
railway run python -m alembic upgrade head
```

**Check 3: PostgreSQL Status**
```
Railway → PostgreSQL service should have green checkmark
```

---

### Issue: "Build Failed on Railway"

**Check Logs:**
```
Railway → FastAPI service → Logs
Look for Python errors
```

**Common causes:**
- Missing dependencies in `requirements.txt`
- Python version mismatch
- Invalid environment variables

**Fix:**
```bash
# Update requirements.txt
pip freeze > backend/requirements.txt

# Commit and push
git add backend/requirements.txt
git commit -m "Update dependencies"
git push origin main

# Railway auto-redeploys
```

---

### Issue: "Blank Page on Frontend"

**Check 1: API Base URL**
```
DevTools → Console tab
Look for errors like: "Cannot connect to api..."
```

**Check 2: Environment Variables**
```
Vercel → Settings → Environment Variables
NEXT_PUBLIC_API_BASE_URL should have Railway URL
```

**Check 3: CORS Error in Console**
```
If CORS error: Check CORS_ORIGINS in Railway
Should include your Vercel URL
```

---

## Support & Resources

| Resource | URL |
|----------|-----|
| Vercel Docs | https://vercel.com/docs |
| Railway Docs | https://docs.railway.app |
| Next.js Docs | https://nextjs.org/docs |
| FastAPI Docs | https://fastapi.tiangolo.com |
| Alembic Docs | https://alembic.sqlalchemy.org |

---

## Deployment Checklist

Print this and check off as you go:

- [ ] GitHub repository is up-to-date
- [ ] Vercel project created
- [ ] Vercel root directory set to `frontend/`
- [ ] Vercel deployed successfully
- [ ] Railway project created
- [ ] Railway PostgreSQL added
- [ ] Railway environment variables configured
- [ ] Railway deployed successfully
- [ ] Database migrations run
- [ ] Frontend → Backend API working
- [ ] Health endpoints responding
- [ ] No errors in logs
- [ ] CORS properly configured
- [ ] API keys properly set
- [ ] All tests passing

---

## 🎉 You're Done!

Your PolicyLens application is now:
- ✅ Deployed to Vercel (https://policylens.vercel.app)
- ✅ Running on Railway (https://policylens-api-xxx.railway.app)
- ✅ Connected to PostgreSQL database
- ✅ Auto-deploying on git push
- ✅ Monitoring and logging enabled

**Next steps:**
- Monitor logs regularly
- Add custom domain (optional)
- Set up alerts (optional)
- Collect user feedback
- Plan for scaling

---

**Last Updated**: April 17, 2026
**Created by**: PolicyLens Deployment Team
