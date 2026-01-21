import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, validateEmail, validatePhoneNumber } from '../utils/authService';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, isAuthenticated } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or phone
    password: ''
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [loading2, setLoading2] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'
  const [rememberEmail, setRememberEmail] = useState(true);

  // Auto-detect identifier type and load saved email
  useEffect(() => {
    // Try to load saved email
    const savedEmail = localStorage.getItem('civils_coach_remembered_email');
    if (savedEmail && !formData.identifier) {
      setFormData(prev => ({ ...prev, identifier: savedEmail }));
      setLoginType('email');
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Auto-detect identifier type based on input
  useEffect(() => {
    const identifier = formData.identifier.trim();
    if (identifier) {
      if (validateEmail(identifier)) {
        setLoginType('email');
      } else if (validatePhoneNumber(identifier)) {
        setLoginType('phone');
      } else {
        setLoginType('email'); // Default to email for partial input
      }
    }
  }, [formData.identifier]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else {
      const isEmail = validateEmail(formData.identifier);
      const isPhone = validatePhoneNumber(formData.identifier);
      
      if (!isEmail && !isPhone) {
        newErrors.identifier = 'Please enter a valid email address or phone number';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading2(true);
    setErrors({});

    try {
      await login(formData.identifier, formData.password);
      
      // Save email if user chose to remember and it's an email
      if (rememberEmail && validateEmail(formData.identifier)) {
        localStorage.setItem('civils_coach_remembered_email', formData.identifier);
      }

      // Navigation will be handled by useAuth redirect effect
    } catch (error) {
      setErrors({ 
        submit: error.message || 'Login failed. Please check your credentials and try again.' 
      });
      
      // Clear password on error
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading2(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Login Form (Mobile: Full width, Desktop: 30%) */}
        <div className="w-full lg:w-[30%] flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12 order-2 lg:order-1">
          <div className="w-full max-w-md space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4 lg:mb-6">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-lg lg:text-xl font-bold">CivilsCoach</span>
              </Link>
              
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Welcome Back!</h1>
              <p className="text-gray-600 mt-2 text-sm lg:text-base">Sign in to continue your UPSC journey</p>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* Login Form */}
            <div className="bg-white rounded-xl shadow-lg border p-4 lg:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                {/* Identifier Input */}
                <div>
                  <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      {loginType === 'phone' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      )}
                      {loginType === 'phone' ? 'Phone Number' : 'Email Address'}
                    </div>
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type={loginType === 'phone' ? 'tel' : 'email'}
                    autoComplete={loginType === 'phone' ? 'tel' : 'email'}
                    required
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.identifier ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email or phone number"
                  />
                  {errors.identifier && (
                    <p className="text-red-600 text-sm mt-1">{errors.identifier}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors pr-12 ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-email"
                      name="remember-email"
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-email" className="ml-2 block text-sm text-gray-700">
                      Remember email
                    </label>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
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
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Signup Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create one here
                </Link>
              </p>
            </div>

            {/* Try Quiz Link */}
            <div className="text-center">
              <Link 
                to="/2025-snapshot" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try 2025 Year-End Quiz
              </Link>
            </div>

            {/* Security Note */}
            <div className="text-center text-xs text-gray-500">
              <p>🔒 Your data is secure with industry-standard encryption</p>
            </div>
          </div>
        </div>

        {/* Right Side - Hero Section (Mobile: Full width, Desktop: 70%) */}
        <div className="w-full lg:w-[70%] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 lg:py-12 order-1 lg:order-2">
          <div className="max-w-4xl text-white w-full">
            {/* Main Hero Title */}
            <div className="text-center mb-8 lg:mb-16">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 lg:mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Civils Coach
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed px-4 lg:px-0">
                Your comprehensive platform for UPSC Civil Services preparation. Master every aspect of your journey with our advanced tools and insights.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
              {/* PYQs & Practice Tests */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-8 border border-white/20">
                <div className="flex items-center mb-4 lg:mb-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3 lg:mr-4">
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg lg:text-2xl font-semibold">Question Banks</h3>
                </div>
                <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-blue-100">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Previous Year Questions (PYQs)
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Comprehensive Mock Tests
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Targeted Practice Tests
                  </li>
                </ul>
              </div>

              {/* Test Analysis */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-8 border border-white/20">
                <div className="flex items-center mb-4 lg:mb-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3 lg:mr-4">
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg lg:text-2xl font-semibold">Smart Analytics</h3>
                </div>
                <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-blue-100">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Topic-wise Performance Reports
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sub-topic Deep Analysis
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Individual Test Reports
                  </li>
                </ul>
              </div>

              {/* Paper Coverage */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-8 border border-white/20">
                <div className="flex items-center mb-4 lg:mb-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3 lg:mr-4">
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg lg:text-2xl font-semibold">Complete Syllabus</h3>
                </div>
                <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-blue-100">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    General Studies (Paper I-IV)
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    CSAT (Paper II)
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prelims & Mains Coverage
                  </li>
                </ul>
              </div>

              {/* Progress Tracking */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-8 border border-white/20">
                <div className="flex items-center mb-4 lg:mb-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3 lg:mr-4">
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-lg lg:text-2xl font-semibold">Progress Tracking</h3>
                </div>
                <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-blue-100">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Detailed Performance Metrics
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Weakness Identification
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Study Plan Optimization
                  </li>
                </ul>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-8 lg:mt-16">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-2xl px-4 lg:px-8 py-3 lg:py-4 border border-white/30">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-300 mr-3 lg:mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-sm lg:text-lg font-medium">
                  Join thousands of successful UPSC aspirants on their journey to excellence
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;