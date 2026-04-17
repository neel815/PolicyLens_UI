# Production Deployment Checklist
**Generated**: April 17, 2026

---

## 🚨 CRITICAL - MUST FIX BEFORE DEPLOYMENT

### Security Fixes (Target: 24 hours)

- [ ] **Change Database Password**
  - Remove default `root@123` from all documentation
  - Generate random 32-character password
  - Update `DATABASE_URL` in production `.env`
  - Test connection after change

- [ ] **Set SECRET_KEY**
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
  - Add to `backend/.env`
  - Ensure minimum 32 characters
  - Never commit to git

- [ ] **Fix CORS Configuration**
  - [ ] Remove `allow_methods=["*"]`
  - [ ] Remove `allow_headers=["*"]`
  - [ ] Set specific allowed methods: GET, POST, PUT, DELETE
  - [ ] Set specific allowed headers: Content-Type, Authorization
  - [ ] Test with curl: `curl -X DELETE http://localhost:8000/...`

- [ ] **Add JWT Verification to Routes**
  - [ ] `/api/policies/{id}` - verify user ownership
  - [ ] `/api/analyze` - verify user is authenticated
  - [ ] `/api/battle` - verify file ownership
  - [ ] `/api/simulate` - verify policy access
  - [ ] `/api/policies/{id}/delete` - verify user ownership

- [ ] **Set DEBUG=false**
  - [ ] Update `.env` with `DEBUG=false`
  - [ ] Test that error pages are not verbose
  - [ ] Verify stack traces not exposed in responses

---

## 🟠 HIGH PRIORITY - Complete by Week 1

### Performance & Security

- [ ] **Implement Rate Limiting**
  ```bash
  pip install slowapi
  ```
  - [ ] Add to `/api/analyze` endpoint (5 req/min per user)
  - [ ] Add to `/api/battle` endpoint (10 req/min per user)
  - [ ] Add to `/api/auth/register` (3 req/hour per IP)
  - [ ] Test rate limit by exceeding limit

- [ ] **Fix Tailwind CSS Warnings** (142 total)
  - [ ] Run bulk replacement script (see below)
  - [ ] Test visual appearance in light/dark mode
  - [ ] Verify no build warnings remain
  - Estimated time: 2-3 hours

- [ ] **Add Request Logging**
  - [ ] Create `logs/` directory
  - [ ] Configure RotatingFileHandler
  - [ ] Log: timestamp, method, path, status, user_id
  - [ ] Implement 10MB file rotation
  - [ ] Test logging works: `tail -f logs/api.log`

- [ ] **Disable API Docs in Production**
  - [ ] Set `docs_url=None` when `ENV=production`
  - [ ] Test `/docs` returns 404
  - [ ] Test `/redoc` returns 404

### Database

- [ ] **Increase Pool Size for Production**
  - [ ] Set `DB_POOL_SIZE=20` (from 5)
  - [ ] Set `DB_MAX_OVERFLOW=40` (from 10)
  - [ ] Load test with 100+ concurrent users
  - [ ] Monitor pool exhaustion in logs

---

## 🟡 MEDIUM PRIORITY - Complete by Week 2

### Code Quality

- [ ] **Add Integration Tests**
  - [ ] Test register → login → create policy flow
  - [ ] Test file upload → analysis flow
  - [ ] Test delete policy flow
  - [ ] Target: 80%+ coverage

- [ ] **Strengthen Input Validation**
  - [ ] Max file size: 50MB
  - [ ] Allowed types: application/pdf only
  - [ ] Validate PDF header magic bytes
  - [ ] Test with corrupted files

- [ ] **Add Error Handling**
  - [ ] Standardize error response format
  - [ ] Return appropriate HTTP status codes
  - [ ] Log errors to file with context
  - [ ] Test with invalid inputs

- [ ] **Add Type Hints**
  - [ ] Backend: Add `def func(arg: Type) -> ReturnType` throughout
  - [ ] Run `mypy --strict` to verify
  - [ ] Fix all type errors

### Monitoring

