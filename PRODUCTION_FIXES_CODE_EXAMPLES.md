# Production Fixes - Code Examples

## 1. Fix JWT Verification on Protected Routes

### BEFORE (Vulnerable)
```python
# backend/routes/policy_routes.py
@router.get("/api/policies/{policy_id}")
async def get_policy(policy_id: int, db: Session = Depends(get_db)):
    """Get policy details."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404)
    return policy
    
    # ❌ PROBLEM: Anyone can access any policy
```

### AFTER (Secured)
```python
# backend/routes/policy_routes.py
from fastapi import Depends, HTTPException, status
from app.utils.jwt_utils import get_current_user
from app.models.user import User
from sqlalchemy.orm import Session

@router.get("/api/policies/{policy_id}")
async def get_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),  # ✅ ADD THIS
    db: Session = Depends(get_db)
):
    """Get policy details - only owner can access."""
    policy = db.query(Policy).filter(
        Policy.id == policy_id,
        Policy.user_id == current_user.id  # ✅ ADD OWNERSHIP CHECK
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found or access denied"
        )
    return policy
```

### Apply to All Protected Routes

```python
# Template for all endpoints that need authentication
@router.post("/api/analyze")
async def analyze_policy(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),  # ✅ Add this
    db: Session = Depends(get_db)
):
    # Verify user authentication
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")
    
    # Process...

@router.delete("/api/policies/{policy_id}")
async def delete_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),  # ✅ Add this
    db: Session = Depends(get_db)
):
    # Verify ownership
    policy = db.query(Policy).filter(
        Policy.id == policy_id,
        Policy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(status_code=404)
    
    db.delete(policy)
    db.commit()
    return {"message": "deleted"}
```

---

## 2. Fix CORS Configuration

### BEFORE (Insecure)
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["*"],      # ❌ INSECURE - allows all methods
    allow_headers=["*"],      # ❌ INSECURE - allows all headers
)
```

### AFTER (Secure)
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

# Define allowed methods and headers explicitly
ALLOWED_METHODS = [
    "GET",      # Read operations
    "POST",     # Create operations
    "PUT",      # Update operations
    "DELETE",   # Delete operations (if needed)
    "OPTIONS",  # CORS preflight
]

ALLOWED_HEADERS = [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
]

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=ALLOWED_METHODS,  # ✅ Specific methods only
    allow_headers=ALLOWED_HEADERS,   # ✅ Specific headers only
    max_age=600,                      # ✅ Cache preflight for 10 mins
)
```

---

## 3. Implement Rate Limiting

### Install
```bash
pip install slowapi
```

### BEFORE (No protection)
```python
@router.post("/api/analyze")
async def analyze_policy(file: UploadFile):
    # Expensive operation - can be abused!
    result = call_gemini_api(file)
    return result
```

### AFTER (With rate limiting)
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."}
    )

# Per-user rate limiting (better)
from fastapi import Depends

def get_rate_limit_key(current_user: User = Depends(get_current_user)):
    return str(current_user.id)

