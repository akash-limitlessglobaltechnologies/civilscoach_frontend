import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { emailUtils } from '../utils/emailUtils';

const TestView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Email and session states
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  
  // Timer and session states
  const [sessionId, setSessionId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const timerRef = useRef(null);
  const isUnloadingRef = useRef(false);

  // Frontend-only area mapping function
  const getAreaName = (areaNumber) => {
    // Convert to number to handle string values
    const areaNum = Number(areaNumber);
    console.log('Area mapping - Input:', areaNumber, 'Converted:', areaNum); // Debug log
    
    const areaNames = {
      1: 'Current Affairs',
      2: 'History', 
      3: 'Polity',
      4: 'Economy',
      5: 'Geography',
      6: 'Ecology',
      7: 'General Science',
      8: 'Arts & Culture'
    };
    
    const result = areaNames[areaNum] || 'Other';
    console.log('Area mapping result:', result); // Debug log
    return result;
  };

  // Area color function
  const getAreaColor = (areaNumber) => {
    // Convert to number to handle string values
    const areaNum = Number(areaNumber);
    
    const colors = {
      1: 'bg-red-100 text-red-800 border-red-200',
      2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      3: 'bg-blue-100 text-blue-800 border-blue-200',
      4: 'bg-green-100 text-green-800 border-green-200',
      5: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      6: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      7: 'bg-purple-100 text-purple-800 border-purple-200',
      8: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[areaNum] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Helper function to convert \n to line breaks in JSX
  const renderWithLineBreaks = (text) => {
    if (!text) return text;
    return text.split('\\n').map((line, index) => (
      <span key={index}>
        {line}
        {index !== text.split('\\n').length - 1 && <br />}
      </span>
    ));
  };

  useEffect(() => {
    // Check for saved email on component mount
    const savedEmail = emailUtils.getEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setEmailSubmitted(true);
    }
  }, []);

  useEffect(() => {
    // Handle time expiry
    if (timeExpired && testStarted && !showResults && !submitting) {
      console.log('Time expired - auto-submitting test');
      submitTest(true);
    }
  }, [timeExpired, testStarted, showResults, submitting]);

  useEffect(() => {
    fetchTest();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
      endTestSession();
    };

    const handleUnload = () => {
      endTestSession();
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (event) => {
      // Escape key to show exit dialog (only during active test)
      if (event.key === 'Escape' && testStarted && !showResults && !timeExpired && !submitting) {
        event.preventDefault();
        setShowExitDialog(true);
      }
    };

    if (testStarted && !showResults) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('unload', handleUnload);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testStarted, showResults, sessionId, timeExpired, submitting]);

  const fetchTest = async () => {
    console.log('Fetching test with ID:', id); // Debug line
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      console.error('Invalid test ID:', id);
      setError('Invalid test ID provided');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Making API call to:', `${import.meta.env.VITE_APP_URI}/api/tests/${id}`); // Debug line
      const response = await axios.get(`${import.meta.env.VITE_APP_URI}/api/tests/${id}`);
      console.log('Test response:', response.data); // Debug line
      
      // Debug: Log area values for each question
      if (response.data.test && response.data.test.questions) {
        console.log('Question area values:');
        response.data.test.questions.forEach((q, index) => {
          console.log(`Q${index + 1}: area = ${q.area} (type: ${typeof q.area}), subarea = ${q.subarea}`);
        });
        
        // TEMPORARY TEST: Override area values to test frontend logic
        console.log('TESTING: Overriding area values for frontend test...');
        response.data.test.questions.forEach((q, index) => {
          q.area = (index % 8) + 1; // This will cycle through areas 1-8
          console.log(`Q${index + 1}: OVERRIDDEN area = ${q.area} -> ${getAreaName(q.area)}`);
        });
      }
      
      setTest(response.data.test);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching test:', error);
      console.error('Error response:', error.response?.data); // Debug line
      setError(error.response?.data?.message || 'Failed to load test');
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    return emailUtils.validateEmail(email);
  };

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Save email with 7-day expiration
    emailUtils.saveEmail(email.trim());
    setEmailSubmitted(true);
    setError('');
  };

  const startTest = async () => {
    try {
      setError('');
      const response = await axios.post(`${import.meta.env.VITE_APP_URI}/api/tests/${id}/start`, {
        email: email.trim()
      });

      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setTimeRemaining(response.data.duration * 60); // Convert minutes to seconds
        setTestStarted(true);
        setShowStartDialog(false);
        
        // Start timer
        startTimer();
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setError(error.response?.data?.message || 'Failed to start test');
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitTest = async (timeExpiredFlag = false) => {
    if (submitting) return;
    
    setSubmitting(true);
    setError('');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const answersArray = Object.entries(selectedAnswers).map(([questionIndex, selectedOption]) => ({
        questionIndex: parseInt(questionIndex),
        selectedOption
      }));

      const response = await axios.post(`${import.meta.env.VITE_APP_URI}/api/tests/${sessionId}/submit`, {
        answers: answersArray,
        timeExpired: timeExpiredFlag
      });

      if (response.data.success) {
        setTestResults(response.data);
        setShowResults(true);
        
        // End the test session
        await endTestSession();
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      setError(error.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const endTestSession = async () => {
    if (sessionId && !isUnloadingRef.current) {
      try {
        await axios.post(`${import.meta.env.VITE_APP_URI}/api/tests/${sessionId}/end`);
      } catch (error) {
        console.error('Error ending test session:', error);
      }
    }
  };

  const handleAnswerChange = (questionIndex, selectedOption) => {
    if (timeExpired || submitting) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const navigateToQuestion = (index) => {
    if (timeExpired || submitting) return;
    setCurrentQuestionIndex(index);
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    test.questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      const correctOption = question.options.find(opt => opt.correct);
      
      if (!userAnswer) {
        unanswered++;
      } else if (userAnswer === correctOption.key) {
        correct++;
      } else {
        wrong++;
      }
    });

    return { correct, wrong, unanswered };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const restartTest = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setTestResults(null);
    setTestStarted(false);
    setTimeExpired(false);
    setTimeRemaining(0);
    setSessionId(null);
    setSubmitting(false);
    setShowStartDialog(true);
  };

  const handleExitTest = () => {
    setShowExitDialog(true);
  };

  const confirmExitTest = async () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // End test session
    await endTestSession();

    // Reset all states and navigate to home
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setTestResults(null);
    setTestStarted(false);
    setTimeExpired(false);
    setTimeRemaining(0);
    setSessionId(null);
    setSubmitting(false);
    setShowStartDialog(true);
    setShowExitDialog(false);

    // Navigate to home
    navigate('/');
  };

  const cancelExitTest = () => {
    setShowExitDialog(false);
  };

  const formatScoring = (scoring) => {
    if (!scoring) return 'Standard (1 / 0 / 0)';
    return `${scoring.correct > 0 ? '+' : ''}${scoring.correct} / ${scoring.wrong} / ${scoring.unanswered}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Link to="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  // Email input screen
  if (!emailSubmitted && showStartDialog) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Enter Your Details</h2>
            <p className="text-lg text-gray-600">Please provide your email to start the test</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
              />
              {emailUtils.hasValidEmail() && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Email will be remembered for {emailUtils.getDaysRemaining()} more days
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={handleEmailSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Test List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Test instructions screen
  if (!testStarted && emailSubmitted && showStartDialog) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{test.name}</h1>
            <p className="text-lg text-gray-600">Ready to start your test?</p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Questions:</strong> {test.questions.length}
                </div>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Duration:</strong> {test.duration} minutes
                </div>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <strong>Type:</strong> {test.paper}
                </div>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <strong>Year:</strong> {test.year}
                </div>
              </div>
            </div>

            {/* Scoring Information */}
            {test.scoring && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Scoring System
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <strong>Correct:</strong> +{test.scoring.correct} marks
                  </div>
                  <div className="flex items-center text-red-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    <strong>Wrong:</strong> {test.scoring.wrong} marks
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    <strong>Unanswered:</strong> {test.scoring.unanswered} marks
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-amber-800 text-sm">
                  <strong>Important:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Timer starts immediately when you begin</li>
                    <li>• You can navigate between questions freely</li>
                    <li>• Test auto-submits when time expires</li>
                    <li>• Closing browser will end your test session</li>
                    <li>• Press <strong>Esc</strong> or use Exit button to quit test safely</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 justify-center">
            <button
              onClick={startTest}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-medium transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M6 10V8a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h4" />
              </svg>
              Start Test
            </button>
            <Link
              to="/"
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-8 rounded-lg font-medium text-center transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show results
  if (showResults && testResults) {
    const { totalScore, scoring, breakdown, percentage } = testResults;
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-full ${parseFloat(percentage) >= 70 ? 'bg-green-100' : parseFloat(percentage) >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <svg className={`w-12 h-12 ${parseFloat(percentage) >= 70 ? 'text-green-600' : parseFloat(percentage) >= 50 ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Test Completed!</h2>
            <p className="text-lg text-gray-600">Your results for {test.name}</p>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{totalScore}</div>
              <div className="text-sm text-purple-800">Total Score</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
              <div className="text-sm text-blue-800">Percentage</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">{breakdown.correct}</div>
              <div className="text-sm text-green-800">Correct</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
              <div className="text-2xl font-bold text-red-600">{breakdown.wrong}</div>
              <div className="text-sm text-red-800">Wrong</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{breakdown.unanswered}</div>
              <div className="text-sm text-gray-800">Unanswered</div>
            </div>
          </div>

          {/* Scoring Breakdown */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Score Calculation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <span>Correct ({breakdown.correct}) × {scoring.correct}:</span>
                <span className="font-semibold">+{(breakdown.correct * scoring.correct).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-100 rounded">
                <span>Wrong ({breakdown.wrong}) × {scoring.wrong}:</span>
                <span className="font-semibold">{(breakdown.wrong * scoring.wrong).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span>Unanswered ({breakdown.unanswered}) × {scoring.unanswered}:</span>
                <span className="font-semibold">{(breakdown.unanswered * scoring.unanswered).toFixed(1)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Score:</span>
                <span className="text-purple-600">{totalScore}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/performance"
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium text-center transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Performance
            </Link>
            <button
              onClick={restartTest}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retake Test
            </button>
            <Link
              to="/"
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium text-center transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Take Another Test
            </Link>
          </div>

          {/* Detailed Results */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Question by Question Review
            </h3>
            {test.questions.map((question, index) => {
              const selectedOption = selectedAnswers[index];
              const correctOption = question.options.find(opt => opt.correct);
              const isCorrect = selectedOption === correctOption.key;
              
              return (
                <div key={index} className={`mb-6 p-4 rounded-lg border-l-4 ${isCorrect ? 'border-green-400 bg-green-50' : selectedOption ? 'border-red-400 bg-red-50' : 'border-gray-400 bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center mb-2 gap-2">
                        <span className="font-medium">Q{index + 1}:</span>
                        {/* Area Display */}
                        {question.area && (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getAreaColor(question.area)}`}>
                            {getAreaName(question.area)}
                          </span>
                        )}
                        {/* Subarea Display */}
                        {question.subarea && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {question.subarea}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800">{renderWithLineBreaks(question.question)}</p>
                    </div>
                    <div className="text-sm font-medium px-2 py-1 rounded ml-4">
                      {!selectedOption ? (
                        <span className="text-gray-600 bg-gray-200 px-2 py-1 rounded">+{scoring.unanswered}</span>
                      ) : isCorrect ? (
                        <span className="text-green-700 bg-green-200 px-2 py-1 rounded">+{scoring.correct}</span>
                      ) : (
                        <span className="text-red-700 bg-red-200 px-2 py-1 rounded">{scoring.wrong}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-100' : selectedOption ? 'bg-red-100' : 'bg-gray-100'}`}>
                      {isCorrect ? (
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : selectedOption ? (
                        <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm ${isCorrect ? 'text-green-600' : selectedOption ? 'text-red-600' : 'text-gray-600'}`}>
                      Your answer: {selectedOption || 'Not answered'}
                    </p>
                  </div>
                  <p className="text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Correct answer: {correctOption.key}
                  </p>
                  {question.explanation && (
                    <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <strong>Explanation:</strong> {renderWithLineBreaks(question.explanation)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Loading state during auto-submission
  if (testStarted && (timeExpired || timeRemaining === 0) && submitting) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-4 rounded-full">
              <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Time's Up!</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Submitting your test automatically...</p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header with Timer */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">{test.name}</h1>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center text-2xl font-mono ${timeRemaining <= 300 ? 'text-red-200' : 'text-white'} ${timeRemaining <= 10 ? 'animate-pulse' : ''}`}>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(Math.max(0, timeRemaining))}
              </div>
              <button
                onClick={handleExitTest}
                disabled={submitting}
                className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exit Test"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center text-blue-100">
            <div>
              <span>{test.paper} - {test.year}</span>
              {test.scoring && (
                <span className="ml-4 text-xs bg-blue-700 px-2 py-1 rounded">
                  Scoring: {formatScoring(test.scoring)}
                </span>
              )}
            </div>
            <span>Question {currentQuestionIndex + 1} of {test.questions.length}</span>
          </div>
          {(timeExpired || timeRemaining === 0) && (
            <div className="mt-2 text-center text-red-200 font-bold animate-pulse flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              TIME EXPIRED - Auto-submitting...
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-2">
          <div 
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Time Warning */}
        {timeRemaining <= 300 && timeRemaining > 0 && !timeExpired && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-900 font-bold">
                ⚠️ Less than 5 minutes remaining!
              </p>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            {/* Area and Subarea Display */}
            <div className="mb-4 flex items-center flex-wrap gap-2">
              {/* Area Display */}
              {currentQuestion.area && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getAreaColor(currentQuestion.area)}`}>
                  <span>{getAreaName(currentQuestion.area)}</span>
                </div>
              )}
              
              {/* Subarea Display */}
              {currentQuestion.subarea && (
                <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-xs font-medium">Topic: {currentQuestion.subarea}</span>
                </div>
              )}
            </div>
            
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {renderWithLineBreaks(currentQuestion.question)}
            </h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label 
                  key={option.key}
                  className={`flex items-start p-4 border rounded-lg transition-colors ${
                    timeExpired || submitting || timeRemaining === 0
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  } ${
                    selectedAnswers[currentQuestionIndex] === option.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={option.key}
                    checked={selectedAnswers[currentQuestionIndex] === option.key}
                    onChange={() => handleAnswerChange(currentQuestionIndex, option.key)}
                    disabled={timeExpired || submitting || timeRemaining === 0}
                    className="mr-3 text-blue-600 mt-1"
                  />
                  <span className="font-medium text-gray-800 mr-3 mt-0">{option.key}.</span>
                  <span className="text-gray-800">{renderWithLineBreaks(option.text)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0 || timeExpired || submitting}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {currentQuestionIndex === test.questions.length - 1 ? (
              <button
                onClick={() => submitTest(false)}
                disabled={submitting || timeExpired}
                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Test
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === test.questions.length - 1 || timeExpired || submitting}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation Grid */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Question Navigator</h3>
          <div className="grid grid-cols-10 gap-2">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => navigateToQuestion(index)}
                disabled={timeExpired || submitting}
                className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                  currentQuestionIndex === index
                    ? 'bg-blue-600 text-white'
                    : selectedAnswers[index]
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } ${timeExpired || submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center mt-4 text-xs text-gray-600 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded mr-1"></div>
              <span>Not Answered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Exit Test?</h3>
                <p className="text-sm text-gray-600">Are you sure you want to exit this test?</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-amber-800 text-sm">
                  <strong>Warning:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• All your progress will be lost</li>
                    <li>• Your answers will not be saved</li>
                    <li>• You'll need to restart the entire test</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelExitTest}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExitTest}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestView;