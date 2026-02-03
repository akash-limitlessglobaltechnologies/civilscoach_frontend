import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authService';
import { trackEngagement, trackConversion, trackAuthentication } from '../utils/analytics';
import axios from 'axios';
import { useMetaTags } from '../utils/useMetaTags';
import UntimedSubjectSelection from '../components/UntimedSubjectSelection';


const Home = () => {
  useMetaTags({
    title: 'CivilsCoach - UPSC Preparation Platform',
    description: 'Master UPSC Civil Services preparation with comprehensive test platform. Practice with Previous Year Questions, track progress, and achieve your goals.',
    image: 'https://civilscoach.com/og-image.jpg',
    url: 'https://civilscoach.com/'
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const [tests, setTests] = useState([]);
  const [attemptedTests, setAttemptedTests] = useState([]);
  const [typeStats, setTypeStats] = useState({ PYQ: 0, Practice: 0, Assessment: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all'); // 'all', 'GS', 'CSAT'
  const { isAuthenticated, user, authService } = useAuth();

  // NEW: Untimed practice modal state
  const [showUntimedPracticeModal, setShowUntimedPracticeModal] = useState(false);

  // Analytics tracking states
  const [startTime] = useState(Date.now());
  const [viewedTests, setViewedTests] = useState(new Set());
  const [hasScrolled, setHasScrolled] = useState(false);
  
  // Refs for intersection observer
  const testsGridRef = useRef(null);
  const testCardRefs = useRef([]);

  // Handle navigation state from navbar
  useEffect(() => {
    if (location.state) {
      const { activeTab, showSubjectSelection } = location.state;
      if (activeTab) {
        setCurrentTab(activeTab);
        if (activeTab === 'untimed-practice' && showSubjectSelection) {
          setShowUntimedPracticeModal(true);
        }
      }
      // Clear the state to prevent persistent state issues
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state]);

  // Area mapping for display
  const AREA_MAPPING = {
    1: 'Current Affairs',
    2: 'History',
    3: 'Polity',
    4: 'Economy',
    5: 'Geography',
    6: 'Ecology',
    7: 'General Science',
    8: 'Arts & Culture'
  };

  // Test type configurations with icons and colors
  const testTypes = [
    { 
      value: 'all', 
      label: 'All Tests', 
      description: 'View all available tests',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    { 
      value: 'PYQ', 
      label: 'Previous Year Questions', 
      description: 'Practice with real exam questions',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500'
    },
    { 
      value: 'Practice', 
      label: 'Practice Tests', 
      description: 'Build your skills with practice',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-500'
    },
    { 
      value: 'Assessment', 
      label: 'Mock Tests', 
      description: 'Build your skills with mock tests',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500'
    },
    { 
      value: 'untimed-practice', 
      label: 'Untimed Practice Test', 
      description: 'One-by-one question practice (New Feature)',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    },
  ];

  // Subject filter configurations
  const subjectFilters = [
    {
      value: 'all',
      label: 'All Subjects',
      description: 'Show all tests',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-500'
    },
    {
      value: 'GS',
      label: 'General Studies',
      description: 'GS Papers I-IV',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-500'
    },
    {
      value: 'CSAT',
      label: 'CSAT',
      description: 'Paper II - CSAT',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-500'
    }
  ];

  // Check if test is attempted based on performance data
  const isTestAttempted = (test) => {
    return attemptedTests.some(attempted => attempted.testName === test.name);
  };

  // Fetch attempted tests from performance
  const fetchAttemptedTests = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await authService.authenticatedRequest('/api/user/performance');
      if (response && response.testHistory) {
        setAttemptedTests(response.testHistory);
      }
    } catch (error) {
      console.error('Error fetching attempted tests:', error);
      // Don't show error as this is supplementary data
    }
  };

  // Analytics: Track page load and user status
  useEffect(() => {
    // Track home page visit
    trackEngagement('home_page_loaded', {
      label: isAuthenticated ? 'authenticated_user' : 'anonymous_user',
      value: isAuthenticated ? 1 : 0
    });

    // Track user authentication status
    if (isAuthenticated && user?.email) {
      trackAuthentication('authenticated_home_visit', {
        label: 'returning_user',
        value: 1
      });
    } else {
      trackConversion('anonymous_home_visit', {
        label: 'potential_signup',
        value: 0
      });
    }

    // Track session start time for time-on-page analytics
    const sessionStartTime = Date.now();
    
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
      trackEngagement('home_page_time_spent', {
        label: isAuthenticated ? 'authenticated' : 'anonymous',
        value: timeSpent
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, user]);

  // Analytics: Track scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled && window.scrollY > 200) {
        setHasScrolled(true);
        trackEngagement('home_page_scrolled', {
          label: isAuthenticated ? 'authenticated' : 'anonymous',
          value: Math.round(window.scrollY)
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled, isAuthenticated]);

  // Analytics: Track section visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Track individual test card views
            const testIndex = testCardRefs.current.findIndex(ref => ref === entry.target);
            if (testIndex !== -1 && !viewedTests.has(testIndex)) {
              setViewedTests(prev => new Set([...prev, testIndex]));
              const test = tests[testIndex];
              if (test) {
                trackEngagement('test_card_viewed', {
                  label: test.testType || 'unknown',
                  value: testIndex + 1
                });
              }
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe test cards
    testCardRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [tests, viewedTests, isAuthenticated]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = isAuthenticated ? '/api/tests' : '/api/tests';
      
      let response;
      if (isAuthenticated) {
        response = await authService.authenticatedRequest(endpoint);
      } else {
        response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${endpoint}`);
        response = response.data;
      }

      if (response && Array.isArray(response.tests)) {
        setTests(response.tests);
        
        // Calculate statistics
        const stats = response.tests.reduce((acc, test) => {
          const type = test.testType || 'Other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        setTypeStats(stats);

        // Track successful data load
        trackEngagement('tests_loaded_successfully', {
          label: isAuthenticated ? 'authenticated' : 'anonymous',
          value: response.tests.length
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load tests. Please check your internet connection and try again.');
      
      // Track error
      trackEngagement('tests_load_error', {
        label: error.response?.status?.toString() || 'unknown_error',
        value: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    if (isAuthenticated) {
      fetchAttemptedTests();
    }
  }, [isAuthenticated]);

  const filteredTests = tests.filter(test => {
    // Handle untimed practice tab separately
    if (currentTab === 'untimed-practice') {
      return false; // Don't show any tests for untimed practice tab
    }
    
    // Filter by test type
    if (currentTab !== 'all' && test.testType !== currentTab) {
      return false;
    }
    
    // Filter by subject
    if (subjectFilter === 'GS') {
      return test.paper?.includes('GS') || test.name?.includes('GS') || test.name?.toLowerCase().includes('general studies');
    } else if (subjectFilter === 'CSAT') {
      return test.paper?.includes('CSAT') || test.name?.includes('CSAT') || test.name?.toLowerCase().includes('csat');
    }
    
    return true;
  });

  // Simple debug for Mock Test issue
  if (currentTab === 'Assessment') {
    console.log(`Mock Test Debug - Total tests: ${tests.length}, Assessment tests: ${tests.filter(t => t.testType === 'Assessment').length}, Filtered: ${filteredTests.length}`);
  }

  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
    setSubjectFilter('all'); // Reset subject filter when changing tabs
    
    // Track tab navigation
    trackEngagement('tab_navigation', {
      label: `${getCurrentTypeConfig().label}_to_${getTestTypeConfig(newTab).label}`,
      value: 1
    });

    // Handle untimed practice tab
    if (newTab === 'untimed-practice') {
      setShowUntimedPracticeModal(true);
    }
  };

  const handleSubjectFilterChange = (newFilter) => {
    setSubjectFilter(newFilter);
    
    // Track filter usage
    trackEngagement('subject_filter_used', {
      label: `${getCurrentSubjectConfig().label}_to_${getSubjectConfig(newFilter).label}`,
      value: 1
    });
  };

  const handleStartTest = async (testId, test, event) => {
    event.preventDefault();
    
    if (!isAuthenticated) {
      // Track attempt to start test without authentication
      trackConversion('unauthenticated_test_attempt', {
        label: test?.testType || 'unknown_type',
        value: 0
      });
      
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please sign in to start taking tests and track your progress.'
        }
      });
      return;
    }

    try {
      // Track test start attempt
      trackConversion('test_start_attempt', {
        label: test?.testType || 'unknown_type',
        value: 1
      });
      
      navigate(`/test/${testId}`, { 
        state: { 
          testData: test,
          source: 'home_page',
          tab: currentTab,
          filter: subjectFilter
        }
      });
    } catch (error) {
      console.error('Error starting test:', error);
      
      // Track test start error
      trackEngagement('test_start_error', {
        label: 'navigation_error',
        value: 0
      });
    }
  };

  const handleSignInClick = () => {
    // Track sign-in button click from home page
    trackConversion('home_signin_click', {
      label: 'authentication_prompt',
      value: 1
    });
  };

  const handleRetry = () => {
    fetchTests();
    trackEngagement('retry_button_click', {
      label: 'manual_retry',
      value: 1
    });
  };

  // Helper functions
  const getCurrentTypeConfig = () => {
    return testTypes.find(type => type.value === currentTab) || testTypes[0];
  };

  const getTestTypeConfig = (testType) => {
    return testTypes.find(type => type.value === testType) || {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-500'
    };
  };

  const getCurrentSubjectConfig = () => {
    return subjectFilters.find(filter => filter.value === subjectFilter) || subjectFilters[0];
  };

  const getSubjectConfig = (filterValue) => {
    return subjectFilters.find(filter => filter.value === filterValue) || subjectFilters[0];
  };

  const getTestTypeIcon = (testType) => {
    switch(testType) {
      case 'PYQ':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Practice':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
    }
  };

  const getAreaBreakdown = (test) => {
    if (!test.questions || !Array.isArray(test.questions)) {
      return {};
    }

    return test.questions.reduce((breakdown, question) => {
      const area = AREA_MAPPING[question.area] || 'Other';
      breakdown[area] = (breakdown[area] || 0) + 1;
      return breakdown;
    }, {});
  };

  const getAreaColor = (area) => {
    const colors = {
      'Current Affairs': 'bg-red-100 text-red-700',
      'History': 'bg-amber-100 text-amber-700',
      'Polity': 'bg-blue-100 text-blue-700',
      'Economy': 'bg-green-100 text-green-700',
      'Geography': 'bg-indigo-100 text-indigo-700',
      'Ecology': 'bg-emerald-100 text-emerald-700',
      'General Science': 'bg-purple-100 text-purple-700',
      'Arts & Culture': 'bg-pink-100 text-pink-700'
    };
    return colors[area] || 'bg-gray-100 text-gray-700';
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            UPSC Test Platform
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-2 sm:px-4">
            Practice with authentic questions, track your progress, and ace your civil services preparation
          </p>
        </div>

        {/* Subject Filters */}
        {currentTab !== 'untimed-practice' && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center mb-6 sm:mb-8">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <span className="text-sm font-medium text-gray-700 flex items-center mr-2 hidden sm:inline">
                Filter by Subject:
              </span>
              {subjectFilters.map((filter) => {
                const isActive = subjectFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => handleSubjectFilterChange(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? `${filter.color} ${filter.bgColor}`
                        : 'text-gray-500 bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}



        {/* Untimed Practice Content */}
        {currentTab === 'untimed-practice' && (
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
                <div className="flex justify-center mb-6">
                  <div className="bg-orange-100 p-4 rounded-full">
                    <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Untimed Practice Mode
                </h2>
                <p className="text-gray-600 mb-6 text-lg">
                  Practice questions one by one without time pressure. Perfect for learning and understanding concepts deeply.
                </p>
                <button
                  onClick={() => setShowUntimedPracticeModal(true)}
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-lg"
                >
                  Choose Subject & Start Practice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && currentTab !== 'untimed-practice' && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tests...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && currentTab !== 'untimed-practice' && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 text-sm">{error}</span>
                <button
                  onClick={handleRetry}
                  className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tests Grid */}
        {currentTab !== 'untimed-practice' && filteredTests.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-3 lg:p-4 rounded-full">
                <svg className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">
              No tests found
            </h3>
            <p className="text-gray-600 mb-4 text-sm lg:text-base px-4">
              {currentTab === 'all' && subjectFilter === 'all'
                ? 'There are no tests available at the moment.'
                : `No tests found for ${getCurrentTypeConfig().label.toLowerCase()}${subjectFilter !== 'all' ? ` with ${getCurrentSubjectConfig().label}` : ''}.`
              }
            </p>
            <button
              onClick={handleRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Tests
            </button>
          </div>
        ) : currentTab !== 'untimed-practice' && filteredTests.length > 0 ? (
          <div ref={testsGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredTests.map((test, index) => {
              const testId = test._id || test.id;
              const typeConfig = getTestTypeConfig(test.testType);
              const areaBreakdown = getAreaBreakdown(test);
              const topAreas = Object.entries(areaBreakdown).slice(0, 3);

              return (
                <div 
                  key={testId || `test-${index}`} 
                  ref={el => testCardRefs.current[index] = el}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200"
                >
                  <div className="p-4 lg:p-6">
                    {/* Test Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1 px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${typeConfig.color} ${typeConfig.bgColor}`}>
                          <div className={typeConfig.iconColor}>
                            {getTestTypeIcon(test.testType)}
                          </div>
                          <span className="hidden sm:inline">{test.testType}</span>
                        </span>
                        {isAuthenticated && isTestAttempted(test) && (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="hidden sm:inline">Attempted</span>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {test.year && (
                          <div className="text-sm font-medium text-gray-900">{test.year}</div>
                        )}
                        {test.paper && (
                          <div className="text-xs text-gray-500">{test.paper}</div>
                        )}
                      </div>
                    </div>

                    {/* Test Info */}
                    <h3 className="font-bold text-base lg:text-lg text-gray-900 mb-2 line-clamp-2">
                      {test.name}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs lg:text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2 lg:space-x-4">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{test.questions?.length || 0} Questions</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDuration(test.duration)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Area Breakdown */}
                    {topAreas.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1 lg:gap-2">
                          {topAreas.map(([area, count]) => (
                            <span
                              key={area}
                              className={`px-2 py-1 rounded text-xs font-medium ${getAreaColor(area)}`}
                            >
                              <span className="hidden sm:inline">{area}</span>
                              <span className="sm:hidden">{area.substring(0, 8)}</span>
                              <span> ({count})</span>
                            </span>
                          ))}
                          {Object.keys(areaBreakdown).length > 3 && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              +{Object.keys(areaBreakdown).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Start Test Button - Enhanced with analytics */}
                    {testId ? (
                      <button
                        onClick={(e) => handleStartTest(testId, test, e)}
                        className={`block w-full text-center py-2 lg:py-3 px-4 rounded-lg font-medium transition-all duration-200 ${typeConfig.color} ${typeConfig.bgColor} hover:shadow-md`}
                      >
                        Start Test
                      </button>
                    ) : (
                      <div className="block w-full text-center py-2 lg:py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed">
                        Test ID Missing
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Loading More */}
        {loading && filteredTests.length > 0 && currentTab !== 'untimed-practice' && (
          <div className="flex justify-center items-center mt-8 py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading more tests...</span>
          </div>
        )}

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="mt-8 lg:mt-12 text-center bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-2 lg:p-3 rounded-full">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-blue-900 mb-2">
              Sign in to start taking tests
            </h3>
            <p className="text-blue-700 mb-4 text-sm lg:text-base px-2">
              You need to verify your email and phone number to access our test platform and track your progress.
            </p>
            <Link
              to="/login"
              onClick={handleSignInClick}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign In Now</span>
            </Link>
          </div>
        )}

        {/* NEW: Untimed Practice Modal */}
        {showUntimedPracticeModal && (
          <UntimedSubjectSelection 
            onClose={() => setShowUntimedPracticeModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Home;