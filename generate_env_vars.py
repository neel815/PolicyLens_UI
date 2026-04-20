#!/usr/bin/env python3
"""
Generate secure environment variables for Vercel and Railway deployment
Run this script to generate random secure keys needed for production
"""

import secrets
import string
import json
from datetime import datetime

def generate_secret_key(length: int = 32) -> str:
    """Generate a cryptographically secure random string"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_jwt_secret() -> str:
    """Generate JWT secret key"""
    return secrets.token_urlsafe(32)

def generate_db_password() -> str:
    """Generate a strong database password"""
    # Avoid special chars that might cause issues in connection strings
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(24))

def main():
    print("=" * 70)
    print("PolicyLens Production Environment Variables Generator")
    print("=" * 70)
    print(f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Generate secrets
    secret_key = generate_secret_key()
    jwt_secret = generate_jwt_secret()
    db_password = generate_db_password()
    
    # Vercel Environment Variables
    print("📋 VERCEL ENVIRONMENT VARIABLES")
    print("-" * 70)
    print("\nAdd these to Vercel Project Settings → Environment Variables:\n")
    
    vercel_env = {
        "NEXT_PUBLIC_API_BASE_URL": "https://<your-railway-backend-url>.railway.app",
        "NEXT_PUBLIC_API_PORT": "8000",
    }
    
    for key, value in vercel_env.items():
        print(f"{key}={value}")
    
    # Railway Backend Environment Variables
    print("\n\n🚄 RAILWAY BACKEND ENVIRONMENT VARIABLES")
    print("-" * 70)
    print("\nAdd these to Railway Project Settings → Variables:\n")
    
    railway_env = {
        "ENV": "production",
        "DEBUG": "false",
        "API_HOST": "0.0.0.0",
        "API_PORT": "8000",
        "LOG_LEVEL": "INFO",
        "SECRET_KEY": secret_key,
        "JWT_ALGORITHM": "HS256",
        "JWT_SECRET": jwt_secret,
        "DB_PASSWORD": db_password,
        "CORS_ORIGINS": "https://policylens.vercel.app,https://your-custom-domain.com",
        "DATABASE_URL": "postgresql://postgres:<password>@<host>:<port>/policylens_db",
        "GROQ_API_KEY": "<get-from-groq-console>",
        "GOOGLE_GEMINI_API_KEY": "<get-from-google-ai-studio>",
    }
    
    for key, value in railway_env.items():
        print(f"{key}={value}")
    
    # Important Notes
    print("\n\n⚠️  IMPORTANT NOTES")
    print("-" * 70)
    print("""
1. SECRET_KEY & JWT_SECRET: Already generated above. Copy as-is.
2. DB_PASSWORD: Already generated above. Use for PostgreSQL setup.
3. GROQ_API_KEY: Get from https://console.groq.com
4. GOOGLE_GEMINI_API_KEY: Get from https://aistudio.google.com
5. DATABASE_URL: Railway will provide this after PostgreSQL setup
6. CORS_ORIGINS: Replace with your actual domain
7. Keep these values secure - never commit to git
""")
    
    # Save to JSON file
    output = {
        "generated_at": datetime.now().isoformat(),
        "vercel_env": vercel_env,
        "railway_env": railway_env,
        "generated_secrets": {
            "SECRET_KEY": secret_key,
            "JWT_SECRET": jwt_secret,
            "DB_PASSWORD": db_password,
        }
    }
    
    filename = f"env_vars_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Environment variables saved to: {filename}")
    print("   (Keep this file secure - contains sensitive data!)\n")

if __name__ == "__main__":
    main()
