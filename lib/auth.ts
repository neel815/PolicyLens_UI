/**
 * Authentication utilities for PolicyLens frontend.
 * Uses HttpOnly cookies for secure token storage.
 * Token is automatically sent with all requests via browser's cookie mechanism.
 */

const USER_KEY = 'policylens_user';

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
 * Fetch wrapper that automatically includes credentials (cookies) and handles auth errors.
 * 
 * Key difference from traditional token-based auth:
 * - Token is in HttpOnly cookie, automatically sent by browser
 * - No Authorization header needed
 * - No localStorage token management
 * - XSS attacks cannot steal the token
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important: Send cookies with every request
    headers: {
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid — clear auth and redirect to login
    removeUser();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  return response;
