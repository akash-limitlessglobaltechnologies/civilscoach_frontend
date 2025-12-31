import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authService';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [typeStats, setTypeStats] = useState({ PYQ: 0, Practice: 0, Assessment: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const { isAuthenticated, user, authService } = useAuth();

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
      value: 'Assessment', 
      label: 'Mock Assessments', 
      description: 'Simulate real exam conditions',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    }
  ];

  const getTestTypeIcon = (testType) => {
    switch (testType) {
      case 'PYQ':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Practice':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'Assessment':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
    }
  };

  useEffect(() => {
    fetchTests();
  }, [currentTab]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParam = currentTab !== 'all' ? `?testType=${currentTab}` : '';
      const response = await axios.get(`${import.meta.env.VITE_APP_URI}/api/tests${queryParam}`);
      
      console.log('Fetched tests:', response.data.tests);
      setTests(response.data.tests || []);
      
      if (response.data.typeStats) {
        setTypeStats(response.data.typeStats);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Failed to load tests. Please try again later.');
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabValue) => {
    setCurrentTab(tabValue);
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

  // Enhanced function to handle test start with new backend
  const handleStartTest = async (testId, event) => {
    event.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await authService.authenticatedRequest(`/api/tests/${testId}/start`, {
        method: 'POST'
      });

      if (response.success) {
        navigate(`/test/${testId}`, { 
          state: { 
            sessionId: response.sessionId, 
            testData: response 
          } 
        });
      } else {
        alert(response.message || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Civils Coach
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Master civil services preparation with our comprehensive test platform. Practice with real exam questions, track your progress, and achieve your goals.
        </p>
        
        {isAuthenticated && (
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/50 backdrop-blur rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Welcome back, {user?.email?.split('@')[0]}!
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{totalTests}</p>
              <p className="text-sm text-gray-500">Total Tests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">{typeStats.PYQ || 0}</p>
              <p className="text-sm text-gray-500">PYQ Tests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{typeStats.Practice || 0}</p>
              <p className="text-sm text-gray-500">Practice Tests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{typeStats.Assessment || 0}</p>
              <p className="text-sm text-gray-500">Assessments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Type Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {testTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTabChange(type.value)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentTab === type.value
                  ? `${type.color} ${type.bgColor} shadow-md border-2 border-opacity-20`
                  : 'text-gray-600 bg-white hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className={currentTab === type.value ? type.iconColor : 'text-gray-400'}>
                {getTestTypeIcon(type.value)}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{type.label}</div>
                {currentTab === type.value && (
                  <div className="text-xs opacity-75">{type.description}</div>
                )}
              </div>
              {currentTab === type.value && type.value !== 'all' && (
                <span className="bg-white bg-opacity-50 text-xs px-2 py-1 rounded-full font-medium">
                  {typeStats[type.value] || 0}
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={fetchTests}
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
            <div className="bg-gray-100 p-4 rounded-full">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No tests found
          </h3>
          <p className="text-gray-600 mb-4">
            {currentTab === 'all' 
              ? 'There are no tests available at the moment.'
              : `No ${getCurrentTypeConfig().label.toLowerCase()} available.`
            }
          </p>
          <button
            onClick={fetchTests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Tests
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test, index) => {
            // Debug: Log test structure
            console.log(`Test ${index}:`, {
              test,
              _id: test._id,
              id: test.id,
              hasId: !!(test._id || test.id),
              keys: Object.keys(test)
            });

            const testId = test._id || test.id; // Try both _id and id fields
            const typeConfig = getTestTypeConfig(test.testType);
            const areaBreakdown = getAreaBreakdown(test);
            const topAreas = Object.entries(areaBreakdown).slice(0, 3);

            return (
              <div key={testId || `test-${index}`} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200">
                <div className="p-6">
                  {/* Test Type Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${typeConfig.color} ${typeConfig.bgColor}`}>
                      <div className={typeConfig.iconColor}>
                        {getTestTypeIcon(test.testType)}
                      </div>
                      <span>{test.testType}</span>
                    </span>
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
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {test.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{test.questions?.length || 0} Questions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDuration(test.duration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Area Breakdown */}
                  {topAreas.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {topAreas.map(([area, count]) => (
                          <span
                            key={area}
                            className={`px-2 py-1 rounded text-xs font-medium ${getAreaColor(area)}`}
                          >
                            {area} ({count})
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
                      <div className="text-xs space-x-4">
                        <span className="text-green-600">Correct: +{test.scoring.correct}</span>
                        <span className="text-red-600">Wrong: {test.scoring.wrong}</span>
                        <span className="text-gray-600">Unanswered: {test.scoring.unanswered}</span>
                      </div>
                    </div>
                  )}

                  {/* Start Test Button - Enhanced with backend integration */}
                  {testId ? (
                    <button
                      onClick={(e) => handleStartTest(testId, e)}
                      className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${typeConfig.color} ${typeConfig.bgColor} hover:shadow-md`}
                    >
                      Start Test
                    </button>
                  ) : (
                    <div className="block w-full text-center py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed">
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
        <div className="mt-12 text-center bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Sign in to start taking tests
          </h3>
          <p className="text-blue-700 mb-4">
            You need to verify your email and phone number to access our test platform and track your progress.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Sign In Now</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;