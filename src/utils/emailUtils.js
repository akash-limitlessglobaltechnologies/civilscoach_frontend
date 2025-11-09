// Email utility functions for managing persistent email storage with 7-day expiration

const EMAIL_STORAGE_KEY = 'user_email';
const EMAIL_TIMESTAMP_KEY = 'user_email_timestamp';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const emailUtils = {
  // Save email with current timestamp
  saveEmail: (email) => {
    const timestamp = Date.now();
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
    localStorage.setItem(EMAIL_TIMESTAMP_KEY, timestamp.toString());
  },

  // Get email if it's still valid (within 7 days)
  getEmail: () => {
    const email = localStorage.getItem(EMAIL_STORAGE_KEY);
    const timestamp = localStorage.getItem(EMAIL_TIMESTAMP_KEY);
    
    if (!email || !timestamp) {
      return null;
    }

    const emailAge = Date.now() - parseInt(timestamp);
    
    // If email is older than 7 days, remove it
    if (emailAge > SEVEN_DAYS_MS) {
      emailUtils.clearEmail();
      return null;
    }

    return email;
  },

  // Check if email exists and is valid
  hasValidEmail: () => {
    return emailUtils.getEmail() !== null;
  },

  // Clear email from storage
  clearEmail: () => {
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    localStorage.removeItem(EMAIL_TIMESTAMP_KEY);
  },

  // Get days remaining before email expires
  getDaysRemaining: () => {
    const timestamp = localStorage.getItem(EMAIL_TIMESTAMP_KEY);
    if (!timestamp) return 0;

    const emailAge = Date.now() - parseInt(timestamp);
    const daysRemaining = Math.ceil((SEVEN_DAYS_MS - emailAge) / (24 * 60 * 60 * 1000));
    
    return Math.max(0, daysRemaining);
  },

  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }
};