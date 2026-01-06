import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, validateEmail, validatePhoneNumber } from '../utils/authService';
import { trackAuthentication, trackEngagement } from '../utils/analytics';
import { emailUtils } from '../utils/emailUtils';
import { useMetaTags } from '../utils/useMetaTags';

const Login = () => {
  useMetaTags({
    title: 'Login - CivilsCoach',
    description: 'Sign in to your CivilsCoach account. Access practice tests, track progress, and master UPSC preparation.',
    image: 'https://civilscoach.com/og-image.jpg',
    url: 'https://civilscoach.com/login'
  });

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
  const [formInteractions, setFormInteractions] = useState({
    identifierFocused: false,
    passwordFocused: false
  });
  const [startTime] = useState(Date.now());

  // Auto-detect identifier type and load saved email
  useEffect(() => {
    // Try to load saved email
    const savedEmail = emailUtils.getEmail();
    if (savedEmail && !formData.identifier) {
      setFormData(prev => ({ ...prev, identifier: savedEmail }));
      setLoginType('email');
    }

    // Track page load
    trackAuthentication('login_page_loaded', {
      label: 'password_login'
    });
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

  // Form field focus tracking
  const handleIdentifierFocus = () => {
    if (!formInteractions.identifierFocused) {
      trackEngagement('login_identifier_focused', {
        label: 'password_login'
      });
      setFormInteractions(prev => ({ ...prev, identifierFocused: true }));
    }
  };

  const handlePasswordFocus = () => {
    if (!formInteractions.passwordFocused) {
      trackEngagement('login_password_focused', {
        label: 'password_login'
      });
      setFormInteractions(prev => ({ ...prev, passwordFocused: true }));
    }
  };

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
      // Track login attempt
      trackAuthentication('login_attempt', {
        label: loginType === 'email' ? 'email_login' : 'phone_login',
        value: Math.round((Date.now() - startTime) / 1000)
      });

      await login(formData.identifier, formData.password);
      
      // Save email if user chose to remember and it's an email
      if (rememberEmail && validateEmail(formData.identifier)) {
        emailUtils.saveEmail(formData.identifier);
      }

      // Track successful login
      trackAuthentication('login_success', {
        label: 'password_login'
      });

      // Navigation will be handled by useAuth redirect effect
    } catch (error) {
      // Track failed login
      trackAuthentication('login_failed', {
        label: error.message || 'unknown_error'
      });

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

  // Handle forgot password (placeholder for future implementation)
  const handleForgotPassword = () => {
    trackEngagement('forgot_password_clicked', {
      label: 'password_login'
    });
    // TODO: Implement forgot password flow
    alert('Forgot password feature coming soon!');
  };

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to continue your preparation journey</p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-lg shadow-xl border p-8">
            {/* Success Message */}
            {location.state?.message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-700 text-sm">{location.state.message}</p>
                </div>
              </div>
            )}

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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  onFocus={handleIdentifierFocus}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
                    onFocus={handlePasswordFocus}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors pr-12 ${
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

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
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

              {/* Signup Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => trackEngagement('signup_link_clicked', { label: 'from_login' })}
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Alternative Options */}
          <div className="bg-white rounded-lg shadow-xl border p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">Or explore without signing in</p>
              <Link 
                to="/2025-snapshot" 
                onClick={() => trackEngagement('try_quiz_clicked', { label: 'from_login' })}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try 2025 Year-End Quiz
              </Link>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="h-6 w-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  New to Civils Coach?
                </h3>
                <p className="text-sm text-blue-700">
                  Create your free account to access practice tests, track your progress, and get personalized recommendations for your civil services preparation.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p>🔒 Your data is secure with us. We use industry-standard encryption.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;