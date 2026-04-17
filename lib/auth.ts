/**
 * Authentication utilities for PolicyLens frontend.
 * Uses HttpOnly cookies for secure token storage.
 * Token is automatically sent with all requests via browser's cookie mechanism.
 * CSRF tokens are obtained from backend and included in X-CSRF-Token header.
 */

const USER_KEY = 'policylens_user';
const CSRF_TOKEN_KEY = 'policylens_csrf_token';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Save user info to localStorage (NOT the token - token is in HttpOnly cookie).
 */
export function saveUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get user info from localStorage.
 */
export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Remove user info from localStorage.
 */
export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Check if user is authenticated.
 * In production, you'd verify the token exists in a secure way.
 * For now, we check if user info is available.
 */
export function isAuthenticated(): boolean {
  return !!getUser();
}

/**
 * Get CSRF token from sessionStorage or fetch it from server.
 */
export async function getCSRFToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  // Check if we already have a token in sessionStorage
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (token) {
    console.log('[CSRF] Token found in sessionStorage');
    return token;
  }
  
  // Fetch a new CSRF token from the API proxy route
  try {
    console.log('[CSRF] Fetching new token from /api/csrf-token');
    const response = await fetch('/api/csrf-token', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[CSRF] Response status:', response.status);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    
    const data = await response.json() as { token: string };
    token = data.token;
    
    // Store it in sessionStorage for this session
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    console.log('[CSRF] Token saved to sessionStorage');
    return token;
  } catch (err) {
    console.error('Failed to get CSRF token:', err);
    return '';
  }
}

/**
 * Clear CSRF token from sessionStorage.
 */
export function clearCSRFToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  }
}

/**
 * Logout user.
 * Call /api/auth/logout endpoint to clear the HttpOnly cookie.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch (err) {
    console.error('Logout request failed:', err);
  } finally {
    removeUser();
    // Browser will automatically clear the HttpOnly cookie after logout endpoint clears it
  }
}

/**
 * Refresh authentication token.
 * Call this periodically to keep the session alive.
 * New token is sent via HttpOnly cookie (transparent to frontend).
 */
export async function refreshToken(): Promise<void> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Important: Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      // Token expired - logout
      removeUser();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
    throw err;
  }
}

/**
 * Fetch wrapper that automatically includes credentials (cookies) and CSRF token.
 * Also handles auth errors.
 * 
 * Key features:
 * - Token is in HttpOnly cookie, automatically sent by browser
 * - CSRF token fetched from backend and included in X-CSRF-Token header
 * - No Authorization header needed
 * - No localStorage token management
 * - XSS attacks cannot steal the token
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token if this is a state-changing request
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    ...options.headers,
  } as Record<string, string>;
  
  // For POST, PUT, DELETE, PATCH - include CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = await getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important: Send cookies with every request
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid — clear auth and redirect to login
    removeUser();
    clearCSRFToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (response.status === 403) {
    // Could be CSRF error - try to get a fresh token and retry once
    const detail = await response.json().catch(() => ({})) as { detail?: string };
    if (detail.detail?.includes('CSRF')) {
      clearCSRFToken();
      // Retry once with a fresh token
      const freshToken = await getCSRFToken();
      if (freshToken) {
        headers['X-CSRF-Token'] = freshToken;
        return fetch(url, {
          ...options,
          credentials: 'include',
          headers,
        });
      }
    }
  }

  return response;
}
