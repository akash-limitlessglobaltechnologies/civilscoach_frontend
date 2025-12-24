import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const TestView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authService, user } = useAuth();

  const [test, setTest] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Format: { questionIndex: optionKey }
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load test details
  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchTest();
    } else {
      setError('No test ID provided. Redirecting to home...');
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
    }
  }, [id, navigate]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, timeRemaining, testCompleted]);

  const fetchTest = async () => {
    if (!id || id === 'undefined' || id === 'null') {
      setError('Invalid test ID. Please select a test from the home page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching test with ID:', id);
      
      const response = await authService.authenticatedRequest(`/api/tests/${id}`, {
        method: 'GET'
      });
      
      if (response && response.test) {
        console.log('Test data loaded:', response.test);
        setTest(response.test);
      } else {
        throw new Error('Test data not found in response');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      
      if (error.response?.status === 404) {
        setError('Test not found. It may have been deleted or moved.');
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to load test. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      setError('');
      setLoading(true);

      const response = await authService.authenticatedRequest(`/api/tests/${id}/start`, {
        method: 'POST'
      });

      console.log('Test session started:', response);
      setSessionId(response.sessionId);
      setTimeRemaining(test.duration * 60);
      setTestStarted(true);
    } catch (error) {
      console.error('Error starting test:', error);
      setError(error.message || 'Failed to start test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // CORRECTED: Store answers with question index and option key
  const handleAnswerSelect = (optionIndex) => {
    if (testCompleted) return;
    
    // Get the option key (A, B, C, D) instead of the index
    const optionKey = test.questions[currentQuestionIndex].options[optionIndex].key;
    
    console.log(`Question ${currentQuestionIndex}: Selected option ${optionKey} (index ${optionIndex})`);
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionKey // Store question index -> option key
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleTimeUp = () => {
    console.log('Time is up! Auto-submitting test...');
    handleSubmitTest(true);
  };

  // CORRECTED: Proper submission format
  const handleSubmitTest = async (timeExpired = false) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError('');

      console.log('Current answers before submission:', answers);
      
      const submissionData = {
        answers: answers, // Send directly as { questionIndex: optionKey }
        timeExpired
      };

      console.log('Submitting test data:', submissionData);

      const response = await authService.authenticatedRequest(`/api/tests/${sessionId}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });

      console.log('Test submission response:', response);
      
      // The response should have the exact counts from backend
      setSubmissionResult(response);
      setTestCompleted(true);
      setShowConfirm(false);

    } catch (error) {
      console.error('Error submitting test:', error);
      setError(error.message || 'Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetailedAnalysis = () => {
    // Navigate with proper data structure
    navigate('/test-result', {
      state: {
        resultData: {
          ...submissionResult,
          userAnswers: answers, // Pass the answers object as is
          testId: test._id
        },
        testDetails: test,
        userInfo: user
      }
    });
  };

  // CORRECTED: Check if question is answered
  const getAnswerStatus = (questionIndex) => {
    return answers[questionIndex] !== undefined ? 'answered' : 'unanswered';
  };

  // CORRECTED: Get selected answer for current question
  const getSelectedAnswerIndex = () => {
    const selectedOptionKey = answers[currentQuestionIndex];
    if (!selectedOptionKey) return undefined;
    
    // Find the index of the option with the selected key
    return test.questions[currentQuestionIndex].options.findIndex(
      option => option.key === selectedOptionKey
    );
  };

  // CORRECTED: Count total attempted questions
  const getTotalAnswered = () => {
    return Object.keys(answers).length;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!test) return 'text-gray-600';
    const percentRemaining = (timeRemaining / (test.duration * 60)) * 100;
    if (percentRemaining > 20) return 'text-green-600';
    if (percentRemaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading test...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => navigate('/')}
              className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!test) return null;

  // CORRECTED: Enhanced result display with accurate counts
  if (testCompleted && submissionResult) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-full ${submissionResult.timeExpired ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <svg className={`w-12 h-12 ${submissionResult.timeExpired ? 'text-yellow-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h1>
            <p className="text-gray-600">
              {submissionResult.timeExpired ? 'Time expired - Test auto-submitted' : 'Your test has been submitted successfully'}
            </p>
          </div>

          {/* CORRECTED: Display actual counts from backend response */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(parseFloat(submissionResult.percentage))}`}>
                {submissionResult.percentage}%
              </div>
              <div className="text-sm text-blue-700 font-medium">Overall Score</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-green-600 mb-2">{submissionResult.breakdown.correct}</div>
              <div className="text-sm text-green-700 font-medium">Correct</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="text-4xl font-bold text-red-600 mb-2">{submissionResult.breakdown.wrong}</div>
              <div className="text-sm text-red-700 font-medium">Wrong</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="text-4xl font-bold text-gray-600 mb-2">{submissionResult.breakdown.unanswered}</div>
              <div className="text-sm text-gray-700 font-medium">Unanswered</div>
            </div>
          </div>

          {/* Additional Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{submissionResult.totalScore}</div>
                  <div className="text-sm text-purple-700 font-medium">Weighted Score</div>
                </div>
                <div className="bg-purple-200 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{submissionResult.timeTaken} min</div>
                  <div className="text-sm text-orange-700 font-medium">Time Taken</div>
                </div>
                <div className="bg-orange-200 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {submissionResult.breakdown.total}
                  </div>
                  <div className="text-sm text-indigo-700 font-medium">Total Questions</div>
                </div>
                <div className="bg-indigo-200 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Test Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Test Name:</span>
                <div className="font-medium text-gray-900">{test.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <div className="font-medium text-gray-900">{test.testType}</div>
              </div>
              <div>
                <span className="text-gray-600">Attempted:</span>
                <div className="font-medium text-gray-900">
                  {submissionResult.breakdown.correct + submissionResult.breakdown.wrong} / {submissionResult.breakdown.total}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <div className="font-medium text-gray-900">
                  {submissionResult.breakdown.correct + submissionResult.breakdown.wrong > 0 
                    ? Math.round((submissionResult.breakdown.correct / (submissionResult.breakdown.correct + submissionResult.breakdown.wrong)) * 100)
                    : 0
                  }%
                </div>
              </div>
            </div>
          </div>

          {/* Scoring System */}
          {submissionResult.scoring && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Scoring System Applied</h3>
              <div className="flex justify-center space-x-8 text-sm">
                <div className="text-center">
                  <div className="bg-green-100 text-green-600 font-bold text-xl p-3 rounded-lg mb-2">
                    +{submissionResult.scoring.correct}
                  </div>
                  <div className="text-green-700 font-medium">Correct Answer</div>
                </div>
                <div className="text-center">
                  <div className="bg-red-100 text-red-600 font-bold text-xl p-3 rounded-lg mb-2">
                    {submissionResult.scoring.wrong}
                  </div>
                  <div className="text-red-700 font-medium">Wrong Answer</div>
                </div>
                <div className="text-center">
                  <div className="bg-gray-100 text-gray-600 font-bold text-xl p-3 rounded-lg mb-2">
                    {submissionResult.scoring.unanswered}
                  </div>
                  <div className="text-gray-700 font-medium">Unanswered</div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleViewDetailedAnalysis}
              className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">View Detailed Analysis</span>
            </button>
            
            <button
              onClick={() => navigate('/performance')}
              className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">All Performance</span>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium">Take Another Test</span>
            </button>
          </div>

          {/* Performance Insight */}
          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">📊 Result Summary</h4>
                <p className="text-yellow-700 text-sm">
                  You attempted <strong>{submissionResult.breakdown.correct + submissionResult.breakdown.wrong}</strong> out of{' '}
                  <strong>{submissionResult.breakdown.total}</strong> questions. Got{' '}
                  <strong>{submissionResult.breakdown.correct}</strong> correct and{' '}
                  <strong>{submissionResult.breakdown.wrong}</strong> wrong. Click "View Detailed Analysis" 
                  to see question-by-question breakdown and improvement insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-test start screen
  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.name}</h1>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
              {test.year && <span>{test.year}</span>}
              {test.paper && <span>• {test.paper}</span>}
              <span>• {test.testType}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-blue-900">Taking test as: {user?.email}</div>
                <div className="text-sm text-blue-700">Phone: {user?.phoneNumber}</div>
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Test Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{test.questions?.length || test.numberOfQuestions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{test.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Type:</span>
                  <span className="font-medium">{test.testType}</span>
                </div>
                {test.description && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Description:</span>
                    <p className="text-gray-900 mt-1">{test.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Scoring System</h3>
              {test.scoring ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">Correct Answer:</span>
                    <span className="font-medium text-green-600">+{test.scoring.correct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Wrong Answer:</span>
                    <span className="font-medium text-red-600">{test.scoring.wrong}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unanswered:</span>
                    <span className="font-medium text-gray-600">{test.scoring.unanswered}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Standard scoring: +1 for correct, 0 for wrong/unanswered</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-yellow-900 mb-3">📋 Instructions</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Read each question carefully before selecting your answer</li>
              <li>• You can navigate between questions using the question panel</li>
              <li>• Your answers are automatically saved as you select them</li>
              <li>• The test will auto-submit when time runs out</li>
              <li>• Review your answers before final submission</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleStartTest}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </div>
              ) : (
                'Start Test'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Current question during test
  const currentQuestion = test.questions[currentQuestionIndex];
  const selectedAnswerIndex = getSelectedAnswerIndex();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border p-4 sticky top-4">
            {/* Timer */}
            <div className="text-center mb-6">
              <div className={`text-2xl font-bold ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-600">Time Remaining</div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{getTotalAnswered()}/{test.questions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(getTotalAnswered() / test.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-900 mb-3">Questions</div>
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`w-10 h-10 text-sm font-medium rounded transition-all ${
                      currentQuestionIndex === index
                        ? 'bg-blue-600 text-white'
                        : getAnswerStatus(index) === 'answered'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="text-xs text-gray-600 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                <span>Unanswered</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full mt-6 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Question Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow border p-6">
            {/* Question Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </div>
                {currentQuestion.area && (
                  <div className="text-sm text-gray-600">
                    Area: {typeof currentQuestion.area === 'number' ? `Area ${currentQuestion.area}` : currentQuestion.area}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <div className="text-lg text-gray-900 leading-relaxed">
                {currentQuestion.question}
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4 mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option._id || option.id || index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswerIndex === index
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedAnswerIndex === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswerIndex === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {option.key}. {option.text || option}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === test.questions.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Submit Test?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              You have answered {getTotalAnswered()} out of {test.questions.length} questions. 
              Are you sure you want to submit your test?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitTest(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Test'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestView;