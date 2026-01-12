import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const TestView = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { authService } = useAuth();

  const [test, setTest] = useState(null);
  const [sessionData, setSessionData] = useState(location.state?.testData || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [questionStartTimes, setQuestionStartTimes] = useState({});
  const [questionAttempts, setQuestionAttempts] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Enhanced helper function to format text with proper line breaks
  const formatTextWithLineBreaks = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    // First, normalize different line break patterns
    let processedText = text
      .replace(/\\n/g, '\n')  // Replace literal \n with actual line breaks
      .replace(/\r\n/g, '\n') // Replace Windows line breaks
      .replace(/\r/g, '\n');  // Replace Mac line breaks
    
    // Split into lines and process each line
    const lines = processedText.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip completely empty lines
      if (trimmedLine === '' && index < lines.length - 1) {
        return <br key={index} />;
      }
      
      return (
        <React.Fragment key={index}>
          {trimmedLine}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  // Area mapping for display
  const getAreaName = (areaNumber) => {
    const areaMap = {
      1: 'Current Affairs',
      2: 'History',
      3: 'Polity',
      4: 'Economy',
      5: 'Geography',
      6: 'Ecology',
      7: 'General Science',
      8: 'Arts & Culture'
    };
    return areaMap[areaNumber] || `Area ${areaNumber}`;
  };

  useEffect(() => {
    if (!sessionData) {
      // If no session data, redirect to home
      navigate('/', { replace: true });
      return;
    }

    fetchTestData();
  }, [id, sessionData]);

  // Add protection against accidental navigation
  useEffect(() => {
    if (testStarted && !submitting) {
      // Warn user before leaving page
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Your test progress will be lost if you leave this page. Are you sure?';
        return 'Your test progress will be lost if you leave this page. Are you sure?';
      };

      // Add event listener
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [testStarted, submitting]);

  // Custom navigation handler for internal navigation
  const handleNavigationWarning = () => {
    if (testStarted && !submitting) {
      return window.confirm(
        'Your test is in progress. If you leave now, your progress will be lost and you won\'t be able to resume. Are you sure you want to exit?'
      );
    }
    return true;
  };

  // Override the navigate function to add warning
  const protectedNavigate = (to, options = {}) => {
    if (handleNavigationWarning()) {
      navigate(to, options);
    }
  };

  useEffect(() => {
    if (testStarted && sessionData) {
      // Start timer when test begins
      const duration = sessionData.duration * 60; // Convert to seconds
      setTimeRemaining(duration);
      
      // Track question start time
      setQuestionStartTimes(prev => ({
        ...prev,
        [currentQuestionIndex]: Date.now()
      }));
    }
  }, [testStarted, sessionData]);

  useEffect(() => {
    if (timeRemaining > 0 && testStarted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Time expired - auto submit
            handleSubmit(true);
          }
          return newTime;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeRemaining, testStarted]);

  const fetchTestData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_URI}/api/tests/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setTest(data.test);
        
        // Initialize question tracking
        const initialStartTimes = {};
        initialStartTimes[0] = Date.now();
        setQuestionStartTimes(initialStartTimes);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching test data:', error);
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionKey) => {
    const previousAnswer = answers[questionIndex];
    
    // Track answer changes as attempts
    if (previousAnswer && previousAnswer !== optionKey) {
      setQuestionAttempts(prev => ({
        ...prev,
        [questionIndex]: (prev[questionIndex] || 1) + 1
      }));
    } else if (!previousAnswer) {
      setQuestionAttempts(prev => ({
        ...prev,
        [questionIndex]: 1
      }));
    }

    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionKey
    }));
  };

  const navigateToQuestion = (index) => {
    // Calculate time spent on current question
    const currentTime = Date.now();
    const startTime = questionStartTimes[currentQuestionIndex];
    
    if (startTime) {
      const timeSpent = Math.floor((currentTime - startTime) / 1000);
      // Store time spent (you could save this to track per-question timing)
    }

    setCurrentQuestionIndex(index);
    
    // Track start time for new question
    setQuestionStartTimes(prev => ({
      ...prev,
      [index]: currentTime
    }));
  };

  const toggleFlag = (questionIndex) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleExit = () => {
    setShowExitModal(false);
    // Clear any stored test data
    navigate('/', { replace: true });
  };

  const handleSubmit = async (timeExpired = false) => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      // Debug logging for answers
      console.log('TestView - Submitting answers:', answers);
      console.log('TestView - Answer object keys:', Object.keys(answers));
      console.log('TestView - Answer object values:', Object.values(answers));
      
      // Calculate detailed answer data
      const detailedAnswers = Object.entries(answers).map(([questionIndex, selectedOption]) => {
        const qIndex = parseInt(questionIndex);
        const question = test.questions[qIndex];
        const correctOption = question.options.find(opt => opt.correct);
        
        // Calculate time spent on this question
        const startTime = questionStartTimes[qIndex] || 0;
        const endTime = Date.now();
        const timeSpent = startTime ? Math.floor((endTime - startTime) / 1000) : 0;
        
        return {
          questionIndex: qIndex,
          selectedOption,
          timeSpent,
          attempts: questionAttempts[qIndex] || 1,
          isFlagged: flaggedQuestions.has(qIndex)
        };
      });

      // Add device info and analytics
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenSize: `${screen.width}x${screen.height}`
      };

      const analytics = {
        interruptions: 0, // Could track window focus/blur events
        totalFlags: flaggedQuestions.size,
        questionsVisited: Object.keys(questionStartTimes).length
      };

      const response = await authService.authenticatedRequest(
        `/api/tests/${sessionData.sessionId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: detailedAnswers,
            timeExpired,
            deviceInfo,
            analytics
          })
        }
      );

      if (response.success) {
        // Calculate stats before navigation for immediate availability
        const totalQuestions = test.questions.length;
        let correctCount = 0;
        let wrongCount = 0;
        let answeredCount = Object.keys(answers).length;
        
        Object.entries(answers).forEach(([questionIndex, selectedOption]) => {
          const qIndex = parseInt(questionIndex);
          const question = test.questions[qIndex];
          const correctOption = question.options.find(opt => opt.correct);
          
          if (selectedOption === correctOption?.key) {
            correctCount++;
          } else {
            wrongCount++;
          }
        });
        
        const percentage = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0;
        
        console.log('TestView - Calculated stats before navigation:', {
          correctCount,
          wrongCount,
          answeredCount,
          totalQuestions,
          percentage,
          rawAnswers: answers
        });
        
        // Navigate to results page with detailed data including test questions
        navigate('/test-result', {
          state: { 
            testResult: {
              ...response,
              testName: test.name,
              testType: test.testType,
              // Include raw answers for easier processing in TestResult
              rawAnswers: answers,
              detailedAnswers: detailedAnswers,
              // Include pre-calculated stats
              preCalculatedStats: {
                correctAnswers: correctCount,
                wrongAnswers: wrongCount,
                answeredQuestions: answeredCount,
                percentage: parseFloat(percentage)
              }
            },
            testDetails: {
              name: test.name,
              testType: test.testType,
              questions: test.questions,
              duration: sessionData.duration
            }
          },
          replace: true
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Error submitting test. Please try again.');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnswerStats = () => {
    const answered = Object.keys(answers).length;
    const total = test?.questions.length || 0;
    const flagged = flaggedQuestions.size;
    const unanswered = total - answered;
    
    return { answered, total, flagged, unanswered };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Test not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const stats = getAnswerStats();

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-8 max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.name}</h1>
            <p className="text-gray-600">Please read the instructions carefully before starting</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{sessionData.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{test.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Type:</span>
                  <span className="font-medium">{test.testType}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Each question has only one correct answer</li>
                <li>• You can navigate between questions freely</li>
                <li>• Use the flag feature to mark questions for review</li>
                <li>• Your progress is saved automatically</li>
                <li>• Submit only when you're completely done</li>
                <li>• The timer will auto-submit when it reaches zero</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-yellow-800 text-sm font-medium">Important:</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Once you start the test, the timer will begin. Ensure you have a stable internet connection 
                  and avoid refreshing the page or navigating away as it may result in loss of progress.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel Test
            </button>
            <button
              onClick={() => {
                setShowInstructions(false);
                setTestStarted(true);
              }}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">{test.name}</h1>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {test.testType}
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Remaining</div>
                <div className={`font-mono text-lg font-semibold ${timeRemaining <= 300 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowExitModal(true)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Exit Test
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Question {currentQuestionIndex + 1}
                  </h2>
                  {currentQuestion.area && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {getAreaName(currentQuestion.area)}
                    </span>
                  )}
                  {currentQuestion.subarea && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                      {currentQuestion.subarea}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => toggleFlag(currentQuestionIndex)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                    flaggedQuestions.has(currentQuestionIndex)
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <div className="text-gray-900 leading-relaxed text-lg whitespace-pre-line">
                  {formatTextWithLineBreaks(currentQuestion.question)}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestionIndex, option.key)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      answers[currentQuestionIndex] === option.key
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestionIndex] === option.key
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[currentQuestionIndex] === option.key && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium text-gray-700">{option.key}</span>
                      <div className="flex-1 whitespace-pre-line">
                        {formatTextWithLineBreaks(option.text)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} of {test.questions.length}
                </div>

                <button
                  onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                  disabled={currentQuestionIndex === test.questions.length - 1}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {test.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-10 h-10 rounded text-sm font-medium transition-all relative ${
                      index === currentQuestionIndex
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                        : answers[index]
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                    {flaggedQuestions.has(index) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                    <span className="text-gray-600">Answered</span>
                  </div>
                  <span className="font-medium">{stats.answered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div>
                    <span className="text-gray-600">Not Answered</span>
                  </div>
                  <span className="font-medium">{stats.unanswered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
                    <span className="text-gray-600">Flagged</span>
                  </div>
                  <span className="font-medium">{stats.flagged}</span>
                </div>
              </div>

              {stats.flagged > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Flagged Questions</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(flaggedQuestions).map(questionIndex => (
                      <button
                        key={questionIndex}
                        onClick={() => navigateToQuestion(questionIndex)}
                        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
                      >
                        Q{questionIndex + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Exit Test</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to exit this test? Your progress will be lost and you will not be able to resume this test session.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-red-800 text-sm font-medium">Warning:</p>
                    <ul className="text-red-700 text-sm mt-1 space-y-1">
                      <li>• Your test will be cancelled</li>
                      <li>• You cannot resume this test session</li>
                      <li>• Your answers will not be saved</li>
                      <li>• No score will be recorded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={handleExit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Test</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Answered:</span>
                <span className="font-medium">{stats.answered} / {stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unanswered:</span>
                <span className="font-medium text-red-600">{stats.unanswered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Remaining:</span>
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
            </div>

            {stats.unanswered > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  You have {stats.unanswered} unanswered questions. Are you sure you want to submit?
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestView;