import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { emailUtils } from '../utils/emailUtils';

const Navbar = () => {
  const location = useLocation();
  const [currentEmail, setCurrentEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load email on component mount
    const email = emailUtils.getEmail();
    if (email) {
      setCurrentEmail(email);
    }
  }, []);

  const handleEmailEdit = () => {
    setNewEmail(currentEmail);
    setEmailError('');
    setShowEmailModal(true);
  };

  const handleEmailSave = () => {
    if (!newEmail.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!emailUtils.validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    
    try {
      emailUtils.saveEmail(newEmail.trim());
      setCurrentEmail(newEmail.trim());
      setShowEmailModal(false);
      setEmailError('');
    } catch (error) {
      setEmailError('Failed to save email');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailClear = () => {
    if (window.confirm('Are you sure you want to remove your saved email? You will need to enter it again for tests and performance tracking.')) {
      emailUtils.clearEmail();
      setCurrentEmail('');
      setShowEmailModal(false);
    }
  };

  const daysRemaining = emailUtils.getDaysRemaining();
  
  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-800">IAS Prep</span>
                  <span className="block text-xs text-gray-500">Academic Testing Platform</span>
                </div>
              </Link>
            </div>

            {/* Email Display and Navigation */}
            <div className="flex items-center space-x-4">
              {/* Email Section */}
              {currentEmail && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span className="text-sm text-green-800 font-medium">{currentEmail}</span>
                  <button
                    onClick={handleEmailEdit}
                    className="text-green-600 hover:text-green-800"
                    title={`Edit email (expires in ${daysRemaining} days)`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex items-center space-x-1">
                <Link 
                  to="/" 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === '/' 
                      ? 'text-blue-600 bg-blue-50 shadow-sm' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
                  </svg>
                  <span>Tests</span>
                </Link>
                <Link 
                  to="/performance" 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === '/performance' 
                      ? 'text-blue-600 bg-blue-50 shadow-sm' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Performance</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Email Edit Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Email Address</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                />
              </div>

              {emailError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {emailError}
                </div>
              )}

              {currentEmail && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm">
                  Email expires in {daysRemaining} days
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleEmailSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Email'}
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              {currentEmail && (
                <button
                  onClick={handleEmailClear}
                  className="w-full text-red-600 text-sm hover:text-red-800 py-2"
                >
                  Remove Saved Email
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;