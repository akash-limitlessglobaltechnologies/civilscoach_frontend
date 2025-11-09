import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { emailUtils } from '../utils/emailUtils';

const Performance = () => {
  const [email, setEmail] = useState('');
  const [userPerformance, setUserPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    // Check for saved email on component mount
    const savedEmail = emailUtils.getEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      // Automatically fetch performance if email is saved
      handleSearch(null, savedEmail);
    } else {
      setShowEmailForm(true);
    }
  }, []);

  const validateEmail = (email) => {
    return emailUtils.validateEmail(email);
  };

  const handleSearch = async (e, savedEmail = null) => {
    if (e) e.preventDefault();
    
    const emailToUse = savedEmail || email;
    
    if (!emailToUse.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(emailToUse)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearched(true);
    setShowEmailForm(false);
    
    try {
      const response = await axios.post('http://localhost:5000/api/user/performance', {
        email: emailToUse.trim()
      });
      
      setUserPerformance(response.data);
      
      // Save email if not already saved (when manually entered)
      if (!savedEmail) {
        emailUtils.saveEmail(emailToUse.trim());
        setEmail(emailToUse.trim());
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      setError(error.response?.data?.message || 'Failed to fetch performance data');
      setUserPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = () => {
    setShowEmailForm(true);
    setSearched(false);
    setUserPerformance(null);
    setError('');
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatScoring = (scoring) => {
    if (!scoring) return 'Standard';
    return `+${scoring.correct} / ${scoring.wrong} / ${scoring.unanswered}`;
  };

  const getWeightedScoreColor = (score) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 20) return 'text-blue-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Performance Dashboard</h1>
        <p className="text-xl text-gray-600">Track your test performance and progress over time</p>
      </div>

      {/* Email Form */}
      {showEmailForm && (
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Enter Your Email</h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {emailUtils.hasValidEmail() && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Email will be remembered for {emailUtils.getDaysRemaining()} more days
                  </p>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  'View Performance'
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to Tests
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !showEmailForm && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading your performance data...</p>
          </div>
        </div>
      )}

      {/* Performance Data */}
      {userPerformance && !loading && (
        <div className="space-y-8">
          {/* User Info Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Performance Report
                </h2>
                <p className="text-gray-600">
                  Email: <span className="font-medium text-gray-800">{userPerformance.email}</span>
                </p>
              </div>
              <button
                onClick={handleEmailChange}
                className="mt-4 sm:mt-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Change Email
              </button>
            </div>
          </div>

          {userPerformance.totalTests === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-6 rounded-full">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-4">No Tests Taken Yet</h3>
              <p className="text-gray-500 mb-8 text-lg">
                You haven't taken any tests with this email address yet.
              </p>
              <Link
                to="/"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Take Your First Test
              </Link>
            </div>
          ) : (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{userPerformance.totalTests}</p>
                      <p className="text-gray-600">Tests Taken</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{userPerformance.averageScore}%</p>
                      <p className="text-gray-600">Average Score</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{userPerformance.bestScore}%</p>
                      <p className="text-gray-600">Best Score</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{userPerformance.totalQuestions}</p>
                      <p className="text-gray-600">Questions Answered</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Statistics with Weighted Scores */}
              {userPerformance.statistics && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Detailed Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Percentage Scores</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-medium">{userPerformance.statistics.averagePercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best:</span>
                          <span className="font-medium">{userPerformance.statistics.bestPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Worst:</span>
                          <span className="font-medium">{userPerformance.statistics.worstPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">Weighted Scores</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className={`font-medium ${getWeightedScoreColor(userPerformance.statistics.averageWeightedScore)}`}>
                            {userPerformance.statistics.averageWeightedScore}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best:</span>
                          <span className={`font-medium ${getWeightedScoreColor(userPerformance.statistics.bestWeightedScore)}`}>
                            {userPerformance.statistics.bestWeightedScore}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Worst:</span>
                          <span className={`font-medium ${getWeightedScoreColor(userPerformance.statistics.worstWeightedScore)}`}>
                            {userPerformance.statistics.worstWeightedScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Completion Rate</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 mb-1">
                          {userPerformance.statistics.completionRate}%
                        </div>
                        <div className="text-xs text-green-600">
                          Tests completed without time expiry
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test History */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Test History
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scoring System</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userPerformance.testHistory.map((test, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{test.testName}</div>
                            {test.timeExpired && (
                              <div className="text-xs text-red-600 flex items-center mt-1">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Time Expired
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(test.submittedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-bold ${getWeightedScoreColor(test.score.weighted)}`}>
                              {test.score.weighted}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getScoreColor(test.percentage)}`}>
                              {test.percentage}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                ✓ {test.score.correct}
                              </span>
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                ✗ {test.score.wrong}
                              </span>
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                                ○ {test.score.unanswered}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 font-mono">
                              {formatScoring(test.scoring)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {test.duration ? formatDuration(test.duration) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      Showing recent {userPerformance.testHistory.length} test{userPerformance.testHistory.length !== 1 ? 's' : ''} 
                      of {userPerformance.totalTests} total
                    </div>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
                        <span>Correct</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-100 rounded mr-1"></div>
                        <span>Wrong</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-100 rounded mr-1"></div>
                        <span>Unanswered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* No Results Message */}
      {searched && !loading && !userPerformance && error && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Unable to Load Performance Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleEmailChange}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-12">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Tests
        </Link>
      </div>
    </div>
  );
};

export default Performance;