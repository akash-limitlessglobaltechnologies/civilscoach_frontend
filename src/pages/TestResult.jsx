import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const TestResult = () => {
  const [resultData, setResultData] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'questions', 'areas'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (location.state?.resultData && location.state?.testDetails) {
      console.log('Loading result data:', location.state);
      setResultData(location.state.resultData);
      setTestDetails(location.state.testDetails);
      setLoading(false);
    } else {
      setError('No result data found');
      setLoading(false);
      setTimeout(() => navigate('/', { replace: true }), 3000);
    }
  }, [location.state, navigate]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 60 / 60);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getAnswerStatus = (questionIndex) => {
    if (!resultData?.userAnswers || !testDetails?.questions) {
      return { status: 'unanswered', color: 'bg-gray-100 text-gray-700', icon: '?' };
    }

    const userAnswer = resultData.userAnswers[questionIndex];
    const question = testDetails.questions[questionIndex];
    
    if (!question || !question.options) {
      return { status: 'unanswered', color: 'bg-gray-100 text-gray-700', icon: '?' };
    }

    const correctOption = question.options.find(opt => opt.correct);
    const correctAnswerKey = correctOption?.key;
    
    if (!userAnswer || userAnswer === undefined) {
      return { status: 'unanswered', color: 'bg-gray-100 text-gray-700', icon: '?' };
    } else if (userAnswer === correctAnswerKey) {
      return { status: 'correct', color: 'bg-green-100 text-green-700', icon: '✓' };
    } else {
      return { status: 'wrong', color: 'bg-red-100 text-red-700', icon: '✗' };
    }
  };

  const getPerformanceInsights = () => {
    if (!resultData || !testDetails) return [];
    
    const insights = [];
    const percentage = parseFloat(resultData.percentage || 0);
    const breakdown = resultData.breakdown || {};
    
    if (percentage >= 80) {
      insights.push({
        type: 'success',
        message: 'Excellent performance! You\'ve demonstrated strong understanding of the concepts.',
        icon: '🎉'
      });
    } else if (percentage >= 60) {
      insights.push({
        type: 'good',
        message: 'Good performance! Focus on improving accuracy in weak areas.',
        icon: '👍'
      });
    } else if (percentage >= 40) {
      insights.push({
        type: 'average',
        message: 'Average performance. Consider reviewing fundamental concepts.',
        icon: '📚'
      });
    } else {
      insights.push({
        type: 'needs-improvement',
        message: 'There\'s room for improvement. Focus on strengthening your foundation.',
        icon: '📖'
      });
    }

    if (resultData.timeTaken && testDetails.duration) {
      const timeUtilization = (resultData.timeTaken / testDetails.duration) * 100;
      if (timeUtilization < 50) {
        insights.push({
          type: 'time',
          message: 'You finished quickly! Consider spending more time analyzing questions.',
          icon: '⏰'
        });
      } else if (timeUtilization > 90) {
        insights.push({
          type: 'time',
          message: 'Work on time management to avoid last-minute rushing.',
          icon: '⏱️'
        });
      }
    }

    const attempted = breakdown.correct + breakdown.wrong;
    if (attempted > 0) {
      const accuracy = (breakdown.correct / attempted) * 100;
      if (accuracy > 85 && breakdown.unanswered > 0) {
        insights.push({
          type: 'accuracy',
          message: 'High accuracy! Try attempting more questions to improve overall score.',
          icon: '🎯'
        });
      }
    }

    return insights;
  };

  const calculateAreaWisePerformance = () => {
    if (!testDetails?.questions || !resultData?.userAnswers) return [];
    
    const areaStats = {};
    
    testDetails.questions.forEach((question, index) => {
      const area = question.area || 'General';
      const userAnswer = resultData.userAnswers[index];
      const correctOption = question.options?.find(opt => opt.correct);
      const correctAnswerKey = correctOption?.key;
      
      if (!areaStats[area]) {
        areaStats[area] = { 
          correct: 0, 
          wrong: 0, 
          unanswered: 0, 
          total: 0,
          questions: [] 
        };
      }
      
      areaStats[area].total++;
      areaStats[area].questions.push({
        index,
        question: question.question,
        userAnswer,
        correctAnswer: correctAnswerKey,
        isCorrect: userAnswer === correctAnswerKey,
        attempted: userAnswer !== undefined
      });
      
      if (!userAnswer || userAnswer === undefined) {
        areaStats[area].unanswered++;
      } else if (userAnswer === correctAnswerKey) {
        areaStats[area].correct++;
      } else {
        areaStats[area].wrong++;
      }
    });
    
    return Object.entries(areaStats).map(([area, stats]) => ({
      area,
      ...stats,
      percentage: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0.0',
      accuracy: stats.correct + stats.wrong > 0 ? ((stats.correct / (stats.correct + stats.wrong)) * 100).toFixed(1) : '0.0'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData || !testDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Results</h2>
          <p className="text-gray-600 mb-4">{error || 'Result data is not available.'}</p>
          <div className="text-sm text-gray-500 mb-4">Redirecting to home page...</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home Now
          </button>
        </div>
      </div>
    );
  }

  const areaWiseStats = calculateAreaWisePerformance();
  const insights = getPerformanceInsights();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Analysis Report</h1>
              <p className="text-lg text-gray-600 mt-1">{testDetails.name}</p>
              <div className="text-sm text-gray-500 mt-1">
                {testDetails.testType} • {testDetails.questions.length} Questions • {testDetails.duration} Minutes
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Back to Tests</span>
            </button>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-6 rounded-xl border ${getScoreColor(parseFloat(resultData.percentage))}`}>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{resultData.percentage}%</div>
                <div className="text-sm font-medium opacity-80">Overall Score</div>
              </div>
            </div>
            <div className="p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{resultData.breakdown.correct}</div>
                <div className="text-sm text-green-700 font-medium">Correct Answers</div>
              </div>
            </div>
            <div className="p-6 bg-red-50 rounded-xl border border-red-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{resultData.breakdown.wrong}</div>
                <div className="text-sm text-red-700 font-medium">Wrong Answers</div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 mb-2">{resultData.breakdown.unanswered}</div>
                <div className="text-sm text-gray-700 font-medium">Unanswered</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{resultData.totalScore || resultData.percentage}</div>
              <div className="text-sm text-gray-600">Weighted Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {resultData.breakdown.correct + resultData.breakdown.wrong}
              </div>
              <div className="text-sm text-gray-600">Attempted</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {resultData.breakdown.correct + resultData.breakdown.wrong > 0 
                  ? Math.round((resultData.breakdown.correct / (resultData.breakdown.correct + resultData.breakdown.wrong)) * 100)
                  : 0
                }%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {resultData.timeTaken ? `${resultData.timeTaken} min` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>
        </div>

        {/* Enhanced View Toggle */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'summary' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Summary & Insights</span>
            </button>
            <button
              onClick={() => setViewMode('questions')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'questions' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>All Questions ({testDetails.questions.length})</span>
            </button>
            <button
              onClick={() => setViewMode('areas')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'areas' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
              <span>Area-wise Analysis ({areaWiseStats.length})</span>
            </button>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'summary' && (
          <div className="space-y-6">
            {/* Performance Insights */}
            {insights.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Insights</h2>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-2xl">{insight.icon}</span>
                      <p className="text-gray-800 leading-relaxed">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Area Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Area Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areaWiseStats.map((area) => (
                  <div key={area.area} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <h3 className="font-bold text-gray-900 mb-3">
                      {typeof area.area === 'number' ? `Area ${area.area}` : area.area}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Overall Score:</span>
                        <span className={`font-bold text-lg ${getScoreColor(parseFloat(area.percentage)).split(' ')[0]}`}>
                          {area.percentage}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{area.correct}</div>
                          <div className="text-xs text-gray-600">Correct</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">{area.wrong}</div>
                          <div className="text-xs text-gray-600">Wrong</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-600">{area.unanswered}</div>
                          <div className="text-xs text-gray-600">Skipped</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'questions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">All Questions Analysis</h2>
              <div className="space-y-6">
                {testDetails.questions.map((question, index) => {
                  const status = getAnswerStatus(index);
                  const userAnswer = resultData.userAnswers?.[index];
                  const correctOption = question.options?.find(opt => opt.correct);
                  const userOption = userAnswer ? question.options?.find(opt => opt.key === userAnswer) : null;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Question {index + 1}</h3>
                          {question.area && (
                            <p className="text-sm text-gray-600 mt-1">
                              Area: {typeof question.area === 'number' ? `Area ${question.area}` : question.area}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{status.icon}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            {status.status === 'correct' ? 'Correct' : status.status === 'wrong' ? 'Wrong' : 'Not Attempted'}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-900 leading-relaxed">{question.question}</p>
                      </div>

                      <div className="space-y-3 mb-4">
                        {question.options?.map((option, optionIndex) => {
                          const isUserAnswer = option.key === userAnswer;
                          const isCorrectAnswer = option.correct;
                          
                          let optionStyle = 'border-gray-200 bg-gray-50';
                          if (isCorrectAnswer && isUserAnswer) {
                            optionStyle = 'border-green-500 bg-green-50 text-green-900 border-2';
                          } else if (isCorrectAnswer) {
                            optionStyle = 'border-green-500 bg-green-100 text-green-900 border-2';
                          } else if (isUserAnswer) {
                            optionStyle = 'border-red-500 bg-red-50 text-red-900 border-2';
                          }

                          return (
                            <div key={optionIndex} className={`p-3 rounded border ${optionStyle}`}>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{option.key}.</span>
                                  {isCorrectAnswer && <span className="text-green-600 font-bold">✓</span>}
                                  {isUserAnswer && !isCorrectAnswer && <span className="text-red-600 font-bold">✗</span>}
                                  {isUserAnswer && <span className="text-blue-600 font-bold">👆</span>}
                                </div>
                                <span className="flex-1">{option.text}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-gray-50 rounded p-4 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Your Answer: </span>
                            <span className={userAnswer !== undefined ? 'text-gray-900' : 'text-gray-500'}>
                              {userAnswer !== undefined 
                                ? `${userAnswer} - ${userOption?.text || 'Option not found'}`
                                : 'Not Attempted'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Correct Answer: </span>
                            <span className="text-green-600">
                              {correctOption?.key} - {correctOption?.text || 'Correct option not found'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {question.explanation && (
                        <div className="bg-blue-50 rounded p-4 mt-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">💡 Explanation:</h4>
                          <p className="text-blue-800 leading-relaxed">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'areas' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Area-wise Performance</h2>
              
              <div className="space-y-8">
                {areaWiseStats.map((area) => (
                  <div key={area.area} className="border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {typeof area.area === 'number' ? `Area ${area.area}` : area.area}
                        </h3>
                        <p className="text-gray-600 mt-1">{area.total} questions in this area</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(parseFloat(area.percentage)).split(' ')[0]}`}>
                          {area.percentage}%
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                    </div>

                    {/* Area Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{area.correct}</div>
                        <div className="text-sm text-green-700">Correct</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{area.wrong}</div>
                        <div className="text-sm text-red-700">Wrong</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-600">{area.unanswered}</div>
                        <div className="text-sm text-gray-700">Unanswered</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{area.accuracy}%</div>
                        <div className="text-sm text-blue-700">Accuracy</div>
                      </div>
                    </div>

                    {/* Questions in this area */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Questions in this area:</h4>
                      <div className="space-y-3">
                        {area.questions.map((q, qIndex) => {
                          const question = testDetails.questions[q.index];
                          const status = getAnswerStatus(q.index);
                          
                          return (
                            <div key={qIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium text-gray-900">Q{q.index + 1}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                    {status.status === 'correct' ? 'Correct' : status.status === 'wrong' ? 'Wrong' : 'Skipped'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 truncate">
                                  {question?.question?.substring(0, 100)}...
                                </p>
                              </div>
                              <div className="text-right text-sm">
                                {q.attempted ? (
                                  <div>
                                    <div className="text-gray-600">Your: <span className="font-medium">{q.userAnswer}</span></div>
                                    <div className="text-gray-600">Correct: <span className="font-medium text-green-600">{q.correctAnswer}</span></div>
                                  </div>
                                ) : (
                                  <div className="text-gray-500">Not Attempted</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Area Recommendations */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">📊 Recommendations for this area:</h4>
                      <div className="text-sm text-yellow-700">
                        {parseFloat(area.percentage) >= 80 ? (
                          <p>🎉 Excellent performance! You have strong command over this area. Continue practicing to maintain this level.</p>
                        ) : parseFloat(area.percentage) >= 60 ? (
                          <p>👍 Good performance. Focus on reviewing the questions you got wrong and practice similar questions.</p>
                        ) : parseFloat(area.percentage) >= 40 ? (
                          <p>📚 Moderate performance. Consider studying the fundamental concepts in this area more thoroughly.</p>
                        ) : (
                          <p>📖 This area needs significant improvement. Focus on understanding basic concepts and practice more questions.</p>
                        )}
                        
                        {area.unanswered > 0 && (
                          <p className="mt-2">⏰ You left {area.unanswered} questions unanswered in this area. Work on time management and attempt all questions.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/performance')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>View All Performance</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Take Another Test</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResult;