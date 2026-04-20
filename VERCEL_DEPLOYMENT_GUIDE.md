# PolicyLens - Vercel Deployment Guide

## Overview
- **Frontend**: Deploy to Vercel (Next.js)
- **Backend**: Deploy to Railway (FastAPI)
- **Database**: PostgreSQL on Railway
- **Repository**: https://github.com/neel815/PolicyLens_UI.git

---

## 📋 Prerequisites Checklist

- [ ] GitHub repository pushed (https://github.com/neel815/PolicyLens_UI.git)
- [ ] Vercel account created (https://vercel.com)
- [ ] Railway account created (https://railway.app)
- [ ] Node.js 18+ installed locally
- [ ] Python 3.9+ installed locally
- [ ] Git installed and configured

---

## 🚀 Part 1: Frontend Deployment to Vercel

### Step 1: Connect GitHub to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. Select the **PolicyLens_UI** repository
5. Click **Import**

### Step 2: Configure Vercel Project

When importing, Vercel will detect it's a Next.js project. Configure as follows:

**Build Settings:**
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

**Root Directory**: Set to `frontend/` (since your Next.js app is in a subdirectory)

### Step 3: Set Environment Variables

Add these environment variables in Vercel project settings (Settings → Environment Variables):

```
NEXT_PUBLIC_API_BASE_URL=https://<your-backend-railway-url>.railway.app
NEXT_PUBLIC_API_PORT=8000
```

**Note**: Replace `<your-backend-railway-url>` with your actual Railway backend URL (you'll get this after Railway setup)

### Step 4: Deploy

Click **Deploy** button. Vercel will:
- Build the Next.js frontend
- Deploy to CDN
- Provide you with a public URL (e.g., policylens.vercel.app)

---

## 🚄 Part 2: Backend Deployment to Railway

### Step 1: Prepare Backend for Railway

Your backend is already configured. Key files that will be used:

- `backend/Procfile` - Deployment instructions
- `backend/requirements.txt` - Python dependencies
- `backend/railway.json` - Railway configuration
- `backend/railway.toml` - Railway settings

### Step 2: Create Railway Project

1. Go to [https://railway.app](https://railway.app)
2. Sign up/Log in with GitHub
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. Authorize Railway to access GitHub
6. Select **neel815/PolicyLens_UI** repository

### Step 3: Configure Railway Variables

Railway will ask for configuration. Select your repository and branch (main).

After connecting, add these environment variables in Railway project settings:

```
# Environment
ENV=production
DEBUG=false

# Database (Railway will provide these after PostgreSQL setup)
DATABASE_URL=postgresql://user:password@localhost:5432/policylens_db
DB_HOST=your-railway-db-host
DB_PORT=5432
DB_NAME=policylens_db
DB_USER=postgres
DB_PASSWORD=<random-secure-password>

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
RAILWAY_ENVIRONMENT=production

# JWT Secrets
SECRET_KEY=<generate-secure-key>
JWT_ALGORITHM=HS256

# API Keys (Get from your services)
GROQ_API_KEY=<your-groq-key>
GOOGLE_GEMINI_API_KEY=<your-gemini-key>

# CORS Configuration
CORS_ORIGINS=https://policylens.vercel.app,https://your-custom-domain.com

# Logging
LOG_LEVEL=INFO
```

### Step 4: Add PostgreSQL Service in Railway

1. In your Railway project, click **Create**
2. Select **PostgreSQL**
3. Railway will create a new PostgreSQL instance
4. Copy the generated `DATABASE_URL` from the PostgreSQL service variables
5. Set it as an environment variable in the FastAPI service

### Step 5: Deploy Backend

1. Go to the FastAPI service in Railway
2. Click **Deploy** (Railway auto-deploys on git push)
3. Monitor the deployment logs
4. Once deployed, copy the Railway service URL (e.g., `https://policylens-api-prod.railway.app`)

### Step 6: Update Vercel Environment Variable

Go back to Vercel and update:
```
NEXT_PUBLIC_API_BASE_URL=<your-railway-url>
```

Example: `https://policylens-api-prod.railway.app`

---

## 🗄️ Part 3: Database Migrations

After PostgreSQL is running on Railway:

### Option A: Run Migrations via Railway CLI

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Connect to project: `railway link`
4. Run migrations:
   ```bash
   railway run python -m alembic upgrade head
   ```

### Option B: Manual Migration in Railway Shell

1. In Railway PostgreSQL service, open **Shell**
2. Run migrations via the backend service shell:
   ```bash
   railway run python backend/alembic/verify_migration.py
   ```

---

## 🔄 Continuous Deployment

Both Vercel and Railway are now connected to your GitHub repository:

- **Push to main branch** → Automatic deployment to both services
- **View deployments** in each platform's dashboard
- **Rollback** by selecting previous deployment if needed

---

## 📊 Environment Variables Summary

### Vercel (Frontend Environment)
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_API_PORT=8000
```

### Railway (Backend Environment)
```env
ENV=production
DEBUG=false
DATABASE_URL=postgresql://...
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=<secure-key>
GROQ_API_KEY=<your-key>
GOOGLE_GEMINI_API_KEY=<your-key>
CORS_ORIGINS=https://policylens.vercel.app
```

---

## 🔐 Security Checklist

- [ ] All API keys are in environment variables (not in code)
- [ ] CORS_ORIGINS are properly configured
- [ ] Database password is strong and random
- [ ] JWT secrets are secure
- [ ] HTTPS is enabled (automatic with both Vercel and Railway)
- [ ] DEBUG is set to `false` in production
- [ ] No sensitive data in logs

---

## 🧪 Testing Deployment

### Frontend
1. Visit your Vercel URL (e.g., `https://policylens.vercel.app`)
2. Verify UI loads correctly
3. Open browser DevTools → Network tab
4. Check that API calls go to Railway backend

### Backend
1. Visit `https://your-backend-url/api/health`
2. Should return: `{"status": "healthy"}`
3. Check `/api/health/detailed` for detailed status

---

## 📱 Post-Deployment

### Monitor Logs
- **Vercel**: Settings → Function Logs
- **Railway**: Service → Logs tab

### Custom Domain (Optional)
- **Vercel**: Settings → Domains
- **Railway**: Settings → Domain

### SSL/HTTPS
- Both Vercel and Railway provide automatic SSL certificates

---

## 🆘 Troubleshooting

### "API Connection Refused"
- Check Railway backend is running (green status)
- Verify `NEXT_PUBLIC_API_BASE_URL` in Vercel
- Check CORS settings in Railway backend

### "Database Connection Error"
- Verify `DATABASE_URL` is correct in Railway
- Run migrations: `railway run python -m alembic upgrade head`
- Check PostgreSQL service is running

### "Build Failed on Vercel"
- Check build logs in Vercel dashboard
- Verify `frontend/package.json` has all dependencies
- Check for TypeScript errors: `npm run build`

### "Build Failed on Railway"
- Check Python version requirement
- Verify `backend/requirements.txt` is complete
- Check `Procfile` format (no trailing spaces)

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

## 🎯 Next Steps

1. ✅ Create Vercel account & import GitHub repo
2. ✅ Create Railway account & add PostgreSQL
3. ✅ Configure environment variables in both platforms
4. ✅ Run database migrations
5. ✅ Test API connectivity
6. ✅ Monitor logs in both dashboards
7. ✅ (Optional) Add custom domains
8. ✅ (Optional) Set up monitoring & alerts

---

**Last Updated**: April 17, 2026
**Status**: Ready for Deployment