@router.post("/api/analyze")
@limiter.limit("5/minute")  # 5 requests per minute per user
async def analyze_policy(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    # Only 5 analysis requests per minute
    result = call_gemini_api(file)
    return result

@router.post("/api/battle")
@limiter.limit("10/minute")  # 10 battle requests per minute
async def battle_policies(
    file1: UploadFile,
    file2: UploadFile,
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    result = perform_battle(file1, file2)
    return result
```

---

## 4. Add Request Logging

### BEFORE (No logging)
```python
# backend/app/main.py
app = FastAPI(title="PolicyLens API")
# No visibility into what's happening
```

### AFTER (With logging)
```python
# backend/app/main.py
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

# Create logs directory
import os
os.makedirs('logs', exist_ok=True)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Rotating file handler (10MB max, keep 5 backups)
handler = RotatingFileHandler(
    'logs/api.log',
    maxBytes=10_000_000,
    backupCount=5
)

formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Also add error logging
error_handler = RotatingFileHandler(
    'logs/errors.log',
    maxBytes=10_000_000,
    backupCount=5
)
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(formatter)
logger.addHandler(error_handler)

# Add request logging middleware
from starlette.middleware.base import BaseHTTPMiddleware
from time import time

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time()
        response = await call_next(request)
        duration = time() - start_time
        
        # Extract user info
        user_id = "anonymous"
        if request.user:
            user_id = getattr(request.user, 'id', 'unknown')
        
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"User: {user_id} - "
            f"Duration: {duration:.2f}s"
        )
        return response

app.add_middleware(RequestLoggingMiddleware)

# Log startup/shutdown
@app.on_event("startup")
async def startup():
    logger.info("✅ PolicyLens API starting up...")

@app.on_event("shutdown")
async def shutdown():
    logger.info("🛑 PolicyLens API shutting down...")

# Log errors
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

---

## 5. Disable Swagger Docs in Production

### BEFORE (Docs exposed)
```python
# backend/app/main.py
app = FastAPI(
    title="PolicyLens API",
    version="1.0.0",
    # Docs are exposed by default at /docs and /redoc
)
```

### AFTER (Docs hidden in production)
```python
# backend/app/main.py
import os

# Hide documentation in production
docs_url = "/docs" if os.getenv("ENV") != "production" else None
redoc_url = "/redoc" if os.getenv("ENV") != "production" else None
openapi_url = "/openapi.json" if os.getenv("ENV") != "production" else None

app = FastAPI(
    title="PolicyLens API",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)
```

---

## 6. Add HTTPS Redirect

### Add to main.py
```python
from fastapi.responses import RedirectResponse

@app.middleware("http")
async def https_redirect(request: Request, call_next):
    """Redirect HTTP to HTTPS in production."""
    if os.getenv("ENV") == "production":
        if request.url.scheme == "http":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=url, status_code=301)
    
    return await call_next(request)
```

---

## 7. Strengthen File Validation

### BEFORE (Minimal validation)
```python
@router.post("/api/analyze")
async def analyze_policy(file: UploadFile):
    pdf_bytes = await file.read()
    # Just read the file, no validation
    analysis = call_gemini_api(pdf_bytes)
    return analysis
```

### AFTER (Strong validation)
```python
from pypdf import PdfReader
import io

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_CONTENT_TYPES = ["application/pdf"]
ALLOWED_EXTENSIONS = [".pdf"]

async def validate_pdf_file(file: UploadFile):
    """Validate uploaded PDF file."""
    
    # Check file extension
    if not any(file.filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(400, "Only PDF files are allowed")
    
    # Check content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, "Invalid file type")
    
    # Read file
    pdf_bytes = await file.read()
    
    # Check file size
    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(413, f"File too large (max {MAX_FILE_SIZE / 1024 / 1024}MB)")
    
    # Check file is not empty
    if len(pdf_bytes) == 0:
        raise HTTPException(400, "File is empty")
    
    # Validate PDF magic bytes
    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(400, "File is not a valid PDF")
    
    # Try to parse PDF
    try:
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
        if len(pdf_reader.pages) == 0:
            raise HTTPException(400, "PDF has no pages")
    except Exception as e:
        raise HTTPException(400, f"Invalid PDF format: {str(e)}")
    
    return pdf_bytes

@router.post("/api/analyze")
async def analyze_policy(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze insurance policy with validation."""
    pdf_bytes = await validate_pdf_file(file)
    
    # Safe to process
    analysis = call_gemini_api(pdf_bytes)
    return analysis
```

---

## 8. Add Integration Tests

### Save as `backend/tests/test_integration.py`

```python
import pytest
from httpx import AsyncClient
from app.main import app
from app.db.database import SessionLocal
from sqlalchemy.orm import Session

# Test fixtures
@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def db():
    """Create test database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Tests
@pytest.mark.asyncio
async def test_register_user(client):
    """Test user registration."""
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "testuser"

@pytest.mark.asyncio
async def test_login_user(client):
    """Test user login."""
    # First register
    await client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "full_name": "Test User"
        }
    )
    
    # Then login
    response = await client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "SecurePassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

@pytest.mark.asyncio
async def test_protected_route_requires_auth(client):
    """Test that protected routes require authentication."""
    response = await client.get("/api/policies")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_analyze_rate_limiting(client):
    """Test rate limiting on analyze endpoint."""
    # Register and login
    reg = await client.post(
        "/api/auth/register",
        json={
            "username": "ratelimituser",
            "email": "rl@example.com",
            "password": "Password123!",
            "full_name": "RL User"
        }
    )
    token = reg.json()["access_token"]
    
    # Make 6 requests (limit is 5/minute)
    for i in range(6):
        response = await client.post(
            "/api/analyze",
            files={"file": ("test.pdf", b"%PDF test")},
            headers={"Authorization": f"Bearer {token}"}
        )
        if i < 5:
            assert response.status_code in [200, 400]  # Valid but may fail on PDF
        else:
            assert response.status_code == 429  # Too Many Requests
```

---

## 9. Secure Cookies in Frontend

### Update `frontend/lib/auth.ts`

```typescript
/**
 * Store token with secure settings.
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TOKEN_KEY, token);
  
  // Also set as secure cookie for auto-logout
  document.cookie = `${TOKEN_KEY}=${token}; ` +
    `Secure; ` +                    // HTTPS only
    `HttpOnly; ` +                  // Not accessible via JS (server-side)
    `SameSite=Strict; ` +           // CSRF protection
    `Max-Age=${24 * 60 * 60}; ` +   // 24 hours
    `Path=/`;
}

/**
 * Get token with expiration check.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  
  // Check if token is about to expire (< 5 mins)
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = decoded.exp * 1000 - Date.now();
    
    if (expiresIn < 5 * 60 * 1000) {
      // Token expiring soon, clear it
      removeToken();
      return null;
    }
  } catch {
    // Invalid token
    removeToken();
    return null;
  }
  
  return token;
}

/**
 * Clear token on logout.
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TOKEN_KEY);
  
  // Clear cookie too
  document.cookie = `${TOKEN_KEY}=; ` +
    `Secure; ` +
    `HttpOnly; ` +
    `SameSite=Strict; ` +
    `Max-Age=0; ` +
    `Path=/`;
}
```

---

## 10. Environment Variable Validation

### Add to `backend/app/main.py`

```python
import os
from dotenv import load_dotenv

load_dotenv()

def validate_environment():
    """Validate all required environment variables are set."""
    required_vars = [
        "SECRET_KEY",
        "DATABASE_URL",
        "CORS_ORIGINS",
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            f"Please add them to your .env file"
        )
    
    # Validate SECRET_KEY length
    secret_key = os.getenv("SECRET_KEY", "")
    if len(secret_key) < 32:
        raise RuntimeError(
            f"SECRET_KEY must be at least 32 characters (got {len(secret_key)})"
        )
    
    # Validate DEBUG is false in production
    if os.getenv("ENV") == "production" and os.getenv("DEBUG", "false").lower() != "false":
        raise RuntimeError("DEBUG must be false in production")
    
    logger.info("✅ All environment variables validated")

# Call this on startup
validate_environment()
```

---

*Last Updated: April 17, 2026*
