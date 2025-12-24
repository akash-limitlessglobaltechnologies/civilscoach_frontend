// Authentication utility functions for JWT token management and OTP authentication

const API_BASE_URL = import.meta.env.VITE_APP_URI || 'http://localhost:5000';

class AuthService {
  constructor() {
    this.token = this.getStoredToken();
    this.user = this.getStoredUser();
  }

  // Token management
  getStoredToken() {
    return localStorage.getItem('civils_coach_token');
  }

  getStoredUser() {
    const userStr = localStorage.getItem('civils_coach_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('civils_coach_token', token);
    localStorage.setItem('civils_coach_user', JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('civils_coach_token');
    localStorage.removeItem('civils_coach_user');
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // API headers with auth token
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Step 1: Send OTP to email and phone
  async sendOTP(email, phoneNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  }

  // Step 2: Verify OTP and login
  async verifyOTPAndLogin(sessionKey, emailOTP, phoneOTP) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionKey,
          emailOTP: emailOTP.trim(),
          phoneOTP: phoneOTP.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      // Store auth data
      if (data.token && data.user) {
        this.setAuth(data.token, data.user);
      }

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  // Resend OTP
  async resendOTP(sessionKey, type = 'both') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionKey,
          type
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  }

  // Get session status
  async getSessionStatus(sessionKey) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session/${sessionKey}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get session status');
      }

      return data;
    } catch (error) {
      console.error('Session status error:', error);
      throw error;
    }
  }

  // Verify current token
  async verifyToken() {
    if (!this.token) {
      throw new Error('No token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        // Token is invalid, clear stored auth
        this.clearAuth();
        throw new Error(data.message || 'Token verification failed');
      }

      // Update user data if different
      if (data.user && JSON.stringify(data.user) !== JSON.stringify(this.user)) {
        this.user = data.user;
        localStorage.setItem('civils_coach_user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Make authenticated API calls
  async authenticatedRequest(url, options = {}) {
    if (!this.token) {
      throw new Error('Authentication required');
    }

    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle auth errors
        if (response.status === 401) {
          this.clearAuth();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  }
}

// Validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phoneNumber) => {
  // Remove spaces, dashes, and parentheses
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Check for Indian mobile numbers or international format
  const indianMobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const internationalRegex = /^\+[1-9]\d{1,14}$/;
  
  return indianMobileRegex.test(cleanNumber) || internationalRegex.test(cleanNumber);
};

export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp.trim());
};

// Format phone number for display
export const formatPhoneNumber = (phoneNumber) => {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Format Indian numbers
  if (/^(\+91|91)?[6-9]\d{9}$/.test(cleanNumber)) {
    const number = cleanNumber.replace(/^(\+91|91)/, '');
    return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
  }
  
  return phoneNumber;
};

// Create and export singleton instance
export const authService = new AuthService();

// React hook for authentication state
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.user);
  const [loading, setLoading] = useState(false);

  const login = async (email, phoneNumber) => {
    setLoading(true);
    try {
      return await authService.sendOTP(email, phoneNumber);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (sessionKey, emailOTP, phoneOTP) => {
    setLoading(true);
    try {
      const result = await authService.verifyOTPAndLogin(sessionKey, emailOTP, phoneOTP);
      setIsAuthenticated(true);
      setUser(authService.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    if (!authService.token) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }

    try {
      await authService.verifyToken();
      setIsAuthenticated(true);
      setUser(authService.user);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    // Check auth on mount
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    verifyOTP,
    logout,
    checkAuth,
    authService
  };
};