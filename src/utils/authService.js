// Authentication utility functions for JWT token management and separate signup/login flows

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

  // SIGNUP FLOW

  // Step 1: Send OTP for signup
  async sendSignupOTP(email, phoneNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup/send-otp`, {
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
        throw new Error(data.message || 'Failed to send signup OTP');
      }

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Send signup OTP error:', error);
      throw error;
    }
  }

  // Step 2: Verify OTP for signup
  async verifySignupOTP(sessionKey, emailOTP, phoneOTP) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup/verify-otp`, {
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

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Verify signup OTP error:', error);
      throw error;
    }
  }

  // Step 3: Complete signup with password
  async completeSignup(sessionKey, password, firstName = '', lastName = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionKey,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup completion failed');
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
      console.error('Complete signup error:', error);
      throw error;
    }
  }

  // LOGIN FLOW

  // Login with email/phone and password
  async login(identifier, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(), // Can be email or phone
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
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
      console.error('Login error:', error);
      throw error;
    }
  }

  // FORGOT PASSWORD FLOW

  // Step 1: Send Reset OTP for Forgot Password
  async forgotPassword(identifier) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send password reset OTP');
      }

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Step 2: Reset Password with Dual OTP Verification
  async resetPassword(sessionKey, emailOTP, phoneOTP, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionKey,
          emailOTP: emailOTP.trim(),
          phoneOTP: phoneOTP.trim(),
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // UTILITY FUNCTIONS

  // Resend OTP (works for both signup and password reset flows)
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

  // Change password (Future feature)
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      return data;
    } catch (error) {
      console.error('Change password error:', error);
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

export const validatePassword = (password) => {
  // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
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

// Password strength checker
export const getPasswordStrength = (password) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('One lowercase letter');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('One uppercase letter');

  if (/\d/.test(password)) score++;
  else feedback.push('One number');

  if (/[@$!%*?&]/.test(password)) score++;
  else feedback.push('One special character');

  const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const color = ['red', 'red', 'orange', 'blue', 'green'][score];

  return {
    score,
    strength,
    color,
    feedback,
    isValid: score === 5
  };
};

// Create and export singleton instance
export const authService = new AuthService();

// React hook for authentication state
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.user);
  const [loading, setLoading] = useState(false);

  // Signup flow methods
  const sendSignupOTP = async (email, phoneNumber) => {
    setLoading(true);
    try {
      return await authService.sendSignupOTP(email, phoneNumber);
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOTP = async (sessionKey, emailOTP, phoneOTP) => {
    setLoading(true);
    try {
      return await authService.verifySignupOTP(sessionKey, emailOTP, phoneOTP);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (sessionKey, password, firstName, lastName) => {
    setLoading(true);
    try {
      const result = await authService.completeSignup(sessionKey, password, firstName, lastName);
      setIsAuthenticated(true);
      setUser(authService.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Login method
  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const result = await authService.login(identifier, password);
      setIsAuthenticated(true);
      setUser(authService.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password methods
  const forgotPassword = async (identifier) => {
    setLoading(true);
    try {
      return await authService.forgotPassword(identifier);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (sessionKey, emailOTP, phoneOTP, newPassword) => {
    setLoading(true);
    try {
      return await authService.resetPassword(sessionKey, emailOTP, phoneOTP, newPassword);
    } finally {
      setLoading(false);
    }
  };

  // Utility methods
  const resendOTP = async (sessionKey, type = 'both') => {
    try {
      return await authService.resendOTP(sessionKey, type);
    } catch (error) {
      throw error;
    }
  };

  const getSessionStatus = async (sessionKey) => {
    try {
      return await authService.getSessionStatus(sessionKey);
    } catch (error) {
      throw error;
    }
  };

  // Logout method
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

  // Check authentication
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
    
    // Signup methods
    sendSignupOTP,
    verifySignupOTP,
    completeSignup,
    
    // Login methods
    login,
    
    // Forgot password methods
    forgotPassword,
    resetPassword,
    
    // Utility methods
    resendOTP,
    getSessionStatus,
    logout,
    checkAuth,
    authService
  };
};