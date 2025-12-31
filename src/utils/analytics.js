// Google Analytics utility functions
export const GA_MEASUREMENT_ID = 'G-DHEMJL10L0';

// Check if gtag is available
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && window.gtag;
};

// Log page views
export const pageview = (url, title) => {
  if (isGtagAvailable()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title,
    });
  }
};

// Log custom events
export const event = ({ action, category, label, value }) => {
  if (isGtagAvailable()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific tracking functions for your app
export const trackQuizEvent = (action, data = {}) => {
  event({
    category: 'Quiz',
    action: action,
    label: data.label || '2025-snapshot',
    value: data.value
  });
};

export const trackConversion = (action, data = {}) => {
  event({
    category: 'Conversion',
    action: action,
    label: data.label || 'default',
    value: data.value
  });
};

export const trackEngagement = (action, data = {}) => {
  event({
    category: 'Engagement',
    action: action,
    label: data.label || 'default',
    value: data.value
  });
};

export const trackAuthentication = (action, data = {}) => {
  event({
    category: 'Authentication',
    action: action,
    label: data.label || 'default',
    value: data.value
  });
};