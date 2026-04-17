# 🚀 Quick Start: Deploy to Vercel in 5 Steps

**Your GitHub**: https://github.com/neel815/PolicyLens_UI.git

---

## Step 1️⃣: Generate Secure Keys (5 min)

```bash
# From project root
python generate_env_vars.py
```

This creates secure keys you'll need. **Save the output!**

---

## Step 2️⃣: Deploy Frontend to Vercel (10 min)

1. Go to **https://vercel.com/new**
2. Click **"Continue with GitHub"** → Authorize
3. Select repository: **neel815/PolicyLens_UI**
4. Click **Import**

**Configure:**
- Root Directory: `frontend/` ✅
- Framework: Next.js (auto-detected)
- Click **Deploy**

**Result**: You get a URL like `https://policylens.vercel.app`

---

## Step 3️⃣: Set Up Backend on Railway (15 min)

1. Go to **https://railway.app**
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub**
4. Select: **neel815/PolicyLens_UI**
5. Railway auto-detects Python backend ✅

---

## Step 4️⃣: Add PostgreSQL Database (5 min)

In Railway project:
1. Click **Create** → Select **PostgreSQL**
2. Railway creates database
3. Copy `DATABASE_URL` from PostgreSQL variables
4. Paste as Railway backend variable

---

## Step 5️⃣: Connect Everything (10 min)

### In Railway (Backend Service):

Add these variables:
```
ENV=production
DEBUG=false
SECRET_KEY=<from-step-1>
JWT_SECRET=<from-step-1>
DB_PASSWORD=<from-step-1>
DATABASE_URL=<from-postgresql>
GROQ_API_KEY=<your-key>
GOOGLE_GEMINI_API_KEY=<your-key>
CORS_ORIGINS=https://policylens.vercel.app
```

**Wait for Railway deployment** (green checkmark ✅)

Copy Railway URL (e.g., `https://policylens-api-xxxx.railway.app`)

### In Vercel (Frontend):

Go to project **Settings** → **Environment Variables** → Add:
```
NEXT_PUBLIC_API_BASE_URL=<your-railway-url>
NEXT_PUBLIC_API_PORT=8000
```

Vercel auto-redeployment will happen ✅

---

## 🎉 Done! 

Test:
- ✅ Visit your Vercel URL
- ✅ Open DevTools → Network tab
- ✅ API calls should go to Railway
- ✅ Check `https://your-railway-url/api/health`

---

## 🆘 Getting API Keys

| Service | Get Key From | Save As |
|---------|-------------|---------|
| Groq | https://console.groq.com | `GROQ_API_KEY` |
| Google Gemini | https://aistudio.google.com | `GOOGLE_GEMINI_API_KEY` |

---

## 📞 Need Help?

- **Vercel Build Failed?** → Check [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)
- **API Not Connecting?** → Check CORS_ORIGINS setting
- **Database Issues?** → Run `railway run python -m alembic upgrade head`

**Full Guide**: See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)
