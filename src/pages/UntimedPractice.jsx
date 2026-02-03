import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const UntimedPractice = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const { authService } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get subject from URL or state
  const selectedSubject = location.state?.subject || 'all';

  useEffect(() => {
    fetchNextQuestion();
  }, [selectedSubject]);

  const fetchNextQuestion = async () => {
    try {
      setLoading(true);
      setError('');
      setShowResult(false);
      setSelectedAnswer(null);
      setResult(null);

      const params = new URLSearchParams({
        area: selectedSubject === 'all' ? 'all' : selectedSubject.toString(),
        sortBy: 'random'
      });

      const response = await authService.authenticatedRequest(`/api/user/untimed-practice/next?${params}`);

      if (response.success && response.question) {
        setCurrentQuestion(response.question);
        setTotalAvailable(response.totalAvailable || 0);
        setTotalAttempted(response.totalAttempted || 0);
      } else {
        setError(response.message || 'No more questions available');
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to load question. Please try again.');
      setCurrentQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    if (showResult) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || submitting) return;

    try {
      setSubmitting(true);
      setError('');

      const response = await authService.authenticatedRequest('/api/user/untimed-practice/track-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion._id,
          selectedAnswer: selectedAnswer,
          isCorrect: currentQuestion.key === selectedAnswer,
          timeSpent: 0
        })
      });

      if (response.success) {
        setResult(response.result);
        
        if (response.userStats) {
          setUserStats(response.userStats);
        }
        
        setShowResult(true);
      } else if (response.alreadyAttempted) {
        setError('You have already attempted this question. Loading next question...');
        setTimeout(() => {
          fetchNextQuestion();
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!currentQuestion || submitting) return;

    try {
      setSubmitting(true);
      setError('');

      const response = await authService.authenticatedRequest('/api/user/untimed-practice/track-skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion._id,
          timeSpent: 0
        })
      });

      if (response.success) {
        setUserStats(response.userStats);
        fetchNextQuestion();
      } else if (response.alreadyAttempted) {
        setError('You have already attempted this question. Loading next question...');
        setTimeout(() => {
          fetchNextQuestion();
        }, 2000);
      } else {
        setError(response.message || 'Failed to skip question');
      }
    } catch (error) {
      console.error('Error skipping question:', error);
      setError('Failed to skip question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    fetchNextQuestion();
  };

  // Get subject name for display
  const getSubjectName = (subject) => {
    const AREA_MAPPING = {
      'all': 'All Subjects',
      '1': 'Current Affairs',
      '2': 'History',
      '3': 'Polity', 
      '4': 'Economy',
      '5': 'Geography',
      '6': 'Ecology',
      '7': 'General Science',
      '8': 'Arts & Culture'
    };
    return AREA_MAPPING[subject?.toString()] || 'Unknown Subject';
  };

  // Get subject color for display
  const getSubjectColor = (subject) => {
    const colors = {
      'all': 'bg-blue-100 text-blue-800 border-blue-200',
      '1': 'bg-red-100 text-red-800 border-red-200',
      '2': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '3': 'bg-blue-100 text-blue-800 border-blue-200',
      '4': 'bg-green-100 text-green-800 border-green-200',
      '5': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      '6': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      '7': 'bg-purple-100 text-purple-800 border-purple-200',
      '8': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[subject?.toString()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex justify-center items-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-gray-600">Loading your question...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion && error && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="text-center py-8 lg:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Practice MCQs</h1>
                <p className="text-gray-600 text-sm lg:text-base">Practice questions at your own pace</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm lg:text-base"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-4 lg:p-6 rounded-full">
              <svg className="w-12 h-12 lg:w-16 lg:h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
            {error.includes('Congratulations') ? 'Congratulations!' : 'No More Questions'}
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-sm lg:text-base">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Try Different Subject</span>
            </button>
            
            <button
              onClick={() => navigate('/performance')}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>View Progress</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 lg:p-3 rounded-lg">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Practice MCQs</h1>
              <p className="text-gray-600 text-sm lg:text-base">Practice questions at your own pace</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>

        {/* Progress Info */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-4 border border-orange-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(selectedSubject)}`}>
                {getSubjectName(selectedSubject)}
              </span>
              {userStats && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {/* <span>Answered: <span className="font-medium text-green-600">{userStats.answered || 0}</span></span>
                  <span>Correct: <span className="font-medium text-emerald-600">{userStats.correct || 0}</span></span>
                  <span>Accuracy: <span className="font-medium text-blue-600">{userStats.accuracy || 0}%</span></span> */}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {/* <span>Available: <span className="font-medium">{totalAvailable}</span></span> */}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && currentQuestion && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:p-8 mb-6">
          {/* Question Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(currentQuestion.area)}`}>
                {getSubjectName(currentQuestion.area)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {currentQuestion.difficulty || 'Medium'}
              </span>
            </div>
            {currentQuestion.source && (
              <span className="text-sm text-gray-500">Source: {currentQuestion.source}</span>
            )}
          </div>

          {/* Question */}
          <div className="mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {['A', 'B', 'C', 'D'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                disabled={showResult || submitting}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === option
                    ? showResult
                      ? result?.correctAnswer === option
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : 'border-orange-500 bg-orange-50 text-orange-800'
                    : showResult && result?.correctAnswer === option
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${showResult || submitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {option}
                  </span>
                  <span className="text-sm lg:text-base">{currentQuestion[`Option${option}`]}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          {!showResult ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitting}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedAnswer && !submitting
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </span>
                ) : (
                  'Submit Answer'
                )}
              </button>
              
              <button
                onClick={handleSkipQuestion}
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Skip Question'}
              </button>
            </div>
          ) : (
            <div>
              {/* Result Display */}
              <div className={`p-4 rounded-lg mb-4 ${
                result?.isCorrect 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {result?.isCorrect ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`font-semibold ${
                    result?.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result?.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                
                {!result?.isCorrect && (
                  <p className="text-sm text-red-700">
                    Correct answer: <span className="font-medium">{result?.correctAnswer}</span>
                  </p>
                )}
              </div>

              {/* Explanation */}
              {result?.explanation && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <p className="text-sm text-blue-800">{result.explanation}</p>
                </div>
              )}

              {/* Next Question Button */}
              <button
                onClick={handleNextQuestion}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all font-medium transform hover:scale-105"
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UntimedPractice;