- [ ] **Set Up Error Logging**
  - [ ] Create error handler middleware
  - [ ] Log to file: `logs/errors.log`
  - [ ] Include: timestamp, error type, stack trace, request context
  - [ ] Test error logging with test endpoint

- [ ] **Monitor Database Connections**
  - [ ] Add SQLAlchemy event listeners for pool checkout/checkin
  - [ ] Alert if pool usage > 80%
  - [ ] Create dashboard showing pool stats

---

## Testing Requirements

### Security Testing (Mandatory)

- [ ] **Test Authentication**
  ```bash
  # Should fail without token
  curl http://localhost:8000/api/policies
  
  # Should fail with invalid token
  curl -H "Authorization: Bearer invalid" http://localhost:8000/api/policies
  
  # Should succeed with valid token
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/policies
  ```

- [ ] **Test Rate Limiting**
  ```bash
  # Run 6 requests quickly to /api/analyze
  for i in {1..6}; do curl -X POST http://localhost:8000/api/analyze; done
  # 6th request should return 429 (Too Many Requests)
  ```

- [ ] **Test CORS**
  ```bash
  # Should reject DELETE method if not allowed
  curl -X DELETE http://localhost:8000/api/policies/1
  ```

### Load Testing (Mandatory for production)

```bash
pip install locust

# Create locustfile.py with:
# - Register 10 users
# - Each: upload policy → analyze → delete
# - Ramp up to 100 concurrent users over 5 minutes
# - Run for 15 minutes

locust -f locustfile.py --headless -u 100 -r 10 -t 15m
```

**Target Metrics**:
- ✅ Response time < 500ms (p95)
- ✅ Error rate < 1%
- ✅ Database pool doesn't exhaust
- ✅ Memory usage stable

---

## Environment Variables Template

### production/.env

```bash
# Application
ENV=production
DEBUG=false
APP_NAME=PolicyLens API
APP_VERSION=1.0.0
APP_DESCRIPTION=AI-Powered Insurance Policy Analysis

# Database (CHANGE THESE - USE STRONG PASSWORD!)
DATABASE_URL=postgresql://policylens_user:STRONG_PASSWORD_HERE@db.example.com:5432/policylens_prod

# JWT (GENERATE WITH: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=YOUR_SECRET_KEY_MIN_32_CHARS_HERE

# CORS
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000

# Database Pool (Production sizing)
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600

# API Rate Limiting
RATE_LIMIT_ANALYZE=5/minute
RATE_LIMIT_BATTLE=10/minute
RATE_LIMIT_REGISTER=3/hour

# External APIs (if using)
GEMINI_API_KEY=your_key_here
EXTERNAL_API_TIMEOUT=30

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/api.log
LOG_MAX_SIZE=10485760  # 10MB
```

---

## Tailwind CSS Fix Script

Save as `frontend/fix-tailwind.py`:

