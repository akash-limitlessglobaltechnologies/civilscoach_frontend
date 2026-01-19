import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [statsViewed, setStatsViewed] = useState(false);
  
  // Refs for intersection observer
  const statsRef = useRef(null);
  const testsGridRef = useRef(null);
  const testCardRefs = useRef([]);

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
            if (entry.target === statsRef.current && !statsViewed) {
              setStatsViewed(true);
              trackEngagement('statistics_section_viewed', {
                label: `total_tests_${Object.values(typeStats).reduce((sum, count) => sum + count, 0)}`,
                value: Object.values(typeStats).reduce((sum, count) => sum + count, 0)
              });
            } else if (entry.target === testsGridRef.current) {
              trackEngagement('tests_grid_viewed', {
                label: `filter_${currentTab}_subject_${subjectFilter}_count_${tests.length}`,
                value: tests.length
              });
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    if (testsGridRef.current) observer.observe(testsGridRef.current);

    return () => observer.disconnect();
  }, [statsViewed, typeStats, currentTab, subjectFilter, tests.length]);

  // Analytics: Track individual test card views
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const testIndex = testCardRefs.current.findIndex(ref => ref === entry.target);
            if (testIndex !== -1 && !viewedTests.has(testIndex)) {
              setViewedTests(prev => new Set([...prev, testIndex]));
              const test = tests[testIndex];
              if (test) {
                trackEngagement('test_card_viewed', {
                  label: `${test.testType}_${test.name?.substring(0, 20) || 'unknown'}`,
                  value: testIndex + 1
                });
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    testCardRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [tests, viewedTests]);

  const getTestTypeIcon = (testType) => {
    switch (testType) {
      case 'PYQ':
        return (
          <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Practice':
        return (
          <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'untimed-practice':
        return (
          <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
    }
  };

  const getSubjectIcon = (subjectType) => {
    switch (subjectType) {
      case 'GS':
        return (
          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'CSAT':
        return (
          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
    }
  };

  useEffect(() => {
    fetchTests();
  }, [currentTab, subjectFilter]);

  // Fetch attempted tests when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && tests.length > 0) {
      fetchAttemptedTests();
    }
  }, [isAuthenticated]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Track API request start
      const requestStartTime = Date.now();
      
      const queryParam = currentTab !== 'all' ? `?testType=${currentTab}` : '';
      const response = await axios.get(`${import.meta.env.VITE_APP_URI}/api/tests${queryParam}`);
      
      console.log('Fetched tests:', response.data.tests);
      let filteredTests = response.data.tests || [];
      
      // Apply subject filter on the frontend
      if (subjectFilter !== 'all') {
        filteredTests = filteredTests.filter(test => 
          test.name && test.name.toLowerCase().includes(subjectFilter.toLowerCase())
        );
      }
      
      setTests(filteredTests);
      
      if (response.data.typeStats) {
        setTypeStats(response.data.typeStats);
      }

      // Track successful API response
      const responseTime = Date.now() - requestStartTime;
      trackEngagement('tests_fetch_success', {
        label: `filter_${currentTab}_subject_${subjectFilter}_count_${filteredTests.length}`,
        value: responseTime
      });

      // Track filter usage
      if (currentTab !== 'all') {
        trackEngagement('test_type_filter_used', {
          label: currentTab,
          value: filteredTests.length
        });
      }

      if (subjectFilter !== 'all') {
        trackEngagement('subject_filter_used', {
          label: subjectFilter,
          value: filteredTests.length
        });
      }

      // Fetch attempted tests if authenticated
      if (isAuthenticated) {
        await fetchAttemptedTests();
      }

    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Failed to load tests. Please try again later.');
      setTests([]);

      // Track API failure
      trackEngagement('tests_fetch_failed', {
        label: error.message || 'unknown_error',
        value: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabValue) => {
    // Handle untimed practice separately - don't change tab, just open modal
    if (tabValue === 'untimed-practice') {
      handleUntimedPracticeClick();
      return;
    }

    // Track filter change
    trackEngagement('test_type_filter_changed', {
      label: `from_${currentTab}_to_${tabValue}`,
      value: Math.round((Date.now() - startTime) / 1000)
    });

    setCurrentTab(tabValue);

    // Reset viewed tests when changing filters
    setViewedTests(new Set());
  };

  const handleSubjectFilterChange = (filterValue) => {
    // Track subject filter change
    trackEngagement('subject_filter_changed', {
      label: `from_${subjectFilter}_to_${filterValue}`,
      value: Math.round((Date.now() - startTime) / 1000)
    });

    setSubjectFilter(filterValue);

    // Reset viewed tests when changing filters
    setViewedTests(new Set());
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTestTypeConfig = (testType) => {
    return testTypes.find(t => t.value === testType) || testTypes[0];
  };

  const getCurrentTypeConfig = () => {
    return testTypes.find(t => t.value === currentTab) || testTypes[0];
  };

  const getCurrentSubjectConfig = () => {
    return subjectFilters.find(s => s.value === subjectFilter) || subjectFilters[0];
  };

  // Function to get area breakdown for a test
  const getAreaBreakdown = (test) => {
    if (!test.questions || !Array.isArray(test.questions)) {
      return {};
    }

    const breakdown = {};
    
    test.questions.forEach(question => {
      const area = question.area || question.areaName || 1;
      const areaName = typeof area === 'number' ? AREA_MAPPING[area] : area;
      
      if (!breakdown[areaName]) {
        breakdown[areaName] = 0;
      }
      breakdown[areaName]++;
    });

    return breakdown;
  };

  // Function to get area color for display
  const getAreaColor = (areaName) => {
    const colorMap = {
      'Current Affairs': 'bg-red-100 text-red-700',
      'History': 'bg-yellow-100 text-yellow-700',
      'Polity': 'bg-blue-100 text-blue-700',
      'Economy': 'bg-green-100 text-green-700',
      'Geography': 'bg-indigo-100 text-indigo-700',
      'Ecology': 'bg-emerald-100 text-emerald-700',
      'General Science': 'bg-purple-100 text-purple-700',
      'Arts & Culture': 'bg-pink-100 text-pink-700'
    };
    return colorMap[areaName] || 'bg-gray-100 text-gray-700';
  };

  // Enhanced function to handle test start with analytics
  const handleStartTest = async (testId, test, event) => {
    event.preventDefault();
    
    // Track test start attempt
    trackEngagement('test_start_clicked', {
      label: `${test.testType}_${test.name?.substring(0, 20) || 'unknown'}`,
      value: test.questions?.length || 0
    });

    if (!isAuthenticated) {
      // Track authentication required
      trackConversion('authentication_required', {
        label: `test_start_blocked_${test.testType}`,
        value: 0
      });
      
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }

    try {
      // Track test start process
      trackEngagement('authenticated_test_start', {
        label: `${test.testType}_${testId}`,
        value: Math.round((Date.now() - startTime) / 1000)
      });

      const response = await authService.authenticatedRequest(`/api/tests/${testId}/start`, {
        method: 'POST'
      });

      if (response.success) {
        // Track successful test start
        trackConversion('test_started_success', {
          label: `${test.testType}_duration_${test.duration}min`,
          value: test.questions?.length || 0
        });

        navigate(`/test/${testId}`, { 
          state: { 
            sessionId: response.sessionId, 
            testData: response 
          } 
        });
      } else {
        // Track test start failure
        trackEngagement('test_start_failed', {
          label: response.message || 'unknown_error',
          value: 0
        });
        
        alert(response.message || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      
      // Track test start error
      trackEngagement('test_start_error', {
        label: error.message || 'request_failed',
        value: 0
      });
      
      alert('Failed to start test. Please try again.');
    }
  };

  // Handle retry with analytics
  const handleRetry = () => {
    trackEngagement('tests_retry_clicked', {
      label: `${currentTab}_${subjectFilter}`,
      value: Math.round((Date.now() - startTime) / 1000)
    });
    
    fetchTests();
  };

  // Handle sign in click with analytics
  const handleSignInClick = () => {
    trackConversion('signin_cta_clicked', {
      label: 'home_page_bottom',
      value: Math.round((Date.now() - startTime) / 1000)
    });
  };

  // NEW: Handle untimed practice button click
  const handleUntimedPracticeClick = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    
    // Track untimed practice click
    trackEngagement('untimed_practice_clicked', {
      label: 'home_button',
      value: 1
    });
    
    setShowUntimedPracticeModal(true);
  };

  const totalTests = Object.values(typeStats).reduce((sum, count) => sum + count, 0);

  if (loading && tests.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Hero Section */}
      <div className="text-center mb-8 lg:mb-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 lg:p-8">
        <div className="flex justify-center mb-4 lg:mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 lg:p-4 rounded-full shadow-lg">
            <svg className="w-8 h-8 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4">
          Welcome to Civils Coach
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-4 lg:mb-6 px-2">
          Master civil services preparation with our comprehensive test platform. Practice with real exam questions, track your progress, and achieve your goals.
        </p>
        
        {/* NEW: Untimed Practice Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
          {isAuthenticated && (
            <button
              onClick={handleUntimedPracticeClick}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Untimed Practice</span>
              <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">NEW</span>
            </button>
          )}
          
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-flex items-center space-x-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="text-left">
                <div className="font-semibold text-blue-900">Untimed Practice Available</div>
                <div className="text-sm text-blue-700">Sign in to access one-by-one question practice</div>
              </div>
            </div>
          )}
        </div>
        
        {isAuthenticated && (
          <div className="inline-flex items-center space-x-2 px-3 lg:px-4 py-2 bg-white/50 backdrop-blur rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Welcome back, {user?.email?.split('@')[0]}!
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-blue-600">{totalTests}</p>
              <p className="text-xs lg:text-sm text-gray-500">Total Tests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-emerald-600">{typeStats.PYQ || 0}</p>
              <p className="text-xs lg:text-sm text-gray-500">PYQ Tests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-purple-600">{typeStats.Practice || 0}</p>
              <p className="text-xs lg:text-sm text-gray-500">Practice Tests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-orange-600">{typeStats.Assessment || 0}</p>
              <p className="text-xs lg:text-sm text-gray-500">Assessments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Type Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 lg:gap-3 justify-center">
          {testTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTabChange(type.value)}
              className={`flex items-center space-x-1 lg:space-x-2 px-3 sm:px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-200 ${
                currentTab === type.value && type.value !== 'untimed-practice'
                  ? `${type.color} ${type.bgColor} shadow-md border-2 border-opacity-20`
                  : type.value === 'untimed-practice'
                  ? `${type.color} ${type.bgColor} hover:shadow-md border-2 border-transparent hover:border-opacity-20 transform hover:scale-105`
                  : 'text-gray-600 bg-white hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className={
                (currentTab === type.value && type.value !== 'untimed-practice') || type.value === 'untimed-practice' 
                  ? type.iconColor 
                  : 'text-gray-400'
              }>
                {getTestTypeIcon(type.value)}
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-medium flex items-center space-x-1">
                  <span>{type.label}</span>
                  {type.value === 'untimed-practice' && (
                    <span className="bg-white bg-opacity-70 text-xs px-1.5 py-0.5 rounded-full font-bold text-orange-700">
                      NEW
                    </span>
                  )}
                </div>
                {((currentTab === type.value && type.value !== 'untimed-practice') || type.value === 'untimed-practice') && (
                  <div className="text-xs opacity-75 hidden sm:block">{type.description}</div>
                )}
              </div>
              {currentTab === type.value && type.value !== 'all' && type.value !== 'untimed-practice' && (
                <span className="bg-white bg-opacity-50 text-xs px-2 py-1 rounded-full font-medium hidden sm:inline">
                  {typeStats[type.value] || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filters */}
      <div className="mb-6 lg:mb-8">
        <div className="text-center mb-4">
          <h3 className="text-base lg:text-lg font-semibold text-gray-700 mb-2">Filter by Subject</h3>
          <p className="text-xs lg:text-sm text-gray-500">Filter tests based on subject type</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-3 justify-center">
          {subjectFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleSubjectFilterChange(filter.value)}
              className={`flex items-center space-x-1 lg:space-x-2 px-3 sm:px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg font-medium transition-all duration-200 ${
                subjectFilter === filter.value
                  ? `${filter.color} ${filter.bgColor} shadow-md border-2 border-opacity-20`
                  : 'text-gray-600 bg-white hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className={subjectFilter === filter.value ? filter.iconColor : 'text-gray-400'}>
                {getSubjectIcon(filter.value)}
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-medium">{filter.label}</div>
                {subjectFilter === filter.value && (
                  <div className="text-xs opacity-75 hidden sm:block">{filter.description}</div>
                )}
              </div>
              {subjectFilter === filter.value && filter.value !== 'all' && (
                <span className="bg-white bg-opacity-50 text-xs px-2 py-1 rounded-full font-medium hidden sm:inline">
                  {tests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}

      {/* Tests Grid */}
      {tests.length === 0 && !loading ? (
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
      ) : (
        <div ref={testsGridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {tests.map((test, index) => {
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

                  {/* Scoring Info */}
                  {test.scoring && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Scoring System</div>
                      <div className="text-xs space-x-2 lg:space-x-4">
                        <span className="text-green-600">Correct: +{test.scoring.correct}</span>
                        <span className="text-red-600">Wrong: {test.scoring.wrong}</span>
                        <span className="text-gray-600 hidden sm:inline">Unanswered: {test.scoring.unanswered}</span>
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
      )}

      {/* Loading More */}
      {loading && tests.length > 0 && (
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
  );
};

export default Home;