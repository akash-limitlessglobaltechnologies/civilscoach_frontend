import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const Performance = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [untimedPracticeStats, setUntimedPracticeStats] = useState(null);
  const [untimedPracticeLoading, setUntimedPracticeLoading] = useState(true);
  const { authService, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPerformance();
    fetchUntimedPracticeStats();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authService.authenticatedRequest('/api/user/performance');
      
      setPerformance(response);
    } catch (error) {
      console.error('Error fetching performance:', error);
      setError(error.message || 'Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUntimedPracticeStats = async () => {
    try {
      setUntimedPracticeLoading(true);
      const response = await authService.authenticatedRequest('/api/user/untimed-practice/stats');
      
      if (response.success && response.stats) {
        setUntimedPracticeStats(response.stats);
      } else {
        setUntimedPracticeStats(null);
      }
    } catch (error) {
      console.error('Error fetching untimed practice stats:', error);
      setUntimedPracticeStats(null);
    } finally {
      setUntimedPracticeLoading(false);
    }
  };

  const handleDetailedAnalysis = (test) => {
    if (test.recordId || test._id || test.id) {
      const recordId = test.recordId || test._id || test.id;
      navigate(`/performance/analysis/${recordId}`);
    } else {
      console.error('No record ID found for test:', test);
      alert('Unable to load detailed analysis. Record ID not found.');
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Function to ensure all subjects are displayed with proper stats
  const getAllSubjectsWithStats = (breakdown, overallStats) => {
    const allSubjects = [];
    
    // Convert breakdown array to a map for quick lookup
    const breakdownMap = {};
    if (breakdown && breakdown.length > 0) {
      breakdown.forEach(item => {
        breakdownMap[item._id] = item;
      });
    }
    
    // Create entries for all 8 subjects
    for (let i = 1; i <= 8; i++) {
      const existingSubject = breakdownMap[i];
      
      if (existingSubject) {
        allSubjects.push({
          ...existingSubject,
          areaName: AREA_MAPPING[i]
        });
      } else {
        // Add empty stats for subjects with no attempts
        allSubjects.push({
          _id: i,
          areaName: AREA_MAPPING[i],
          answered: 0,
          skipped: 0,
          correct: 0,
          wrong: 0,
          accuracy: 0,
          totalTimeSpent: 0,
          avgTimeSpent: 0
        });
      }
    }
    
    return allSubjects;
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
        <div className="text-center py-8 lg:py-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 lg:p-6 rounded-full">
              <svg className="w-12 h-12 lg:w-16 lg:h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">No Performance Data Yet</h1>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-sm lg:text-base">
            Start taking tests to see detailed analytics about your performance, including subject-wise breakdown, strengths, and areas for improvement.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Take Your First Test</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
            <svg className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600 text-sm lg:text-base">Track your progress and identify areas for improvement</p>
          </div>
        </div>
      </div>

      {/* Overall Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{performance.totalTests}</div>
              <div className="text-xs lg:text-sm text-gray-600">Tests Taken</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-bold text-emerald-600">{performance.averageScore?.toFixed(1)}%</div>
              <div className="text-xs lg:text-sm text-gray-600">Average Score</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-bold text-yellow-600">{performance.bestScore?.toFixed(1)}%</div>
              <div className="text-xs lg:text-sm text-gray-600">Best Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative Results Card */}
      {(performance.totalTests > 0 || (untimedPracticeStats && untimedPracticeStats.overall && untimedPracticeStats.overall.total > 0)) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4 lg:p-6 mb-6 lg:mb-8">
          <div className="flex items-center space-x-3 mb-4 lg:mb-6">
            <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Cumulative Performance</h2>
              <p className="text-gray-600 text-sm lg:text-base">Combined results from both timed tests and untimed practice</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Timed Tests Summary */}
            {performance.totalTests > 0 && (
              <div className="bg-white rounded-lg p-4 lg:p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Timed Tests</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Tests Completed:</span>
                    <span className="font-medium text-indigo-600">{performance.totalTests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Average Score:</span>
                    <span className={`font-medium ${getScoreColor(performance.averageScore)}`}>
                      {performance.averageScore?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Best Score:</span>
                    <span className={`font-medium ${getScoreColor(performance.bestScore)}`}>
                      {performance.bestScore?.toFixed(1)}%
                    </span>
                  </div>
                  {performance.analytics?.subjectPerformance && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Subjects Covered:</span>
                      <span className="font-medium text-gray-900">
                        {Object.keys(performance.analytics.subjectPerformance).length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Untimed Practice Summary */}
            {untimedPracticeStats && untimedPracticeStats.overall && untimedPracticeStats.overall.total > 0 && (
              <div className="bg-white rounded-lg p-4 lg:p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Untimed Practice</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Questions Attempted:</span>
                    <span className="font-medium text-orange-600">{untimedPracticeStats.overall.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Questions Answered:</span>
                    <span className="font-medium text-green-600">{untimedPracticeStats.overall.answered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Correct Answers:</span>
                    <span className="font-medium text-emerald-600">{untimedPracticeStats.overall.correct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Accuracy:</span>
                    <span className={`font-medium ${getScoreColor(untimedPracticeStats.overall.accuracy)}`}>
                      {untimedPracticeStats.overall.accuracy}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Combined Overall Stats */}
            <div className="bg-white rounded-lg p-4 lg:p-6 border border-blue-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Overall Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total Activity:</span>
                  <span className="font-medium text-blue-600">
                    {(performance.totalTests || 0) + (untimedPracticeStats?.overall?.total || 0)} Sessions
                  </span>
                </div>
                {performance.averageScore && untimedPracticeStats?.overall?.accuracy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Combined Accuracy:</span>
                    <span className={`font-medium ${getScoreColor(
                      (performance.averageScore + untimedPracticeStats.overall.accuracy) / 2
                    )}`}>
                      {((performance.averageScore + untimedPracticeStats.overall.accuracy) / 2).toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total Questions:</span>
                  <span className="font-medium text-gray-900">
                    {(performance.analytics?.subjectPerformance ? 
                      Object.values(performance.analytics.subjectPerformance).reduce((sum, stats) => sum + (stats.total || 0), 0) : 0
                    ) + (untimedPracticeStats?.overall?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Primary Mode:</span>
                  <span className="font-medium text-gray-900">
                    {(performance.totalTests || 0) > (untimedPracticeStats?.overall?.total || 0) 
                      ? 'Timed Tests' 
                      : 'Untimed Practice'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Subject-wise Performance */}
          {((performance.analytics?.subjectPerformance && Object.keys(performance.analytics.subjectPerformance).length > 0) || 
            (untimedPracticeStats?.breakdown && untimedPracticeStats.breakdown.length > 0)) && (
            <div className="mt-6 bg-white rounded-lg p-4 lg:p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4">Combined Subject Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({length: 8}, (_, i) => i + 1).map(area => {
                  const areaStr = area.toString();
                  
                  // Get timed test data
                  const timedData = performance.analytics?.subjectPerformance?.[areaStr] || null;
                  
                  // Get untimed practice data
                  const untimedData = untimedPracticeStats?.breakdown?.find(item => item._id === area) || null;
                  
                  return (
                    <div key={area} className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg p-3 border border-gray-200">
                      <div className="text-center mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{AREA_MAPPING[area]}</h4>
                      </div>
                      
                      {/* Timed Tests Performance */}
                      {timedData && timedData.total > 0 && (
                        <div className="mb-2 pb-2 border-b border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-indigo-600 font-medium">Timed Tests</span>
                            <span className={`text-xs font-bold ${getScoreColor(timedData.percentage || 0)}`}>
                              {(timedData.percentage || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {timedData.correct || 0}/{timedData.total || 0} correct
                          </div>
                        </div>
                      )}
                      
                      {/* Untimed Practice Performance */}
                      {untimedData && untimedData.answered > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-orange-600 font-medium">Practice</span>
                            <span className={`text-xs font-bold ${getScoreColor(untimedData.accuracy || 0)}`}>
                              {(untimedData.accuracy || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {untimedData.correct || 0}/{untimedData.answered || 0} correct
                          </div>
                        </div>
                      )}
                      
                      {/* No data case */}
                      {(!timedData || timedData.total === 0) && (!untimedData || untimedData.answered === 0) && (
                        <div className="text-center">
                          <div className="text-xs text-gray-400">No attempts yet</div>
                          <div className="text-xs text-gray-300 mt-1">0% accuracy</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Actions */}
          <div className="mt-6 pt-4 border-t border-blue-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Take Timed Test</span>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="flex-1 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Continue Practice</span>
            </button>
          </div>
        </div>
      )}

      {/* Untimed Practice Stats Section */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl shadow-sm border border-orange-200 p-4 lg:p-6 mb-6 lg:mb-8">
        <div className="flex items-center space-x-3 mb-4 lg:mb-6">
          <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
            <svg className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Practice MCQs Progress</h2>
            <p className="text-gray-600 text-sm lg:text-base">Self-paced learning without time pressure</p>
          </div>
        </div>

        {!untimedPracticeLoading ? (
          untimedPracticeStats && untimedPracticeStats.overall && (
            untimedPracticeStats.overall.answered > 0 || untimedPracticeStats.overall.skipped > 0
          ) ? (
            <>
              {/* Overall Stats */}
              <div className="bg-white rounded-lg p-4 lg:p-6 mb-4 border border-orange-100">
                <h3 className="font-semibold text-gray-900 mb-4">Overall Progress</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-blue-600">
                      {untimedPracticeStats.overall.total || 0}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-600">Total Attempted</div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-green-600">
                      {untimedPracticeStats.overall.answered || 0}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-600">Answered</div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-emerald-600">
                      {untimedPracticeStats.overall.correct || 0}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-600">Correct</div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold text-purple-600">
                      {untimedPracticeStats.overall.accuracy || 0}%
                    </div>
                    <div className="text-xs lg:text-sm text-gray-600">Accuracy</div>
                  </div>
                </div>
              </div>

              {/* Subject-wise Breakdown */}
              <div className="bg-white rounded-lg p-4 lg:p-6 border border-orange-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Subject-wise Performance</h3>
                  {(!untimedPracticeStats.breakdown || untimedPracticeStats.breakdown.length === 0) && 
                   untimedPracticeStats.overall.total > 0 && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      ⚠️ Subject data being processed
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                  {getAllSubjectsWithStats(
                    untimedPracticeStats.breakdown, 
                    untimedPracticeStats.overall
                  ).map((subject) => (
                    <div key={subject._id} className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg p-3 lg:p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="bg-orange-100 p-1 lg:p-1.5 rounded-lg flex-shrink-0">
                            <svg className="w-3 h-3 lg:w-4 lg:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-xs lg:text-sm truncate">{subject.areaName}</h3>
                            <p className="text-xs text-gray-500 hidden lg:block">Practice Progress</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm lg:text-lg font-bold ${getScoreColor(subject.accuracy || 0)}`}>
                            {subject.accuracy || 0}%
                          </div>
                          <div className="text-xs text-gray-500 hidden lg:block">Accuracy</div>
                        </div>
                      </div>

                      <div className="space-y-1 lg:space-y-2">
                        <div className="flex justify-between items-center text-xs lg:text-sm">
                          <span className="text-green-600">Answered:</span>
                          <span className="font-medium text-green-600">{subject.answered || 0}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs lg:text-sm">
                          <span className="text-emerald-600">Correct:</span>
                          <span className="font-medium text-emerald-600">{subject.correct || 0}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs lg:text-sm">
                          <span className="text-red-600">Wrong:</span>
                          <span className="font-medium text-red-600">{subject.wrong || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {(!untimedPracticeStats.breakdown || untimedPracticeStats.breakdown.length === 0) && 
                 untimedPracticeStats.overall.total > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Subject-wise breakdown is being processed. Your overall progress is shown above. 
                      Individual subject stats will appear after the next question attempt.
                    </p>
                  </div>
                )}
              </div>

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
            <div className="text-center py-8">
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
          )
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading untimed practice stats...</p>
          </div>
        )}
      </div>

      {/* Cumulative Topic-wise Results for Timed Tests */}
      {performance.analytics?.subjectPerformance && Object.keys(performance.analytics.subjectPerformance).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Timed Tests</h2>
          
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