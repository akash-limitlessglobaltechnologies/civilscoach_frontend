import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authService';
import axios from 'axios';

const UntimedPractice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authService, isAuthenticated } = useAuth();
  
  // Get selected subject from navigation state
  const selectedSubject = location.state?.subject || null;
  const subjectName = location.state?.subjectName || 'All Subjects';
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [questionsSkipped, setQuestionsSkipped] = useState(0);

  // Area mapping
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

  // Redirect if no subject selected
  useEffect(() => {
    if (!selectedSubject) {
      navigate('/');
      return;
    }
    fetchNextQuestion();
  }, [selectedSubject]);

  const fetchNextQuestion = async () => {
    if (!isAuthenticated) {
      setError('Please login to continue practice');
      return;
    }

    setLoading(true);
    setError('');
    setShowAnswer(false);
    setSelectedOption(null);
    setIsCorrect(null);

    try {
      // Build query parameters based on selected subject
      let params = {
        limit: 1,
        sortBy: 'random'
      };

      if (selectedSubject !== 'all') {
        params.area = selectedSubject;
      }

      const queryString = new URLSearchParams(params).toString();
      
      const response = await authService.authenticatedRequest(`/api/user/untimed-practice/next?${queryString}`);
      
      if (response.success && response.question) {
        setCurrentQuestion(response.question);
      } else {
        setError('No more questions available for this subject. Try a different subject or check back later.');
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      setError(error.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    if (showAnswer) return; // Prevent changing answer after showing result
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    const correct = selectedOption === currentQuestion.key;
    setIsCorrect(correct);
    setShowAnswer(true);

    // Track the answer
    trackAnswer(currentQuestion._id, selectedOption, correct);
    setQuestionsCompleted(prev => prev + 1);
  };

  const handleSkip = () => {
    if (!currentQuestion) return;

    // Track the skip
    trackSkip(currentQuestion._id);
    setQuestionsSkipped(prev => prev + 1);
    fetchNextQuestion();
  };

  const handleNext = () => {
    fetchNextQuestion();
  };

  const trackAnswer = async (questionId, answer, isCorrect) => {
    try {
      await authService.authenticatedRequest('/api/user/untimed-practice/track-answer', {
        method: 'POST',
        body: JSON.stringify({
          questionId,
          selectedAnswer: answer,
          isCorrect,
          timeSpent: 0 // Not tracking time for untimed practice
        })
      });
    } catch (error) {
      console.error('Error tracking answer:', error);
    }
  };

  const trackSkip = async (questionId) => {
    try {
      await authService.authenticatedRequest('/api/user/untimed-practice/track-skip', {
        method: 'POST', 
        body: JSON.stringify({
          questionId
        })
      });
    } catch (error) {
      console.error('Error tracking skip:', error);
    }
  };

  const getOptionColor = (option) => {
    if (!showAnswer) {
      if (selectedOption === option) {
        return 'bg-blue-100 border-blue-500 text-blue-900';
      }
      return 'bg-white border-gray-200 hover:bg-gray-50';
    }

    // After answer is shown
    if (option === currentQuestion.key) {
      return 'bg-green-100 border-green-500 text-green-900'; // Correct answer
    }
    
    if (selectedOption === option && option !== currentQuestion.key) {
      return 'bg-red-100 border-red-500 text-red-900'; // Wrong selected answer
    }

    return 'bg-gray-50 border-gray-200 text-gray-500';
  };

  const getResultIcon = () => {
    if (isCorrect === null) return null;
    
    return isCorrect ? (
      <div className="flex items-center space-x-2 text-green-600">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold">Correct!</span>
      </div>
    ) : (
      <div className="flex items-center space-x-2 text-red-600">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold">Incorrect</span>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to access untimed practice</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Home</span>
              </button>
              <div className="text-lg font-semibold text-gray-900">
                Untimed Practice - {subjectName}
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{questionsCompleted}</div>
                <div className="text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{questionsSkipped}</div>
                <div className="text-gray-500">Skipped</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Loading question...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Question</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchNextQuestion}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="bg-white rounded-xl shadow-sm border">
            {/* Question Info */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {AREA_MAPPING[currentQuestion.area] || 'Unknown Subject'}
                  </span>
                  {currentQuestion.subarea && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      {currentQuestion.subarea}
                    </span>
                  )}
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    currentQuestion.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    currentQuestion.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {currentQuestion.difficulty || 'Medium'}
                  </span>
                </div>
                
                {showAnswer && getResultIcon()}
              </div>

              {/* Question Text */}
              <div className="prose max-w-none">
                <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-line">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showAnswer}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getOptionColor(option)} ${
                      !showAnswer ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-sm font-bold">
                        {option}
                      </span>
                      <span className="flex-1">{currentQuestion[`Option${option}`]}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Explanation */}
              {showAnswer && currentQuestion.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
                  <p className="text-blue-800 whitespace-pre-line">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                {!showAnswer ? (
                  <>
                    <button
                      onClick={handleSkip}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Skip Question
                    </button>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedOption}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Answer
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNext}
                    className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Next Question →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No question available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UntimedPractice;