```python
#!/usr/bin/env python3
"""Auto-fix Tailwind CSS deprecated classes."""

import re
from pathlib import Path

REPLACEMENTS = {
    r'font-\[family-name:var\(--font-serif\)\]': 'font-serif',
    r'font-\[family-name:var\(--font-sans\)\]': 'font-sans',
    r'bg-gradient-to-r': 'bg-linear-to-r',
    r'bg-gradient-to-l': 'bg-linear-to-l',
    r'bg-gradient-to-b': 'bg-linear-to-b',
    r'bg-gradient-to-t': 'bg-linear-to-t',
    r'flex-shrink-0': 'shrink-0',
    r'flex-grow': 'grow',
    r'flex-grow-0': 'grow-0',
    r'flex-basis-auto': 'basis-auto',
    r'max-w-\[960px\]': 'max-w-240',
    r'max-w-\[860px\]': 'max-w-215',
    r'max-w-\[760px\]': 'max-w-190',
    r'max-w-\[420px\]': 'max-w-105',
    r'max-w-\[200px\]': 'max-w-50',
    r'min-w-\[200px\]': 'min-w-50',
    r'min-w-\[120px\]': 'min-w-30',
    r'min-h-\[120px\]': 'min-h-30',
    r'w-\[96px\]': 'w-24',
    r'h-\[96px\]': 'h-24',
    r'w-\[18px\]': 'w-4.5',
    r'h-\[18px\]': 'h-4.5',
    r'w-\[16px\]': 'w-4',
    r'h-\[16px\]': 'h-4',
    r'border-\[4px\]': 'border-4',
    r'border-\[3px\]': 'border-3',
    r'border-\[2px\]': 'border-2',
    r'duration-\[1200ms\]': 'duration-1200',
    r'py-\[15px\]': 'py-3.75',
    r'hover:bg-primary/\[0\.06\]': 'hover:bg-primary/6',
    r'ease-\[cubic-bezier\(0\.4,0,0\.2,1\)\]': 'ease-in-out',
}

def fix_file(filepath):
    """Fix a single file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for old, new in REPLACEMENTS.items():
        content = re.sub(old, new, content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    """Fix all TSX files."""
    app_dir = Path('app')
    components_dir = Path('components')
    
    files_fixed = 0
    for pattern in ['**/*.tsx', '**/*.ts']:
        for filepath in app_dir.glob(pattern):
            if fix_file(filepath):
                print(f"✅ Fixed {filepath}")
                files_fixed += 1
        for filepath in components_dir.glob(pattern):
            if fix_file(filepath):
                print(f"✅ Fixed {filepath}")
                files_fixed += 1
    
    print(f"\n🎉 Fixed {files_fixed} files")

if __name__ == '__main__':
    main()
```

**Usage**:
```bash
cd frontend
python fix-tailwind.py
npm run build
```

---

## Deployment Verification Checklist

### Before Going Live

- [ ] **Build Verification**
  ```bash
  cd frontend && npm run build      # No warnings/errors
  cd backend && python -m pytest    # All tests pass
  ```

- [ ] **Environment Variables**
  ```bash
  # Verify all required vars are set
  grep "os.getenv" backend/app -r | grep -v ".default" | sort | uniq
  ```

- [ ] **Database**
  ```bash
  # Test connection with production credentials
  psql -U policylens_user -h db.example.com -d policylens_prod -c "SELECT 1"
  
  # Run migrations
  cd backend && alembic upgrade head
  ```

- [ ] **SSL Certificate**
  - [ ] Valid certificate installed
  - [ ] Certificate not self-signed
  - [ ] Expires in > 30 days
  - [ ] Test HTTPS: `curl https://api.yourdomain.com/health`

- [ ] **Secrets Management**
  - [ ] No .env files in git
  - [ ] No private keys committed
  - [ ] Use environment variables or secrets manager
  - [ ] Rotate SECRET_KEY periodically (every 6 months min)

---

## Post-Deployment Monitoring (First Week)

- [ ] **Hourly Checks**
  - Error rate < 1%
  - Response time p95 < 500ms
  - Database pool not exhausted
  - API rate limiting working

- [ ] **Daily Checks**
  - Review error logs
  - Check disk space (80% threshold)
  - Verify backups completed
  - Monitor database size growth

- [ ] **Weekly Checks**
  - Review security logs
  - Check for failed authentication attempts
  - Analyze slow query logs
  - Review cost metrics (API calls, storage)

---

## Rollback Plan

If critical issue found after deployment:

```bash
# 1. Immediate: Route traffic to previous version
#    (if using load balancer)

# 2. Database: Create savepoint before migration
#    Before: CREATE DATABASE policylens_prod_backup
#    Restore if needed: RESTORE DATABASE...

# 3. Code: Keep previous image
#    docker images
#    docker run previous-image:version

# 4. Communication: Notify team/users of issue
#    Post status update
#    ETA for fix
```

---

## Sign-Off

- [ ] **Security Lead**: _________________ Date: _______
- [ ] **DevOps Lead**: __________________ Date: _______
- [ ] **Product Owner**: _______________ Date: _______

**Ready for Production**: YES / NO

---

*Last Updated: April 17, 2026*
