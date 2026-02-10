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

// Track signup page visits and conversions
export const trackSignupPageVisit = () => {
  if (isGtagAvailable()) {
    // Track page view
    window.gtag('event', 'page_view', {
      page_title: 'Signup Page',
      page_location: window.location.href,
      custom_map: {'custom_parameter_1': 'signup_funnel_start'}
    });
    
    // Track funnel entry
    window.gtag('event', 'begin_checkout', {
      currency: 'USD',
      value: 0,
      items: [{
        item_id: 'signup',
        item_name: 'User Signup',
        category: 'Authentication',
        quantity: 1,
        price: 0
      }]
    });
  }
  
  // Custom event for easier tracking
  event({
    category: 'Signup_Funnel',
    action: 'page_visited',
    label: 'signup_page_load',
    value: 1
  });
};

export const trackSignupStarted = (step = 1) => {
  if (isGtagAvailable()) {
    window.gtag('event', 'sign_up', {
      method: 'email',
      custom_parameter_1: `step_${step}_started`
    });
  }
  
  event({
    category: 'Signup_Funnel',
    action: 'signup_started',
    label: `step_${step}`,
    value: step
  });
};

export const trackSignupCompleted = () => {
  if (isGtagAvailable()) {
    // Main conversion event
    window.gtag('event', 'sign_up', {
      method: 'email',
      custom_parameter_1: 'completed'
    });
    
    // Conversion tracking
    window.gtag('event', 'conversion', {
      send_to: GA_MEASUREMENT_ID + '/signup_complete',
      currency: 'USD',
      value: 1
    });
    
    // Purchase event for funnel tracking
    window.gtag('event', 'purchase', {
      transaction_id: 'signup_' + Date.now(),
      value: 1,
      currency: 'USD',
      items: [{
        item_id: 'signup_completed',
        item_name: 'User Registration Complete',
        category: 'Authentication',
        quantity: 1,
        price: 1
      }]
    });
  }
  
  event({
    category: 'Signup_Funnel',
    action: 'signup_completed',
    label: 'registration_success',
    value: 1
  });
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