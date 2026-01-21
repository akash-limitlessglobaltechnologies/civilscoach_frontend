import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, validateEmail, validatePhoneNumber, validatePassword, getPasswordStrength, validateOTP } from '../utils/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, resendOTP, loading, isAuthenticated } = useAuth();

  // Form state management
  const [step, setStep] = useState(1); // 1: Enter identifier, 2: OTP verification & new password
  const [sessionData, setSessionData] = useState(null);

  // Step 1: Identifier input
  const [identifierData, setIdentifierData] = useState({
    identifier: ''
  });

  // Step 2: OTP verification and password reset
  const [resetData, setResetData] = useState({
    emailOTP: '',
    phoneOTP: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [otpStatus, setOtpStatus] = useState({
    emailVerified: false,
    phoneVerified: false
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [loading2, setLoading2] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [identifierType, setIdentifierType] = useState('email');

  // Timer for OTP expiry
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Debounced validation function to prevent excessive re-renders
  const debouncedValidation = useCallback((identifier) => {
    if (!identifier || identifier.length < 3) {
      setIdentifierType('email');
      return;
    }

    // Limit email length to prevent performance issues
    if (identifier.length > 100) {
      setIdentifierType('email');
      return;
    }

    try {
      if (validateEmail(identifier)) {
        setIdentifierType('email');
      } else if (validatePhoneNumber(identifier)) {
        setIdentifierType('phone');
      } else {
        setIdentifierType('email'); // Default to email for partial input
      }
    } catch (error) {
      console.error('Validation error:', error);
      setIdentifierType('email');
    }
  }, []);

  // Auto-detect identifier type with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedValidation(identifierData.identifier.trim());
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [identifierData.identifier, debouncedValidation]);

  // Password strength checker with debouncing
  useEffect(() => {
    if (resetData.newPassword && resetData.newPassword.length >= 1) {
      const timeoutId = setTimeout(() => {
        try {
          setPasswordStrength(getPasswordStrength(resetData.newPassword));
        } catch (error) {
          console.error('Password strength error:', error);
          setPasswordStrength(null);
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    } else {
      setPasswordStrength(null);
    }
  }, [resetData.newPassword]);

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

  // Step 1 validation with length limits
  const validateStep1 = () => {
    const newErrors = {};
    const identifier = identifierData.identifier.trim();

    if (!identifier) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (identifier.length > 100) {
      newErrors.identifier = 'Email address is too long (max 100 characters)';
    } else if (identifier.length < 3) {
      newErrors.identifier = 'Please enter at least 3 characters';
    } else {
      try {
        const isEmail = validateEmail(identifier);
        const isPhone = validatePhoneNumber(identifier);
        
        if (!isEmail && !isPhone) {
          newErrors.identifier = 'Please enter a valid email address or phone number';
        }
      } catch (error) {
        newErrors.identifier = 'Invalid format. Please check your input.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const newErrors = {};

    if (!resetData.emailOTP.trim()) {
      newErrors.emailOTP = 'Email OTP is required';
    } else if (!validateOTP(resetData.emailOTP)) {
      newErrors.emailOTP = 'Please enter a valid 6-digit OTP';
    }

    if (!resetData.phoneOTP.trim()) {
      newErrors.phoneOTP = 'Phone OTP is required';
    } else if (!validateOTP(resetData.phoneOTP)) {
      newErrors.phoneOTP = 'Please enter a valid 6-digit OTP';
    }

    if (!resetData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (!validatePassword(resetData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    if (!resetData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetData.newPassword !== resetData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Step 1: Send reset OTP
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) return;

    setLoading2(true);
    setErrors({});

    try {
      const result = await forgotPassword(identifierData.identifier);
      
      setSessionData({
        sessionKey: result.sessionKey,
        expiresAt: result.expiresAt,
        identifier: identifierData.identifier,
        identifierType
      });

      // Set timer
      const expiryTime = new Date(result.expiresAt).getTime();
      const currentTime = Date.now();
      const remainingTime = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
      setTimeRemaining(remainingTime);

      setStep(2);

    } catch (error) {
      setErrors({ 
        submit: error.message || 'Failed to send reset OTP. Please try again.' 
      });
    } finally {
      setLoading2(false);
    }
  };

  // Handle Step 2: Verify OTP and reset password
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading2(true);
    setErrors({});

    try {
      await resetPassword(
        sessionData.sessionKey, 
        resetData.emailOTP, 
        resetData.phoneOTP, 
        resetData.newPassword
      );

      // Show success and redirect
      setStep(3);

    } catch (error) {
      setErrors({ 
        submit: error.message || 'Password reset failed. Please check your OTPs and try again.' 
      });

      // Clear password fields on error
      setResetData(prev => ({ 
        ...prev, 
        newPassword: '', 
        confirmPassword: '' 
      }));
    } finally {
      setLoading2(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async (type = 'both') => {
    if (resendCooldown > 0) return;

    setLoading2(true);
    setErrors({});

    try {
      await resendOTP(sessionData.sessionKey, type);
      
      // Set resend cooldown (30 seconds)
      setResendCooldown(30);

    } catch (error) {
      setErrors({ 
        submit: error.message || 'Failed to resend OTP. Please try again.' 
      });
    } finally {
      setLoading2(false);
    }
  };

  // Optimized input change handler
  const handleIdentifierChange = useCallback((e) => {
    const value = e.target.value;
    
    // Prevent excessive length
    if (value.length > 100) return;
    
    setIdentifierData(prev => ({ ...prev, identifier: value }));
    
    // Clear errors
    if (errors.identifier) {
      setErrors(prev => ({ ...prev, identifier: '' }));
    }
  }, [errors.identifier]);

  // Step 1: Enter identifier
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-800 flex">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-blue-100 text-sm">Enter your email or phone number to receive reset OTP</p>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              {/* Error Message */}
              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleStep1Submit} className="space-y-5">
                {/* Identifier Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Email or Phone Number
                    </div>
                  </label>
                  <input
                    type="text"
                    value={identifierData.identifier}
                    onChange={handleIdentifierChange}
                    maxLength={100} // Hard limit to prevent hanging
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 break-all ${
                      errors.identifier ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    style={{ 
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere'
                    }}
                    placeholder="Enter your email or phone number"
                    autoComplete="username"
                  />
                  {identifierType && identifierData.identifier.length >= 3 && identifierData.identifier.length <= 100 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Detected as: {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
                    </p>
                  )}
                  {identifierData.identifier.length > 100 && (
                    <p className="text-yellow-600 text-xs mt-1">
                      Maximum length reached (100 characters)
                    </p>
                  )}
                  {errors.identifier && <p className="text-red-600 text-sm mt-1">{errors.identifier}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading2 || loading || identifierData.identifier.length > 100}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading2 || loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Reset OTP
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-blue-100 hover:text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Info */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
          <div className="text-center text-white max-w-lg">
            <h3 className="text-3xl font-bold mb-6">Secure Password Reset</h3>
            <p className="text-blue-100 mb-8 leading-relaxed">
              We'll send verification codes to both your registered email and phone number 
              to ensure maximum security for your account.
            </p>
            <div className="space-y-4">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Dual factor verification</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-sm">End-to-end encryption</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm">Quick & secure process</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: OTP verification and password reset
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Verify & Reset</h2>
            <p className="text-blue-100 text-sm">
              Enter the OTP codes sent to your email and phone, then set your new password
            </p>
            {timeRemaining > 0 && (
              <p className="text-yellow-300 text-sm mt-2">
                ⏱️ Codes expire in: {formatTime(timeRemaining)}
              </p>
            )}
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleStep2Submit} className="space-y-5">
              {/* OTP Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email OTP
                    </div>
                  </label>
                  <input
                    type="text"
                    value={resetData.emailOTP}
                    onChange={(e) => setResetData(prev => ({ ...prev, emailOTP: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg font-mono tracking-wider ${
                      errors.emailOTP ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {errors.emailOTP && <p className="text-red-600 text-sm mt-1">{errors.emailOTP}</p>}
                </div>

                {/* Phone OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone OTP
                    </div>
                  </label>
                  <input
                    type="text"
                    value={resetData.phoneOTP}
                    onChange={(e) => setResetData(prev => ({ ...prev, phoneOTP: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-wider ${
                      errors.phoneOTP ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {errors.phoneOTP && <p className="text-red-600 text-sm mt-1">{errors.phoneOTP}</p>}
                </div>
              </div>

              {/* Resend OTP */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleResendOTP('both')}
                  disabled={resendCooldown > 0 || loading2}
                  className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : 'Resend OTP Codes'
                  }
                </button>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    New Password
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={resetData.newPassword}
                    onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 ${
                      errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs font-medium text-${passwordStrength.color}-600`}>
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
                {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading2 || loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Reset My Password
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-blue-100 hover:text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success message
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Success Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Password Reset Successful!</h2>
            <p className="text-green-100 text-lg leading-relaxed">
              Your password has been successfully reset. You can now login with your new password.
            </p>
          </div>

          {/* Login Button */}
          <div className="bg-white rounded-xl shadow-lg border p-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Go to Login
              </div>
            </button>
          </div>

          {/* Security Note */}
          <div className="text-center">
            <p className="text-green-100 text-sm">
              🔒 For security, consider updating your saved passwords in your browser or password manager.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ForgotPassword;