import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const Performance = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // NEW: Add state for untimed practice statistics
  const [untimedPracticeStats, setUntimedPracticeStats] = useState(null);
  const [untimedPracticeLoading, setUntimedPracticeLoading] = useState(true);
  const { authService, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPerformance();
    // NEW: Fetch untimed practice statistics
    fetchUntimedPracticeStats();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authService.authenticatedRequest('/api/user/performance');
      
      console.log('Performance data:', response);
      setPerformance(response);
    } catch (error) {
      console.error('Error fetching performance:', error);
      setError(error.message || 'Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to fetch untimed practice statistics
  const fetchUntimedPracticeStats = async () => {
    try {
      setUntimedPracticeLoading(true);
      const response = await authService.authenticatedRequest('/api/user/untimed-practice/stats');
      console.log('🔍 DEBUG: Untimed practice stats response:', response);
      
      if (response.success && response.stats) {
        console.log('✅ Stats received:', response.stats);
        console.log('📊 Overall stats:', response.stats.overall);
        setUntimedPracticeStats(response.stats);
      } else {
        console.log('❌ No stats or unsuccessful response:', response);
        setUntimedPracticeStats(null);
      }
    } catch (error) {
      console.error('❌ Error fetching untimed practice stats:', error);
      // Don't show error for this as it's supplementary data
      setUntimedPracticeStats(null);
    } finally {
      setUntimedPracticeLoading(false);
    }
  };

  const handleDetailedAnalysis = (test) => {
    // Navigate to detailed analysis page with the record ID
    if (test.recordId || test._id || test.id) {
      const recordId = test.recordId || test._id || test.id;
      navigate(`/performance/analysis/${recordId}`);
    } else {
      console.error('No record ID found for test:', test);
      alert('Unable to load detailed analysis. Record ID not found.');
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTestTypeColor = (testType) => {
    switch (testType) {
      case 'PYQ':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Practice':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Assessment':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // NEW: Area mapping for display
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex justify-center items-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading your performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1 text-sm lg:text-base">{error}</span>
            <button
              onClick={fetchPerformance}
              className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!performance || performance.totalTests === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="text-center py-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 lg:p-4 rounded-full">
              <svg className="w-8 h-8 lg:w-12 lg:h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">No Tests Completed Yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto px-4 text-sm lg:text-base">
            Start taking tests to see your performance analytics, track progress, and identify areas for improvement.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Start Your First Test</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center space-x-3 lg:space-x-4 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 lg:p-3 rounded-full">
            <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Performance Dashboard</h1>
            <p className="text-gray-600 text-sm lg:text-base">Track your progress and analyze your test performance</p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">{user?.email}</div>
                <div className="text-sm text-gray-600">{user?.phoneNumber}</div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-600">Total Tests Completed</div>
              <div className="text-lg lg:text-xl font-bold text-blue-600">{performance.totalTests}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-blue-600">{performance.averagePercentage?.toFixed(1)}%</p>
              <p className="text-xs lg:text-sm text-gray-500">Average Score</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-green-600">{performance.totalCorrectAnswers || 0}</p>
              <p className="text-xs lg:text-sm text-gray-500">Correct Answers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-purple-600">
                {performance.totalTimeTaken ? formatDuration(performance.totalTimeTaken) : '0m'}
              </p>
              <p className="text-xs lg:text-sm text-gray-500">Total Time</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-2xl font-bold text-orange-600">{performance.totalQuestions || 0}</p>
              <p className="text-xs lg:text-sm text-gray-500">Total Questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Untimed Practice Statistics Section */}
      <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl shadow-sm border border-orange-200 p-4 lg:p-6 mb-6 lg:mb-8">
        <div className="flex items-center space-x-3 mb-4 lg:mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-2 lg:p-3 rounded-full">
            <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Untimed Practice Statistics</h2>
            <p className="text-sm lg:text-base text-gray-600">Your progress in one-by-one question practice</p>
          </div>
        </div>

        {untimedPracticeLoading ? (
          // Loading state
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading untimed practice statistics...</span>
          </div>
        ) : untimedPracticeStats ? (
          // DEBUG: Always show if we have stats object, regardless of content
          <div>
            {/* DEBUG INFO */}
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded mb-4 text-xs">
              <strong>🔍 DEBUG:</strong> Stats received - 
              Overall: {JSON.stringify(untimedPracticeStats.overall || {})} | 
              Breakdown: {(untimedPracticeStats.breakdown || []).length} subjects
            </div>

            {/* Check if we have any data */}
            {untimedPracticeStats.overall && (untimedPracticeStats.overall.answered > 0 || untimedPracticeStats.overall.skipped > 0) ? (
              <>
                {/* Untimed Practice Overview Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 mb-6">
                  <div className="bg-white/70 rounded-lg p-3 lg:p-4 text-center border border-orange-200">
                    <div className="text-xl lg:text-2xl font-bold text-blue-600 mb-1">{untimedPracticeStats.overall.answered || 0}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Answered</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 lg:p-4 text-center border border-orange-200">
                    <div className="text-xl lg:text-2xl font-bold text-emerald-600 mb-1">{untimedPracticeStats.overall.correct || 0}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 lg:p-4 text-center border border-orange-200">
                    <div className="text-xl lg:text-2xl font-bold text-red-600 mb-1">{untimedPracticeStats.overall.wrong || 0}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Wrong</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 lg:p-4 text-center border border-orange-200">
                    <div className="text-xl lg:text-2xl font-bold text-gray-600 mb-1">{untimedPracticeStats.overall.skipped || 0}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Skipped</div>
                    <div className="text-xs text-gray-400 mt-1">(not attempted)</div>
                  </div>
                </div>

                {/* Accuracy separately */}
                <div className="bg-white/70 rounded-lg p-4 text-center border border-orange-200 mb-6">
                  <div className={`text-3xl font-bold mb-2 ${getScoreColor(untimedPracticeStats.overall.accuracy || 0)}`}>
                    {untimedPracticeStats.overall.accuracy || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Based on {untimedPracticeStats.overall.answered || 0} answered questions only
                  </div>
                </div>

                {/* Subject-wise Breakdown */}
                {untimedPracticeStats.breakdown && untimedPracticeStats.breakdown.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Subject-wise Performance</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                      {untimedPracticeStats.breakdown.map((subject) => (
                        <div key={subject._id} className="bg-white/70 rounded-lg p-3 lg:p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <div className="bg-orange-100 p-1 lg:p-1.5 rounded-lg flex-shrink-0">
                                <svg className="w-3 h-3 lg:w-4 lg:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-xs lg:text-sm truncate">
                                  {AREA_MAPPING[subject._id] || `Subject ${subject._id}`}
                                </h4>
                                <p className="text-xs text-gray-500 hidden lg:block">Practice Questions</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`text-sm lg:text-lg font-bold ${getScoreColor(subject.answered > 0 ? Math.round((subject.correct / subject.answered) * 100) : 0)}`}>
                                {subject.answered > 0 ? Math.round((subject.correct / subject.answered) * 100) : 0}%
                              </div>
                              <div className="text-xs text-gray-500 hidden lg:block">Accuracy</div>
                            </div>
                          </div>

                          <div className="space-y-1 lg:space-y-2">
                            <div className="flex justify-between items-center text-xs lg:text-sm">
                              <span className="text-gray-600">Questions Seen:</span>
                              <span className="font-medium">{(subject.answered || 0) + (subject.skipped || 0)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs lg:text-sm">
                              <span className="text-blue-600">Answered:</span>
                              <span className="font-medium text-blue-600">{subject.answered || 0}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs lg:text-sm">
                              <span className="text-emerald-600">Correct:</span>
                              <span className="font-medium text-emerald-600">{subject.correct || 0}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs lg:text-sm">
                              <span className="text-red-600">Wrong:</span>
                              <span className="font-medium text-red-600">{subject.wrong || 0}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs lg:text-sm">
                              <span className="text-gray-600">Skipped:</span>
                              <span className="font-medium text-gray-600">{subject.skipped || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Button - only show if has data */}
                <div className="mt-6 pt-4 border-t border-orange-200">
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Continue Untimed Practice</span>
                  </button>
                </div>
              </>
            ) : (
              // No data case - but we got a response
              <div className="text-center py-8">
                <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded mb-4 text-sm">
                  <strong>ℹ️ DEBUG:</strong> API responded successfully but no answered/skipped questions found.
                  <br/>Response: {JSON.stringify(untimedPracticeStats, null, 2)}
                </div>
                <div className="flex justify-center mb-4">
                  <div className="bg-orange-100 p-3 lg:p-4 rounded-full">
                    <svg className="w-8 h-8 lg:w-12 lg:h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Untimed Practice</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm lg:text-base">
                  Practice questions one by one without time pressure. Your progress will appear here once you start answering questions.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
                >
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Try Untimed Practice</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // No API response or error state - show call to action
          <div className="text-center py-8">
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded mb-4 text-sm">
              <strong>⚠️ DEBUG:</strong> No API response received or API call failed.
              Check console for errors.
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-orange-100 p-3 lg:p-4 rounded-full">
                <svg className="w-8 h-8 lg:w-12 lg:h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Untimed Practice</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm lg:text-base">
              Practice questions one by one without time pressure. Your progress will appear here once you start answering questions.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Try Untimed Practice</span>
            </button>
          </div>
        )}
      </div>

      {/* Cumulative Topic-wise Results */}
      {performance.analytics?.subjectPerformance && Object.keys(performance.analytics.subjectPerformance).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Cumulative Topic-wise Performance</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {Object.entries(performance.analytics.subjectPerformance)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([area, stats]) => (
              <div key={area} className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg p-3 lg:p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="bg-indigo-100 p-1 lg:p-1.5 rounded-lg flex-shrink-0">
                      <svg className="w-3 h-3 lg:w-4 lg:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-xs lg:text-sm truncate">{stats.areaName || `Area ${area}`}</h3>
                      <p className="text-xs text-gray-500 hidden lg:block">Overall Performance</p>
                    </div>
                  </div>
                  <div className={`text-right flex-shrink-0`}>
                    <div className={`text-sm lg:text-lg font-bold ${getScoreColor(stats.percentage || 0)}`}>
                      {stats.percentage || 0}%
                    </div>
                    <div className="text-xs text-gray-500 hidden lg:block">Accuracy</div>
                  </div>
                </div>

                <div className="space-y-1 lg:space-y-2">
                  <div className="flex justify-between items-center text-xs lg:text-sm">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium">{stats.total || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs lg:text-sm">
                    <span className="text-emerald-600">Correct:</span>
                    <span className="font-medium text-emerald-600">{stats.correct || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs lg:text-sm">
                    <span className="text-red-600">Wrong:</span>
                    <span className="font-medium text-red-600">{stats.wrong || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs lg:text-sm">
                    <span className="text-gray-500">Unanswered:</span>
                    <span className="font-medium text-gray-500">{stats.unanswered || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-4 lg:mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl lg:text-2xl font-bold text-blue-600">
                  {Object.values(performance.analytics.subjectPerformance).reduce((sum, stats) => sum + (stats.total || 0), 0)}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Total Questions</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-emerald-600">
                  {Object.values(performance.analytics.subjectPerformance).reduce((sum, stats) => sum + (stats.correct || 0), 0)}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Correct Answers</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-gray-900">
                  {Object.values(performance.analytics.subjectPerformance).length}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Topics Covered</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-purple-600">
                  {(() => {
                    const totalQuestions = Object.values(performance.analytics.subjectPerformance).reduce((sum, stats) => sum + (stats.total || 0), 0);
                    const totalCorrect = Object.values(performance.analytics.subjectPerformance).reduce((sum, stats) => sum + (stats.correct || 0), 0);
                    return totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0;
                  })()}%
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Overall Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Statistics */}
      {performance.statistics && (
        <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Detailed Analytics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Score Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Best Percentage:</span>
                  <span className={`font-medium ${getScoreColor(performance.statistics.bestPercentage)} text-sm lg:text-base`}>
                    {performance.statistics.bestPercentage?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Worst Percentage:</span>
                  <span className={`font-medium ${getScoreColor(performance.statistics.worstPercentage)} text-sm lg:text-base`}>
                    {performance.statistics.worstPercentage?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Best Weighted Score:</span>
                  <span className="font-medium text-gray-900 text-sm lg:text-base">{performance.statistics.bestWeightedScore?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Worst Weighted Score:</span>
                  <span className="font-medium text-gray-900 text-sm lg:text-base">{performance.statistics.worstWeightedScore?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Completion Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Completion Rate:</span>
                  <span className="font-medium text-gray-900 text-sm lg:text-base">{performance.statistics.completionRate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Total Questions:</span>
                  <span className="font-medium text-gray-900 text-sm lg:text-base">{performance.statistics.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Average (Weighted):</span>
                  <span className="font-medium text-gray-900 text-sm lg:text-base">{performance.statistics.averageWeightedScore?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Progress Chart</h3>
              <div className="h-24 lg:h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-xs lg:text-sm">Progress Chart</p>
                  <p className="text-xs text-gray-400 mt-1">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tests */}
      <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Recent Test History</h2>
        
        {performance.testHistory && performance.testHistory.length > 0 ? (
          <div className="space-y-3 lg:space-y-4">
            {performance.testHistory.slice(0, 10).map((test, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 lg:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 lg:space-x-3 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTestTypeColor(test.testType)}`}>
                        {test.testType}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{test.testName}</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(test.completedAt)}</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{test.totalQuestions} Questions</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDuration(test.timeTaken)}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="text-center">
                      <div className={`text-lg lg:text-xl font-bold ${getScoreColor(test.percentage)}`}>
                        {test.percentage?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    
                    <div className="text-center hidden sm:block">
                      <div className="text-sm lg:text-base font-medium text-gray-900">
                        {test.correctAnswers}/{test.totalQuestions}
                      </div>
                      <div className="text-xs text-gray-500">Correct</div>
                    </div>
                    
                    <button
                      onClick={() => handleDetailedAnalysis(test)}
                      className="inline-flex items-center space-x-1 lg:space-x-2 px-3 py-1.5 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs lg:text-sm font-medium"
                    >
                      <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="hidden sm:inline">Analyze</span>
                      <span className="sm:hidden">View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 text-sm lg:text-base">No test history available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;