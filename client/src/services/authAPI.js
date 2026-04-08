import { API_BASE_URL } from '../config/api';

/**
 * Authentication Service
 * Handles login, registration, and token management
 */
class AuthService {
  static TOKEN_KEY = 'vocalflow_token';
  static USER_ID_KEY = 'vocalflow_userId';
  static USER_EMAIL_KEY = 'vocalflow_userEmail';

  /**
   * Register a new user
   */
  static async register(email, password, firstName = '', lastName = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      this.setUserId(data.user._id);
      this.setUserEmail(data.user.email);

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      this.setUserId(data.user._id);
      this.setUserEmail(data.user.email);

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get stored JWT token
   */
  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set JWT token
   */
  static setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get stored user ID
   */
  static getUserId() {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  /**
   * Set user ID
   */
  static setUserId(userId) {
    localStorage.setItem(this.USER_ID_KEY, userId);
  }

  /**
   * Get stored user email
   */
  static getUserEmail() {
    return localStorage.getItem(this.USER_EMAIL_KEY);
  }

  /**
   * Set user email
   */
  static setUserEmail(email) {
    localStorage.setItem(this.USER_EMAIL_KEY, email);
  }

  /**
   * Validate token with server and sync userId from token
   */
  static async validateToken() {
    try {
      const token = this.getToken();
      if (!token) return false;

      // Extract userId from JWT payload
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          if (decoded.userId) {
            // Sync userId from token to ensure it matches
            this.setUserId(decoded.userId);
          }
        }
      } catch (e) {
        console.warn('Could not decode token payload:', e);
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return true;
      } else {
        // Token invalid or expired
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get Authorization header with token
   */
  static getAuthHeader() {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

export default AuthService;
