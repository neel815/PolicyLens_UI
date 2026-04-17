# PolicyLens Project Setup Guide

## ✅ What's Been Completed

- ✅ Frontend (Next.js) initialized
- ✅ Backend (FastAPI) structure created
- ✅ Database configuration ready
- ✅ PostgreSQL database created: `policylens`

---

## 🗄️ Database Setup

### Option 1: Using Docker Compose (Recommended)

**Prerequisites**: Docker & Docker Compose installed

```bash
# From the PolicyLens root directory
docker-compose up -d

# This will start:
# - PostgreSQL on port 5432
# - Adminer on port 8080
```

**Access Adminer**:
- URL: http://localhost:8080
- Server: postgres (or use container name)
- Username: postgres
- Password: root@123
- Database: policylens

### Option 2: Local PostgreSQL Setup

**Database already created!** ✅

If you installed PostgreSQL locally:
```bash
# Verify connection
psql -U postgres -h 127.0.0.1 -d policylens
```

**Access Database Management**:
1. **pgAdmin** (if installed):
   - Setup new server connection
   - Host: 127.0.0.1
   - Port: 5432
   - Username: postgres
   - Password: root@123

2. **Adminer** (lightweight web UI):
   - Download: https://www.adminer.org/download/
   - Run: `php -S localhost:8080 adminer.php`
   - Access: http://localhost:8080
   - Login with credentials above

---

## 🚀 Backend Setup & Running

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 2. Database Created ✅
The `policylens` database has been created. Tables will auto-create on first run!

### 3. Run Backend

```bash
# From backend directory with venv activated
python -m app.main

# Or use uvicorn directly:
uvicorn app.main:app --reload
```

**Backend Available At**:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

### Expected Startup Output:
```
🚀 Starting PolicyLens API...
✅ Database connection successful!
✅ Database tables initialized!
INFO:     Application startup complete.
```

---

## 🎨 Frontend Setup & Running

```bash
cd frontend
npm install  # Already done ✅
npm run dev
```

**Frontend Available At**:
- App: http://localhost:3000

---

## 📁 Project Structure

```
PolicyLens/
├── frontend/                  # Next.js application
│   ├── app/                  # App router
│   ├── public/               # Static assets
│   ├── package.json
│   └── .env.local
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── db/              # Database configuration
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routes/          # API endpoints
│   │   ├── main.py          # App entry point
│   │   └── ...
│   ├── requirements.txt      # Python dependencies
│   ├── .env                 # Environment variables
│   ├── create_db.py         # Database creation script
│   └── README.md
│
├── docker-compose.yml        # Docker setup (optional)
└── README.md
```

---

## 🔧 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`.env`)
```env
DATABASE_URL=postgresql://postgres:root%40123@127.0.0.1:5432/policylens
SERVER_PORT=8000
```

---

## 📝 Database Connection Test

Run this script to verify database connection:

```bash
cd backend
.\venv\Scripts\python.exe create_db.py
```

Expected output:
```
✅ Database 'policylens' created successfully!
```

Or:
```
✅ Database 'policylens' already exists!
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```
❌ Database connection failed
```
**Solution**: 
1. Ensure PostgreSQL is running
2. Run: `python create_db.py` to create database
3. Check `.env` file has correct DATABASE_URL

### Port Already in Use
**Solution**: Change port in `.env`
```env
SERVER_PORT=8001
```

### Module Not Found Errors
**Solution**: Reinstall dependencies
```bash
pip install -r requirements.txt
```

### Python Version Issues
**Solution**: Use Python 3.9+
```bash
python --version
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL running
- [ ] Database `policylens` created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `.env` files created
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Adminer accessible (if using Docker)

---

## 📚 Next Steps

1. **Create Models**: Add database models in `backend/app/models/`
2. **Create Schemas**: Add Pydantic schemas in `backend/app/schemas/`
3. **Create Routes**: Add API endpoints in `backend/app/routes/`
4. **Frontend Pages**: Build UI in `frontend/app/`
5. **Connect Frontend to Backend**: Use `NEXT_PUBLIC_API_URL` in frontend

---

## 🔗 Useful Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Adminer Features](https://www.adminer.org)

---

## 📞 Quick Commands

```bash
# Start everything (Docker)
docker-compose up -d

# Backend only
cd backend && python -m app.main

# Frontend only
cd frontend && npm run dev

# Stop Docker services
docker-compose down

# View logs
docker-compose logs -f

# Access database
psql -U postgres -h 127.0.0.1 -d policylens
```

---

**Created**: April 2, 2026  
**Project**: PolicyLens  
**Status**: Ready for Development ✅
