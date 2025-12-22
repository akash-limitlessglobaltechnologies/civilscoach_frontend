import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [tests, setTests] = useState([]);
  const [typeStats, setTypeStats] = useState({ PYQ: 0, Practice: 0, Assessment: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('all');

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
      label: 'Assessment Tests', 
      description: 'Formal evaluation tests',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PYQ':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Practice':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'Assessment':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
          <div className="bg-blue-600 p-4 rounded-full shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Civils Coach
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Take practice tests, track your performance, and improve your knowledge with our comprehensive testing platform
        </p>
        
        <div className="flex justify-center space-x-8 text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-600">{totalTests} Total Tests</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-600">8 Subject Areas</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-600">Detailed Analytics</span>
          </div>
        </div>
      </div>

      {/* Test Type Selection Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Choose Your Test Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testTypes.map((type) => {
            const count = type.value === 'all' ? totalTests : typeStats[type.value] || 0;
            const isActive = currentTab === type.value;
            
            return (
              <button
                key={type.value}
                onClick={() => handleTabChange(type.value)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? `border-blue-500 ${type.bgColor} shadow-lg`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <div className={type.iconColor}>
                      {getTypeIcon(type.value)}
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${isActive ? type.color : 'text-gray-800'}`}>
                    {count}
                  </span>
                </div>
                <h3 className={`font-semibold mb-2 ${isActive ? type.color : 'text-gray-800'}`}>
                  {type.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Tests Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${getCurrentTypeConfig().bgColor}`}>
              <div className={getCurrentTypeConfig().iconColor}>
                {getTypeIcon(currentTab)}
              </div>
            </div>
            {getCurrentTypeConfig().label}
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCurrentTypeConfig().bgColor} ${getCurrentTypeConfig().color}`}>
            {tests.length} {tests.length === 1 ? 'Test' : 'Tests'} Available
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-200 p-4 rounded-full">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              No {getCurrentTypeConfig().label.toLowerCase()} available
            </h3>
            <p className="text-gray-500">
              {currentTab === 'all' 
                ? 'Tests will appear here once they are created by admin'
                : `${getCurrentTypeConfig().label} will appear here once they are created by admin`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const testId = test._id || test.id;
              const typeConfig = getTestTypeConfig(test.testType);
              const areaBreakdown = getAreaBreakdown(test);
              
              if (!testId) {
                console.error('Test missing ID:', test);
                return null;
              }
              
              return (
                <div key={testId} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {test.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                            {test.testType}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {test.year}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{test.paper}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{formatDuration(test.duration)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Questions:</span>
                        <span className="ml-1">{test.numberOfQuestions || test.questions?.length || 'N/A'}</span>
                      </div>
                      {test.scoring && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Scoring:</span>
                          <span className="ml-1">+{test.scoring.correct} / {test.scoring.wrong} / {test.scoring.unanswered}</span>
                        </div>
                      )}
                    </div>

                    {/* Area Breakdown */}
                    {Object.keys(areaBreakdown).length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-600 mb-2 font-medium">Subject Areas:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(areaBreakdown).slice(0, 4).map(([area, count]) => (
                            <span key={area} className={`px-2 py-1 rounded-full text-xs font-medium ${getAreaColor(area)}`}>
                              {area}: {count}
                            </span>
                          ))}
                          {Object.keys(areaBreakdown).length > 4 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{Object.keys(areaBreakdown).length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                     
                     
                    </div>
                    
                    <Link
                      to={`/test/${testId}`}
                      className={`w-full text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium text-center block group-hover:shadow-md flex items-center justify-center bg-gradient-to-r ${
                        test.testType === 'PYQ' 
                          ? 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
                          : test.testType === 'Assessment'
                          ? 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                          : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Test
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;