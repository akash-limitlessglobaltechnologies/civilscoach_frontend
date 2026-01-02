import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authService';
import { trackAuthentication, trackEngagement, trackConversion } from '../utils/analytics';
import { getPopularCountries, getAllCountries, searchCountries, getCountryDisplayText } from '../utils/countryCodes';
import { useMetaTags } from '../utils/useMetaTags';

const OTPLogin = () => {
  useMetaTags({
    title: 'Login - CivilsCoach',
    description: 'Sign in to your CivilsCoach account. Access practice tests, track progress, and master UPSC preparation.',
    image: 'https://civilscoach.com/og-image.jpg',
    url: 'https://civilscoach.com/login'
  });
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: ''
  });
  const [otpData, setOtpData] = useState({
    emailOTP: '',
    smsOTP: ''
  });
  const [sessionKey, setSessionKey] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSignup, setIsSignup] = useState(true); // UI toggle state - Default to signup
  const [signupData, setSignupData] = useState({
    fullName: ''
    // Removed confirmEmail - only ask email once
  }); // UI only fields
  
  // Country selector states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Analytics tracking states
  const [startTime] = useState(Date.now());
  const [formInteractions, setFormInteractions] = useState({
    emailFocused: false,
    phoneFocused: false,
    countryChanged: false,
    modeToggled: false
  });
  
  const { authService } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Clear validation errors when switching between signup/login modes + Track mode changes
  useEffect(() => {
    setValidationErrors({});
    setError('');
    setSuccess('');
    
    // Track signup/login mode toggle
    if (formInteractions.modeToggled) {
      trackAuthentication('auth_mode_toggle', {
        label: isSignup ? 'switched_to_signup' : 'switched_to_login',
        value: Math.round((Date.now() - startTime) / 1000) // Time before switching
      });
    } else {
      // Track initial page load mode
      trackAuthentication('auth_page_loaded', {
        label: isSignup ? 'signup_default' : 'login_default'
      });
    }
    
    setFormInteractions(prev => ({ ...prev, modeToggled: true }));
  }, [isSignup, startTime, formInteractions.modeToggled]);

  // Initialize country selection with India as default + Track country analytics
  useEffect(() => {
    const popularCountries = getPopularCountries();
    const indiaCountry = popularCountries.find(country => country.country === 'IN');
    if (indiaCountry) {
      setSelectedCountry(indiaCountry);
      
      // Track default country selection
      trackEngagement('country_default_selected', {
        label: 'India_IN',
        value: 1
      });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Timer effect for OTP expiry
  useEffect(() => {
    let timer;
    if (step === 2 && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setError('OTP has expired. Please request a new OTP.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeRemaining]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Get filtered countries based on search
  const getFilteredCountries = () => {
    if (!countrySearch) {
      const popular = getPopularCountries();
      const all = getAllCountries();
      return { popular, all };
    }
    
    const filtered = searchCountries(countrySearch);
    return { popular: [], all: filtered };
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setCountrySearch('');
    
    // Track country selection analytics
    trackEngagement('country_selected', {
      label: `${country.name}_${country.country}`,
      value: country.country === 'IN' ? 1 : 0 // Track if selecting India vs other
    });
    
    setFormInteractions(prev => ({ ...prev, countryChanged: true }));
    
    // Clear phone validation error when country changes
    if (validationErrors.phoneNumber) {
      setValidationErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handleSignupDataChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    });
    
    // Track form field interactions
    if (e.target.name === 'fullName' && e.target.value.length > 0) {
      trackEngagement('fullname_field_filled', { 
        label: isSignup ? 'signup' : 'login'
      });
    }
  };

  // Add form field focus tracking
  const handleEmailFocus = () => {
    if (!formInteractions.emailFocused) {
      trackEngagement('email_field_focused', {
        label: isSignup ? 'signup' : 'login'
      });
      setFormInteractions(prev => ({ ...prev, emailFocused: true }));
    }
  };

  const handlePhoneFocus = () => {
    if (!formInteractions.phoneFocused) {
      trackEngagement('phone_field_focused', {
        label: isSignup ? 'signup' : 'login'
      });
      setFormInteractions(prev => ({ ...prev, phoneFocused: true }));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    
    // Full name validation (only for signup)
    if (isSignup) {
      if (!signupData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (signupData.fullName.trim().length < 2) {
        errors.fullName = 'Please enter your full name';
      }
    }
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else {
      // Country-specific validation
      if (selectedCountry?.country === 'IN') {
        const indianMobileRegex = /^[6-9]\d{9}$/;
        if (!indianMobileRegex.test(formData.phoneNumber)) {
          errors.phoneNumber = 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)';
        }
      } else if (selectedCountry?.country === 'US' || selectedCountry?.country === 'CA') {
        const northAmericaRegex = /^\d{10}$/;
        if (!northAmericaRegex.test(formData.phoneNumber)) {
          errors.phoneNumber = 'Please enter a valid 10-digit phone number';
        }
      } else {
        // Generic international validation
        if (formData.phoneNumber.length < 7 || formData.phoneNumber.length > 15) {
          errors.phoneNumber = 'Please enter a valid phone number (7-15 digits)';
        }
      }
    }
    
    // Track validation errors
    if (Object.keys(errors).length > 0) {
      trackAuthentication('form_validation_failed', {
        label: Object.keys(errors).join('_'),
        value: Object.keys(errors).length
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) {
      // Track failed validation
      trackAuthentication('form_submit_validation_failed', {
        label: isSignup ? 'signup' : 'login',
        value: Object.keys(validationErrors).length
      });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Track form submission attempt
      trackAuthentication('otp_request_initiated', {
        label: isSignup ? 'signup_mode' : 'login_mode',
        value: Math.round((Date.now() - startTime) / 1000) // Time to fill form
      });

      // Track country usage analytics
      if (selectedCountry) {
        trackEngagement('country_usage', {
          label: `${selectedCountry.country}_${selectedCountry.name}`,
          value: selectedCountry.country === 'IN' ? 1 : 0
        });
      }
      
      // Format phone number with country code
      const fullPhoneNumber = selectedCountry ? 
        `${selectedCountry.code}${formData.phoneNumber}` : 
        formData.phoneNumber;

      const response = await authService.sendOTP(formData.email, fullPhoneNumber);
      
      setSessionKey(response.sessionKey);
      setStep(2);
      setTimeRemaining(600); // Reset timer to 10 minutes
      setSuccess('OTP sent to your email and phone number');

      // Track successful OTP sending
      trackAuthentication('otp_sent_success', {
        label: isSignup ? 'signup' : 'login',
        value: 1
      });

    } catch (error) {
      // Track OTP sending failure
      trackAuthentication('otp_sent_failed', {
        label: error.message || 'unknown_error',
        value: 0
      });
      
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpData.emailOTP || !otpData.smsOTP) {
      trackAuthentication('otp_verification_incomplete', {
        label: `email_${otpData.emailOTP ? 'filled' : 'empty'}_sms_${otpData.smsOTP ? 'filled' : 'empty'}`,
        value: 0
      });
      setError('Please enter both email and SMS OTP');
      return;
    }
    
    if (otpData.emailOTP.length !== 6 || otpData.smsOTP.length !== 6) {
      trackAuthentication('otp_verification_invalid_length', {
        label: `email_${otpData.emailOTP.length}_sms_${otpData.smsOTP.length}`,
        value: 0
      });
      setError('OTP must be 6 digits');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Track verification attempt
      trackAuthentication('otp_verification_initiated', {
        label: isSignup ? 'signup' : 'login',
        value: Math.round((Date.now() - startTime) / 1000) // Total time for auth flow
      });
      
      await authService.verifyOTPAndLogin(sessionKey, otpData.emailOTP, otpData.smsOTP);
      
      // Track successful authentication
      trackAuthentication('auth_success', {
        label: isSignup ? 'signup_completed' : 'login_completed',
        value: Math.round((Date.now() - startTime) / 1000) // Total auth time
      });

      // Track conversion if coming from promotional page
      const from = location.state?.from?.pathname || '/';
      if (from.includes('2025-snapshot')) {
        trackConversion('quiz_to_auth_completed', {
          label: isSignup ? 'signup' : 'login',
          value: 1
        });
      }
      
      navigate(from, { replace: true });
      
    } catch (error) {
      // Track verification failure
      trackAuthentication('otp_verification_failed', {
        label: error.message || 'verification_error',
        value: 0
      });
      
      setError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async (type = 'both') => {
    if (resendCooldown > 0) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Track resend OTP attempts
      trackAuthentication('otp_resend_requested', {
        label: `${type}_resend`,
        value: Math.round((Date.now() - startTime) / 1000) // Time before requesting resend
      });
      
      await authService.resendOTP(sessionKey, type);
      
      setResendCooldown(30); // 30 second cooldown
      setSuccess(`OTP resent to your ${type === 'both' ? 'email and phone' : type}`);
      setTimeRemaining(600); // Reset timer

      // Track successful resend
      trackAuthentication('otp_resend_success', {
        label: type,
        value: 1
      });

    } catch (error) {
      // Track resend failure
      trackAuthentication('otp_resend_failed', {
        label: `${type}_${error.message || 'unknown'}`,
        value: 0
      });
      
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Track back button usage
    trackEngagement('otp_back_button_clicked', {
      label: 'step2_to_step1',
      value: Math.round((Date.now() - startTime) / 1000)
    });
    
    setStep(1);
    setOtpData({ emailOTP: '', smsOTP: '' });
    setError('');
    setSuccess('');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneForDisplay = () => {
    if (!selectedCountry || !formData.phoneNumber) return '';
    return `${selectedCountry.code} ${formData.phoneNumber}`;
  };

  const { popular: popularCountries, all: allCountries } = getFilteredCountries();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Civils Coach Branding */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Welcome to Civils Coach
            </h1>
            <p className="text-gray-600">Your UPSC preparation platform</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Login/Signup Toggle - Only show in step 1 */}
          {step === 1 && (
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                  isSignup 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                  !isSignup 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Login
              </button>
            </div>
          )}

          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 1 
              ? (isSignup ? 'Create Your Account' : 'Secure Login') 
              : 'Verify Your Identity'
            }
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 
              ? (isSignup 
                  ? 'Join thousands of successful UPSC aspirants'
                  : 'Enter your email and phone number to receive verification codes'
                )
              : 'Enter the OTP codes sent to your email and phone number'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${step * 50}%` }}
          ></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Step 1: Enter Credentials */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-xl border p-8">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Signup-only fields */}
              {isSignup && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Full Name
                      </div>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={signupData.fullName}
                        onChange={handleSignupDataChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {validationErrors.fullName && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors.fullName}</p>
                    )}
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email Address
                  </div>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onFocus={handleEmailFocus}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone Number Field with Country Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone Number
                  </div>
                </label>
                <div className="flex">
                  {/* Country Selector */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className={`flex items-center px-3 py-3 border border-r-0 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <span className="text-lg mr-2">{selectedCountry?.flag || '🌍'}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedCountry?.code || '+'}
                      </span>
                      <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Country Dropdown */}
                    {showCountryDropdown && (
                      <div className="absolute z-50 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                        {/* Search Box */}
                        <div className="p-3 border-b">
                          <input
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="overflow-y-auto max-h-48">
                          {/* Popular Countries */}
                          {popularCountries.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                                Popular
                              </div>
                              {popularCountries.map((country) => (
                                <button
                                  key={`popular-${country.country}`}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                  className="w-full flex items-center px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                                >
                                  <span className="text-lg mr-3">{country.flag}</span>
                                  <span className="flex-1 text-left text-sm">{country.name}</span>
                                  <span className="text-sm text-gray-500">{country.code}</span>
                                </button>
                              ))}
                            </>
                          )}
                          
                          {/* All Countries */}
                          {allCountries.length > 0 && (
                            <>
                              {popularCountries.length > 0 && (
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-t">
                                  All Countries
                                </div>
                              )}
                              {allCountries.map((country) => (
                                <button
                                  key={`all-${country.country}`}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                  className="w-full flex items-center px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                                >
                                  <span className="text-lg mr-3">{country.flag}</span>
                                  <span className="flex-1 text-left text-sm">{country.name}</span>
                                  <span className="text-sm text-gray-500">{country.code}</span>
                                </button>
                              ))}
                            </>
                          )}
                          
                          {allCountries.length === 0 && popularCountries.length === 0 && (
                            <div className="px-3 py-4 text-center text-gray-500">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onFocus={handlePhoneFocus}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                    className={`flex-1 px-4 py-3 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      validationErrors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={selectedCountry?.country === 'IN' ? '9876543210' : 'Phone number'}
                  />
                </div>
                {validationErrors.phoneNumber && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.phoneNumber}</p>
                )}
                {selectedCountry && formData.phoneNumber && (
                  <p className="text-sm text-gray-600 mt-1">
                    Full number: {formatPhoneForDisplay()}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isSignup ? 'Creating Account...' : 'Sending OTP...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isSignup ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )}
                    </svg>
                    {isSignup ? 'Create Account & Verify' : 'Send Verification Code'}
                  </div>
                )}
              </button>

              {/* Terms for signup */}
              {isSignup && (
                <p className="text-center text-xs text-gray-500">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              )}
            </form>
          </div>
        )}

        {/* Step 2: Enter OTPs */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-xl border p-8">
            {/* Timer */}
            <div className="text-center mb-6">
              <div className={`text-2xl font-bold ${timeRemaining <= 60 ? 'text-red-600' : 'text-green-600'}`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-600">Time remaining</p>
            </div>

            {/* Contact Info Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span className="text-blue-800">{formData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-blue-800">{formatPhoneForDisplay()}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-6">
              {/* Email OTP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Verification Code
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpData.emailOTP}
                  onChange={(e) => setOtpData({ ...otpData, emailOTP: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>

              {/* SMS OTP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    SMS Verification Code
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpData.smsOTP}
                  onChange={(e) => setOtpData({ ...otpData, smsOTP: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !otpData.emailOTP || !otpData.smsOTP}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                {/* Resend Options */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleResendOTP('email')}
                    disabled={resendCooldown > 0 || loading}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
                  >
                    {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Email OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResendOTP('sms')}
                    disabled={resendCooldown > 0 || loading}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
                  >
                    {resendCooldown > 0 ? `Resend SMS (${resendCooldown}s)` : 'Resend SMS OTP'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
                >
                  Back to Phone & Email
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>Secure verification powered by email and SMS</p>
          <p className="mt-1">Having trouble? Contact support for assistance</p>
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;