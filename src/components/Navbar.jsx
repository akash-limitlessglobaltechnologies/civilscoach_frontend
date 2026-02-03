import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, authService } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Don't show navbar on login page
  if (location.pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      setShowUserMenu(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Format phone number for display (e.g., +91 98765 43210)
    if (phone.startsWith('+91') && phone.length === 13) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  const handleTestTypeNavigation = (type) => {
    if (type === 'untimed-practice') {
      // Navigate to home with untimed practice state
      navigate('/', { state: { activeTab: 'untimed-practice', showSubjectSelection: true } });
    } else {
      // Navigate to home with specific test type
      navigate('/', { state: { activeTab: type } });
    }
    setShowMobileMenu(false);
  };

  const navigationItems = [
    {
      type: 'test-nav',
      label: 'All Tests',
      value: 'all',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      onClick: () => handleTestTypeNavigation('all')
    },
    {
      type: 'test-nav',
      label: 'PYQ',
      value: 'PYQ',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => handleTestTypeNavigation('PYQ')
    },
    {
      type: 'test-nav',
      label: 'Mock Test',
      value: 'Assessment',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      onClick: () => handleTestTypeNavigation('Assessment')
    },
    {
      type: 'test-nav',
      label: 'Practice MCQs',
      value: 'untimed-practice',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => handleTestTypeNavigation('untimed-practice')
    },
    {
      type: 'page',
      path: '/performance',
      label: 'Analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="hidden xs:block">
                  <span className="text-lg font-bold text-gray-800">Civils Coach</span>
                  <div className="text-xs text-gray-500 hidden sm:block">Test Platform</div>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item, index) => (
                  item.type === 'test-nav' ? (
                    <button
                      key={item.value}
                      onClick={item.onClick}
                      className="flex items-center space-x-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                    >
                      {item.icon}
                      <span className={item.label.length > 8 ? 'hidden xl:inline' : ''}>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 ${
                        location.pathname === item.path
                          ? 'text-blue-600 bg-blue-50 shadow-sm'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      } whitespace-nowrap`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )
                ))}
              </div>

              {/* User Authentication Section */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <div className="bg-green-100 p-1 rounded-full">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-left hidden sm:block">
                        <div className="text-xs sm:text-sm font-medium text-green-800 truncate max-w-20 lg:max-w-none">
                          {user.displayName || user.email?.split('@')[0] || 'User'}
                        </div>
                        <div className="text-xs text-green-600 hidden lg:block">
                          {formatPhoneNumber(user.phoneNumber)}
                        </div>
                      </div>
                    </div>
                    <svg 
                      className={`w-3 h-3 sm:w-4 sm:h-4 text-green-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Enhanced User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
                      {/* User Profile Header */}
                      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {user.displayName || 'User'}
                            </div>
                            <div className="text-sm text-gray-600 truncate">{user.email}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {formatPhoneNumber(user.phoneNumber)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Stats */}
                        {user.statistics && (
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white bg-opacity-60 rounded-lg px-2 py-1">
                              <div className="text-sm font-bold text-blue-600">
                                {user.statistics.testsTaken || 0}
                              </div>
                              <div className="text-xs text-gray-600">Tests</div>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg px-2 py-1">
                              <div className="text-sm font-bold text-blue-600">
                                {user.statistics.avgScore || 0}%
                              </div>
                              <div className="text-xs text-gray-600">Avg Score</div>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg px-2 py-1">
                              <div className="text-sm font-bold text-blue-600">
                                {user.statistics.streak || 0}
                              </div>
                              <div className="text-xs text-gray-600">Streak</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Menu Links */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 sm:px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile Settings</span>
                        </Link>

                        <Link
                          to="/performance"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 sm:px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Performance Analytics</span>
                        </Link>

                        {/* Subscription Info */}
                        {user.subscription && (
                          <div className="mx-4 sm:mx-6 my-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Plan</span>
                              <span className={`font-medium px-2 py-1 rounded text-xs ${
                                user.subscription.plan === 'Premium' ? 'bg-purple-100 text-purple-600' :
                                user.subscription.plan === 'Basic' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {user.subscription.plan}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-gray-600">Tests Remaining</span>
                              <span className="font-medium text-gray-900">
                                {user.subscription.remainingTests === -1 ? '∞' : user.subscription.remainingTests}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="border-t border-gray-100 my-2"></div>
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowLogoutModal(true);
                          }}
                          className="flex items-center space-x-3 w-full px-4 sm:px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden xs:inline">Login</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ml-1"
              >
                <span className="sr-only">Open main menu</span>
                {!showMobileMenu ? (
                  <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200">
              <div className="pt-2 pb-3 space-y-1 px-2">
                {navigationItems.map((item, index) => (
                  item.type === 'test-nav' ? (
                    <button
                      key={item.value}
                      onClick={item.onClick}
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === item.path
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click outside to close menus */}
      {(showUserMenu || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowUserMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Logout Confirmation
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to logout? You will need to verify your email and phone number again to access the platform.
            </p>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Logging out...</span>
                  </div>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;