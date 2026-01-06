import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, validateEmail, validatePhoneNumber, validatePassword, getPasswordStrength } from '../utils/authService';
import { trackAuthentication, trackEngagement } from '../utils/analytics';
import { getPopularCountries, getAllCountries, searchCountries } from '../utils/countryCodes';
import { useMetaTags } from '../utils/useMetaTags';

const Signup = () => {
  useMetaTags({
    title: 'Sign Up - CivilsCoach',
    description: 'Create your CivilsCoach account. Join thousands of aspirants preparing for civil services.',
    image: 'https://civilscoach.com/og-image.jpg',
    url: 'https://civilscoach.com/signup'
  });

  const navigate = useNavigate();
  const { sendSignupOTP, verifySignupOTP, completeSignup, loading, isAuthenticated } = useAuth();

  // Form state management
  const [step, setStep] = useState(1); // 1: Contact Info, 2: OTP Verification, 3: Password & Profile
  const [sessionData, setSessionData] = useState(null);
  
  // Step 1: Contact Information
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phoneNumber: '',
    fullName: ''
  });

  // Step 2: OTP Verification
  const [otpData, setOtpData] = useState({
    emailOTP: '',
    phoneOTP: ''
  });
  const [otpStatus, setOtpStatus] = useState({
    emailVerified: false,
    phoneVerified: false
  });

  // Step 3: Password & Profile
  const [profileData, setProfileData] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [loading2, setLoading2] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  // Timer for OTP expiry
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Country selector
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const dropdownRef = useRef(null);

  // Analytics
  const [startTime] = useState(Date.now());
  const [formInteractions, setFormInteractions] = useState({
    emailFocused: false,
    phoneFocused: false,
    nameFocused: false,
    passwordFocused: false
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
    
    // Track signup page load
    trackAuthentication('signup_page_loaded', {
      label: 'new_flow'
    });
  }, [isAuthenticated, navigate]);

  // Initialize country selection with India as default
  useEffect(() => {
    const popularCountries = getPopularCountries();
    const indiaCountry = popularCountries.find(country => country.country === 'IN');
    if (indiaCountry) {
      setSelectedCountry(indiaCountry);
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

  // Password strength checker
  useEffect(() => {
    if (profileData.password) {
      setPasswordStrength(getPasswordStrength(profileData.password));
    } else {
      setPasswordStrength(null);
    }
  }, [profileData.password]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Country selector functions
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
    
    trackEngagement('country_selected', {
      label: `${country.name}_${country.country}`,
      value: country.country === 'IN' ? 1 : 0
    });
    
    // Clear phone validation error when country changes
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  // Format phone for display
  const formatPhoneForDisplay = () => {
    if (!selectedCountry || !contactInfo.phoneNumber) return '';
    
    const cleanPhone = contactInfo.phoneNumber.replace(/[^\d]/g, '');
    if (selectedCountry.country === 'IN' && cleanPhone.length === 10) {
      return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    }
    return `${selectedCountry.dial_code} ${cleanPhone}`;
  };

  // Form field focus tracking
  const handleEmailFocus = () => {
    if (!formInteractions.emailFocused) {
      trackEngagement('signup_email_focused', { label: 'new_flow' });
      setFormInteractions(prev => ({ ...prev, emailFocused: true }));
    }
  };

  const handlePhoneFocus = () => {
    if (!formInteractions.phoneFocused) {
      trackEngagement('signup_phone_focused', { label: 'new_flow' });
      setFormInteractions(prev => ({ ...prev, phoneFocused: true }));
    }
  };

  const handleNameFocus = () => {
    if (!formInteractions.nameFocused) {
      trackEngagement('signup_name_focused', { label: 'new_flow' });
      setFormInteractions(prev => ({ ...prev, nameFocused: true }));
    }
  };

  const handlePasswordFocus = () => {
    if (!formInteractions.passwordFocused) {
      trackEngagement('signup_password_focused', { label: 'new_flow' });
      setFormInteractions(prev => ({ ...prev, passwordFocused: true }));
    }
  };

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};

    if (!contactInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!contactInfo.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const fullPhone = `${selectedCountry?.dial_code || ''}${contactInfo.phoneNumber}`;
      if (!validatePhoneNumber(fullPhone)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    }

    if (!contactInfo.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (contactInfo.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!otpStatus.emailVerified && !otpData.emailOTP.trim()) {
      newErrors.emailOTP = 'Email OTP is required';
    } else if (!otpStatus.emailVerified && !/^\d{6}$/.test(otpData.emailOTP)) {
      newErrors.emailOTP = 'Email OTP must be 6 digits';
    }

    if (!otpStatus.phoneVerified && !otpData.phoneOTP.trim()) {
      newErrors.phoneOTP = 'Phone OTP is required';
    } else if (!otpStatus.phoneVerified && !/^\d{6}$/.test(otpData.phoneOTP)) {
      newErrors.phoneOTP = 'Phone OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!profileData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(profileData.password)) {
      newErrors.password = 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character';
    }

    if (!profileData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (profileData.password !== profileData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step handlers
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) return;

    setLoading2(true);
    setErrors({});
    
    try {
      const fullPhone = `${selectedCountry?.dial_code || ''}${contactInfo.phoneNumber}`;
      
      trackAuthentication('signup_attempt', {
        label: 'step1_contact_info',
        value: Math.round((Date.now() - startTime) / 1000)
      });

      const response = await sendSignupOTP(contactInfo.email, fullPhone);
      setSessionData(response);
      setTimeRemaining(600); // 10 minutes
      setStep(2);

      trackAuthentication('signup_otp_sent', {
        label: 'success'
      });
    } catch (error) {
      setErrors({ submit: error.message });
      trackAuthentication('signup_failed', {
        label: 'step1_' + (error.message || 'unknown_error')
      });
    } finally {
      setLoading2(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading2(true);
    setErrors({});
    
    try {
      const response = await verifySignupOTP(
        sessionData.sessionKey,
        otpData.emailOTP,
        otpData.phoneOTP
      );
      
      setOtpStatus({
        emailVerified: response.emailVerified,
        phoneVerified: response.phoneVerified
      });

      if (response.emailVerified && response.phoneVerified) {
        setStep(3);
        trackAuthentication('signup_otp_verified', {
          label: 'both_verified'
        });
        
        // Auto-populate names from fullName
        const nameParts = contactInfo.fullName.trim().split(' ');
        setProfileData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || ''
        }));
      } else {
        trackAuthentication('signup_otp_verified', {
          label: 'partial_verified'
        });
      }
    } catch (error) {
      setErrors({ submit: error.message });
      trackAuthentication('signup_failed', {
        label: 'step2_' + (error.message || 'unknown_error')
      });
    } finally {
      setLoading2(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    setLoading2(true);
    setErrors({});
    
    try {
      await completeSignup(
        sessionData.sessionKey,
        profileData.password,
        profileData.firstName,
        profileData.lastName
      );
      
      trackAuthentication('signup_success', {
        label: 'account_created'
      });

      // Navigation will be handled by useAuth redirect effect
    } catch (error) {
      setErrors({ submit: error.message });
      trackAuthentication('signup_failed', {
        label: 'step3_' + (error.message || 'unknown_error')
      });
    } finally {
      setLoading2(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async (type = 'both') => {
    try {
      const { authService } = useAuth();
      await authService.resendOTP(sessionData.sessionKey, type);
      setTimeRemaining(600); // Reset timer
      setResendCooldown(60); // 1 minute cooldown
      setErrors({});
      
      trackEngagement('signup_otp_resend', {
        label: type
      });
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  // Step 1: Contact Information
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center">
                 {/* Civils Coach Branding */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Welcome to Civils Coach
            </h1>
            <p className="text-gray-600">Your UPSC preparation platform</p>
          </div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Join thousands of aspirants preparing for civil services</p>
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-lg shadow-xl border p-8">
              {/* Error Message */}
              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleStep1Submit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name
                    </div>
                  </label>
                  <input
                    type="text"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    onFocus={handleNameFocus}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    onFocus={handleEmailFocus}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Phone Number with Country Selector */}
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
                        className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="text-lg mr-2">{selectedCountry?.flag || '🇮🇳'}</span>
                        <span className="text-sm font-medium">{selectedCountry?.dial_code || '+91'}</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Country Dropdown */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          <div className="p-3 border-b">
                            <input
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {(() => {
                            const { popular, all } = getFilteredCountries();
                            return (
                              <>
                                {popular.length > 0 && (
                                  <>
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Popular</div>
                                    {popular.map((country) => (
                                      <button
                                        key={`popular-${country.country}`}
                                        type="button"
                                        onClick={() => handleCountrySelect(country)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                                      >
                                        <span className="text-lg mr-3">{country.flag}</span>
                                        <span className="flex-1">{country.name}</span>
                                        <span className="text-gray-500">{country.dial_code}</span>
                                      </button>
                                    ))}
                                    <hr className="my-1" />
                                  </>
                                )}
                                {all.map((country) => (
                                  <button
                                    key={`all-${country.country}`}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                                  >
                                    <span className="text-lg mr-3">{country.flag}</span>
                                    <span className="flex-1">{country.name}</span>
                                    <span className="text-gray-500">{country.dial_code}</span>
                                  </button>
                                ))}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      value={contactInfo.phoneNumber}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      onFocus={handlePhoneFocus}
                      className={`flex-1 px-4 py-3 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={selectedCountry?.country === 'IN' ? '9876543210' : 'Phone number'}
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>}
                  {selectedCountry && contactInfo.phoneNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      Full number: {formatPhoneForDisplay()}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading2 || loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading2 || loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create Account & Verify
                    </div>
                  )}
                </button>

                {/* Terms */}
                <p className="text-center text-xs text-gray-500">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link>
                </p>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      className="font-medium text-blue-600 hover:text-blue-500"
                      onClick={() => trackEngagement('login_link_clicked', { label: 'from_signup' })}
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: OTP Verification
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
              <p className="text-gray-600">We've sent verification codes to secure your account</p>
            </div>

            {/* Main Card */}
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
                    <span className="text-blue-800">{contactInfo.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-blue-800">{formatPhoneForDisplay()}</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleStep2Submit} className="space-y-6">
                {/* Email OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Verification Code
                      {otpStatus.emailVerified && (
                        <span className="ml-2 text-green-600 font-medium">✓ Verified</span>
                      )}
                    </div>
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    disabled={otpStatus.emailVerified}
                    value={otpData.emailOTP}
                    onChange={(e) => setOtpData(prev => ({ ...prev, emailOTP: e.target.value.replace(/\D/g, '') }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl font-mono tracking-widest ${
                      otpStatus.emailVerified ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                  />
                  {errors.emailOTP && <p className="text-red-600 text-sm mt-1">{errors.emailOTP}</p>}
                </div>

                {/* SMS OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      SMS Verification Code
                      {otpStatus.phoneVerified && (
                        <span className="ml-2 text-green-600 font-medium">✓ Verified</span>
                      )}
                    </div>
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    disabled={otpStatus.phoneVerified}
                    value={otpData.phoneOTP}
                    onChange={(e) => setOtpData(prev => ({ ...prev, phoneOTP: e.target.value.replace(/\D/g, '') }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl font-mono tracking-widest ${
                      otpStatus.phoneVerified ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                  />
                  {errors.phoneOTP && <p className="text-red-600 text-sm mt-1">{errors.phoneOTP}</p>}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading2 || loading || (!otpData.emailOTP && !otpStatus.emailVerified) || (!otpData.phoneOTP && !otpStatus.phoneVerified)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading2 || loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>

                  {/* Resend Options */}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleResendOTP('email')}
                      disabled={resendCooldown > 0 || loading2}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
                    >
                      {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Email OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResendOTP('sms')}
                      disabled={resendCooldown > 0 || loading2}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
                    >
                      {resendCooldown > 0 ? `Resend SMS (${resendCooldown}s)` : 'Resend SMS OTP'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading2}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
                  >
                    Back to Contact Info
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600">
              <p>Secure verification powered by email and SMS</p>
              <p className="mt-1">Having trouble? Contact support for assistance</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Password & Profile
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
            <p className="text-gray-600">Create a secure password and finalize your account</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-xl border p-8">
            {/* Error Message */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleStep3Submit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={profileData.password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, password: e.target.value }))}
                    onFocus={handlePasswordFocus}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm font-medium text-${passwordStrength.color}-600`}>
                        {passwordStrength.strength}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${passwordStrength.color}-600 h-2 rounded-full transition-all`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="mt-1 text-xs text-gray-600">
                        Missing: {passwordStrength.feedback.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading2 || loading || !passwordStrength?.isValid}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading2 || loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create My Account
                  </div>
                )}
              </button>

              {/* Terms */}
              <p className="text-center text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;