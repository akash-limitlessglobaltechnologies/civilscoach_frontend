import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authService';
import { getPopularCountries, getAllCountries, searchCountries, getCountryDisplayText } from '../utils/countryCodes';

const OTPLogin = () => {
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
  
  // Country selector states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  const { authService } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Initialize country selection with India as default
  useEffect(() => {
    const popularCountries = getPopularCountries();
    const indiaCountry = popularCountries.find(country => country.country === 'IN');
    if (indiaCountry) {
      setSelectedCountry(indiaCountry);
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
    // Clear phone validation error when country changes
    if (validationErrors.phoneNumber) {
      setValidationErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    
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
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Format phone number with country code
      const fullPhoneNumber = selectedCountry ? 
        `${selectedCountry.code}${formData.phoneNumber}` : 
        formData.phoneNumber;

      const response = await authService.sendOTP(formData.email, fullPhoneNumber);
      
      setSessionKey(response.sessionKey);
      setStep(2);
      setTimeRemaining(600); // Reset timer to 10 minutes
      setSuccess('OTP sent to your email and phone number');
    } catch (error) {
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpData.emailOTP || !otpData.smsOTP) {
      setError('Please enter both email and SMS OTP');
      return;
    }
    
    if (otpData.emailOTP.length !== 6 || otpData.smsOTP.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await authService.verifyOTPAndLogin(sessionKey, otpData.emailOTP, otpData.smsOTP);
      
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
    } catch (error) {
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
      
      await authService.resendOTP(sessionKey, type);
      
      setResendCooldown(30); // 30 second cooldown
      setSuccess(`OTP resent to your ${type === 'both' ? 'email and phone' : type}`);
      setTimeRemaining(600); // Reset timer
    } catch (error) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
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
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 1 ? 'Secure Login' : 'Verify Your Identity'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 
              ? 'Enter your email and phone number to receive verification codes'
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
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
                {validationErrors.email && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone Number Field with Country Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
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
                    Sending OTP...
                  </div>
                ) : (
                  'Send Verification Code'
                )}
              </button>
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
                  Email Verification Code
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
                  SMS Verification Code
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