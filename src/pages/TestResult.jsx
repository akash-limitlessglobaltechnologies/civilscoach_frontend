import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const TestResult = () => {
  const [resultData, setResultData] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [viewMode, setViewMode] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHistoricalData, setIsHistoricalData] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { recordId } = useParams(); // Get recordId from URL params
  const { user, authService } = useAuth();

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

  // Helper function to format text with line breaks
  const formatTextWithLineBreaks = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    const lines = text
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n');
    
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {line.trim()}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Fixed function to get user answer for a question with debugging
  const getUserAnswer = (questionIndex) => {
    if (!resultData?.userAnswers) {
      console.log(`getUserAnswer(${questionIndex}): No userAnswers in resultData`);
      return null;
    }
    
    // Try different ways to access the answer
    const userAnswers = resultData.userAnswers;
    
    // Direct access
    if (userAnswers[questionIndex] !== undefined && userAnswers[questionIndex] !== null && userAnswers[questionIndex] !== '') {
      return userAnswers[questionIndex];
    }
    
    // String key access
    if (userAnswers[questionIndex.toString()] !== undefined && userAnswers[questionIndex.toString()] !== null && userAnswers[questionIndex.toString()] !== '') {
      return userAnswers[questionIndex.toString()];
    }
    
    // Array access (if it's an array)
    if (Array.isArray(userAnswers) && userAnswers[questionIndex] !== undefined && userAnswers[questionIndex] !== null && userAnswers[questionIndex] !== '') {
      return userAnswers[questionIndex];
    }
    
    return null;
  };

  // Calculate correct answers with proper logic and fallback
  const calculateCorrectAnswers = () => {
    // Use breakdown data if available (from new TestView format)
    if (resultData?.breakdown?.correct !== undefined) {
      return resultData.breakdown.correct;
    }
    
    // Use pre-calculated value if available (legacy support)
    if (resultData?.correctAnswers !== undefined) {
      return resultData.correctAnswers;
    }
    
    if (!resultData?.userAnswers || !testDetails?.questions) return 0;
    
    let correctCount = 0;
    
    for (let i = 0; i < testDetails.questions.length; i++) {
      const question = testDetails.questions[i];
      const correctOption = question?.options?.find(opt => opt.correct);
      const userAnswer = getUserAnswer(i);
      
      if (userAnswer && userAnswer === correctOption?.key) {
        correctCount++;
      }
    }
    
    return correctCount;
  };

  // Calculate wrong answers with proper logic and fallback
  const calculateWrongAnswers = () => {
    // Use breakdown data if available (from new TestView format)
    if (resultData?.breakdown?.wrong !== undefined) {
      return resultData.breakdown.wrong;
    }
    
    // Use pre-calculated value if available (legacy support)
    if (resultData?.wrongAnswers !== undefined) {
      return resultData.wrongAnswers;
    }
    
    if (!resultData?.userAnswers || !testDetails?.questions) return 0;
    
    let wrongCount = 0;
    
    for (let i = 0; i < testDetails.questions.length; i++) {
      const question = testDetails.questions[i];
      const correctOption = question?.options?.find(opt => opt.correct);
      const userAnswer = getUserAnswer(i);
      
      // Only count as wrong if user answered and it's incorrect
      if (userAnswer && userAnswer !== correctOption?.key) {
        wrongCount++;
      }
    }
    
    return wrongCount;
  };

  // Calculate answered questions with proper logic and fallback
  const calculateAnsweredQuestions = () => {
    // Use breakdown data if available (from new TestView format)
    if (resultData?.breakdown?.answered !== undefined) {
      return resultData.breakdown.answered;
    }
    
    // Use pre-calculated value if available (legacy support)
    if (resultData?.answeredQuestions !== undefined) {
      return resultData.answeredQuestions;
    }
    
    if (!resultData?.userAnswers || !testDetails?.questions) return 0;
    
    let answeredCount = 0;
    
    for (let i = 0; i < testDetails.questions.length; i++) {
      const userAnswer = getUserAnswer(i);
      if (userAnswer) {
        answeredCount++;
      }
    }
    
    return answeredCount;
  };

  // Calculate unanswered questions with proper logic
  const calculateUnansweredQuestions = () => {
    // Use breakdown data if available (from new TestView format)
    if (resultData?.breakdown?.unanswered !== undefined) {
      return resultData.breakdown.unanswered;
    }
    
    if (!testDetails?.questions) return 0;
    
    const totalQuestions = testDetails.questions.length;
    const answeredQuestions = calculateAnsweredQuestions();
    
    return totalQuestions - answeredQuestions;
  };

  // Enhanced function to calculate topic-wise and sub-topic-wise statistics
  const calculateTopicWiseStats = () => {
    if (!testDetails?.questions || !resultData?.userAnswers) return { topicStats: [], subTopicStats: [] };
    
    const topicMap = {};
    const subTopicMap = {};
    
    // Process each question
    testDetails.questions.forEach((question, index) => {
      const userAnswer = getUserAnswer(index);
      const correctOption = question?.options?.find(opt => opt.correct);
      const isCorrect = userAnswer && userAnswer === correctOption?.key;
      const isAnswered = !!userAnswer;
      
      // Topic-wise stats (areas 1-7)
      if (question.area && question.area >= 1 && question.area <= 7) {
        const topicKey = question.area;
        
        if (!topicMap[topicKey]) {
          topicMap[topicKey] = {
            area: topicKey,
            areaName: getAreaName(topicKey),
            total: 0,
            correct: 0,
            wrong: 0,
            answered: 0,
            unanswered: 0
          };
        }
        
        topicMap[topicKey].total++;
        if (isAnswered) {
          topicMap[topicKey].answered++;
          if (isCorrect) {
            topicMap[topicKey].correct++;
          } else {
            topicMap[topicKey].wrong++;
          }
        } else {
          topicMap[topicKey].unanswered++;
        }
      }
      
      // Sub-topic-wise stats (for each unique subarea)
      if (question.subarea) {
        const subTopicKey = `${question.area || 'unknown'}-${question.subarea}`;
        
        if (!subTopicMap[subTopicKey]) {
          subTopicMap[subTopicKey] = {
            area: question.area,
            areaName: getAreaName(question.area),
            subarea: question.subarea,
            total: 0,
            correct: 0,
            wrong: 0,
            answered: 0,
            unanswered: 0
          };
        }
        
        subTopicMap[subTopicKey].total++;
        if (isAnswered) {
          subTopicMap[subTopicKey].answered++;
          if (isCorrect) {
            subTopicMap[subTopicKey].correct++;
          } else {
            subTopicMap[subTopicKey].wrong++;
          }
        } else {
          subTopicMap[subTopicKey].unanswered++;
        }
      }
    });
    
    // Calculate percentages and accuracy
    const topicStats = Object.values(topicMap).map(topic => ({
      ...topic,
      percentage: topic.total > 0 ? ((topic.correct / topic.total) * 100).toFixed(1) : '0.0',
      accuracy: topic.answered > 0 ? ((topic.correct / topic.answered) * 100).toFixed(1) : '0.0'
    }));
    
    const subTopicStats = Object.values(subTopicMap).map(subTopic => ({
      ...subTopic,
      percentage: subTopic.total > 0 ? ((subTopic.correct / subTopic.total) * 100).toFixed(1) : '0.0',
      accuracy: subTopic.answered > 0 ? ((subTopic.correct / subTopic.answered) * 100).toFixed(1) : '0.0'
    }));
    
    // Sort by area number for consistency
    topicStats.sort((a, b) => a.area - b.area);
    subTopicStats.sort((a, b) => {
      if (a.area !== b.area) return a.area - b.area;
      return a.subarea.localeCompare(b.subarea);
    });
    
    return { topicStats, subTopicStats };
  };

  useEffect(() => {
    console.log('=== TESTRESULT RECEIVED DATA ===');
    console.log('RecordId from params:', recordId);
    console.log('Full location.state:', location.state);
    
    // PRIORITY 1: Handle historical data (from Performance page with recordId)
    if (recordId) {
      console.log('=== LOADING HISTORICAL DATA ===');
      setIsHistoricalData(true);
      fetchHistoricalTestData(recordId);
      return;
    }
    
    // PRIORITY 2: Handle new format from fixed TestView (resultData + testDetails)
    if (location.state?.resultData && location.state?.testDetails) {
      console.log('=== USING NEW DATA FORMAT ===');
      console.log('Result Data:', location.state.resultData);
      console.log('Test Details:', location.state.testDetails);
      console.log('User Answers:', location.state.resultData.userAnswers);
      
      // Data is already calculated in TestView, use it directly
      setIsHistoricalData(false);
      setResultData(location.state.resultData);
      setTestDetails(location.state.testDetails);
      setLoading(false);
    } 
    // PRIORITY 3: Legacy format support (testResult + testDetails)
    else if (location.state?.testResult && location.state?.testDetails) {
      console.log('=== USING LEGACY DATA FORMAT ===');
      const testResult = location.state.testResult;
      const testDetails = location.state.testDetails;
      
      console.log('Raw testResult:', testResult);
      console.log('Raw testDetails:', testDetails);
      
      // Process user answers from different possible sources
      let userAnswers = {};
      let correctCount = 0;
      let wrongCount = 0;
      let answeredCount = 0;
      
      // Method 1: Check if we have preCalculatedStats (most reliable)
      if (testResult.preCalculatedStats) {
        console.log('Using preCalculatedStats from TestView:', testResult.preCalculatedStats);
        correctCount = testResult.preCalculatedStats.correctAnswers;
        wrongCount = testResult.preCalculatedStats.wrongAnswers;
        answeredCount = testResult.preCalculatedStats.answeredQuestions;
        
        // For userAnswers, prefer rawAnswers if available
        if (testResult.rawAnswers && typeof testResult.rawAnswers === 'object') {
          userAnswers = testResult.rawAnswers;
        }
      }
      // Method 2: Check if we have rawAnswers (direct from TestView)
      else if (testResult.rawAnswers && typeof testResult.rawAnswers === 'object') {
        console.log('Using rawAnswers from TestView:', testResult.rawAnswers);
        userAnswers = testResult.rawAnswers;
        
        // Calculate stats if needed
        if (testDetails.questions && Array.isArray(testDetails.questions)) {
          testDetails.questions.forEach((question, index) => {
            const userAnswer = userAnswers[index] || userAnswers[index.toString()];
            const correctOption = question.options?.find(opt => opt.correct);
            
            if (userAnswer) {
              answeredCount++;
              if (userAnswer === correctOption?.key) {
                correctCount++;
              } else {
                wrongCount++;
              }
            }
          });
        }
      }
      // Method 3: Check if answers are in testResult.answers (array format from API)
      else if (testResult.answers && Array.isArray(testResult.answers)) {
        console.log('Processing answers array:', testResult.answers);
        testResult.answers.forEach(answer => {
          if (answer.questionIndex !== undefined && answer.selectedOption) {
            userAnswers[answer.questionIndex] = answer.selectedOption;
          }
        });
      }
      // Method 4: Check if detailedAnswers are available
      else if (testResult.detailedAnswers && Array.isArray(testResult.detailedAnswers)) {
        console.log('Processing detailedAnswers array:', testResult.detailedAnswers);
        testResult.detailedAnswers.forEach(answer => {
          if (answer.questionIndex !== undefined && answer.selectedOption) {
            userAnswers[answer.questionIndex] = answer.selectedOption;
          }
        });
      }
      // Method 5: Check if answers are in testResult.userAnswers (object format)
      else if (testResult.userAnswers && typeof testResult.userAnswers === 'object') {
        console.log('Using userAnswers object:', testResult.userAnswers);
        userAnswers = testResult.userAnswers;
      }
      // Method 6: Check if answers are directly in testResult as object
      else if (testResult.answers && typeof testResult.answers === 'object' && !Array.isArray(testResult.answers)) {
        console.log('Using answers object:', testResult.answers);
        userAnswers = testResult.answers;
      }
      // Method 7: Check root level properties for answer data
      else {
        console.log('Checking for other answer formats in testResult...');
        // Look for any property that might contain the answers
        Object.keys(testResult).forEach(key => {
          if (key.toLowerCase().includes('answer') && typeof testResult[key] === 'object') {
            console.log(`Found answers in ${key}:`, testResult[key]);
            if (Array.isArray(testResult[key])) {
              testResult[key].forEach(answer => {
                if (answer.questionIndex !== undefined && answer.selectedOption) {
                  userAnswers[answer.questionIndex] = answer.selectedOption;
                }
              });
            } else {
              userAnswers = testResult[key];
            }
          }
        });
      }
      
      console.log('Processed userAnswers:', userAnswers);
      
      // Calculate basic stats if not already calculated
      if (correctCount === 0 && wrongCount === 0 && answeredCount === 0) {
        if (testDetails.questions && Array.isArray(testDetails.questions)) {
          testDetails.questions.forEach((question, index) => {
            const userAnswer = userAnswers[index] || userAnswers[index.toString()];
            const correctOption = question.options?.find(opt => opt.correct);
            
            if (userAnswer) {
              answeredCount++;
              if (userAnswer === correctOption?.key) {
                correctCount++;
              } else {
                wrongCount++;
              }
            }
          });
        }
      }
      
      const totalQuestions = testDetails.questions?.length || 0;
      const percentage = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0;
      
      console.log('Calculated stats:', {
        correctCount,
        wrongCount,
        answeredCount,
        totalQuestions,
        percentage
      });
      
      setResultData({
        percentage: parseFloat(percentage),
        breakdown: testResult.breakdown || {},
        totalScore: correctCount,
        timeTaken: testResult.timeTaken || testResult.duration || 0,
        userAnswers: userAnswers,
        // Add calculated stats for backup
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        answeredQuestions: answeredCount
      });
      
      setTestDetails(testDetails);
      setLoading(false);
    } else {
      console.log('=== NO VALID DATA FOUND ===');
      console.error('No valid test result data found in location.state:', location.state);
      setError('No test result data found. Please take a test first.');
      setLoading(false);
    }
  }, [recordId, location.state]);

  // Fetch historical test data from API
  const fetchHistoricalTestData = async (recordId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching historical data from API for recordId:', recordId);
      
      const response = await authService.authenticatedRequest(`/api/user/attempts/${recordId}`);
      
      console.log('Historical data response:', response);
      
      if (response && response.testAttempt) {
        const testAttempt = response.testAttempt;
        
        // Convert historical data to format expected by TestResult
        const userAnswers = {};
        if (testAttempt.answers && typeof testAttempt.answers === 'object') {
          // Handle Map-like structure from MongoDB
          for (const [questionIndex, answerData] of Object.entries(testAttempt.answers)) {
            if (answerData && typeof answerData === 'object') {
              userAnswers[questionIndex] = answerData.selectedOption || '';
            } else {
              userAnswers[questionIndex] = answerData || '';
            }
          }
        }
        
        // Structure the result data
        setResultData({
          percentage: testAttempt.percentage || 0,
          breakdown: testAttempt.analytics?.subjectWisePerformance || {},
          totalScore: testAttempt.score || 0,
          timeTaken: testAttempt.timeTaken || 0,
          userAnswers: userAnswers,
          correctAnswers: testAttempt.correctAnswers || 0,
          wrongAnswers: testAttempt.wrongAnswers || 0,
          answeredQuestions: (testAttempt.correctAnswers || 0) + (testAttempt.wrongAnswers || 0)
        });
        
        // Structure the test details - get questions from the linked test
        try {
          const testResponse = await authService.authenticatedRequest(`/api/tests/${testAttempt.testId}`);
          
          if (testResponse && testResponse.test) {
            setTestDetails({
              name: testAttempt.testName,
              testType: testAttempt.testType,
              questions: testResponse.test.questions || [],
              duration: testAttempt.timeAllotted || testAttempt.timeTaken
            });
          } else {
            throw new Error('Could not fetch test questions');
          }
        } catch (testError) {
          console.warn('Could not fetch full test details:', testError);
          // Fallback if we can't get the full test details
          setTestDetails({
            name: testAttempt.testName,
            testType: testAttempt.testType,
            questions: [],
            duration: testAttempt.timeAllotted || testAttempt.timeTaken
          });
        }
        
        console.log('Historical data processed successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching historical test data:', error);
      setError(`Failed to load test analysis: ${error.message || 'Unknown error occurred'}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData || !testDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Please take a test to view results.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Take a Test
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats using fixed functions with debugging
  const correctAnswers = calculateCorrectAnswers();
  const wrongAnswers = calculateWrongAnswers();
  const answeredQuestions = calculateAnsweredQuestions();
  const unansweredQuestions = calculateUnansweredQuestions();
  const totalQuestions = testDetails?.questions?.length || 0;
  const accuracy = answeredQuestions > 0 ? ((correctAnswers / answeredQuestions) * 100).toFixed(1) : 0;

  // Debug logging
  console.log('Final calculated stats:', {
    correctAnswers,
    wrongAnswers,
    answeredQuestions,
    unansweredQuestions,
    totalQuestions,
    accuracy,
    percentage: resultData?.percentage,
    userAnswers: resultData?.userAnswers
  });

  // Validation check
  if (correctAnswers + wrongAnswers !== answeredQuestions) {
    console.warn('Stats validation failed:', {
      'correct + wrong': correctAnswers + wrongAnswers,
      'answered': answeredQuestions,
      'should be equal': 'but they are not'
    });
  }

  if (answeredQuestions + unansweredQuestions !== totalQuestions) {
    console.warn('Total questions validation failed:', {
      'answered + unanswered': answeredQuestions + unansweredQuestions,
      'total': totalQuestions,
      'should be equal': 'but they are not'
    });
  }

  // Calculate display percentage (use API value or calculate from correct answers)
  const displayPercentage = (() => {
    // If we have API percentage and it seems reasonable, use it
    if (resultData?.percentage !== undefined && !isNaN(resultData.percentage)) {
      return resultData.percentage;
    }
    
    // Otherwise calculate from correct answers
    if (totalQuestions > 0) {
      return parseFloat(((correctAnswers / totalQuestions) * 100).toFixed(1));
    }
    
    return 0;
  })();

  console.log('Display percentage:', displayPercentage, 'API percentage:', resultData?.percentage);

  // Get topic and sub-topic wise statistics
  const { topicStats, subTopicStats } = calculateTopicWiseStats();

  const getScoreTextColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackgroundColor = (percentage) => {
    if (percentage >= 80) return 'bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Test Results</h1>
          <p className="text-lg text-slate-600">Detailed analysis of your performance</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-2">
          <div className="flex flex-wrap justify-center space-x-2">
            {[
              { key: 'summary', label: 'Summary', icon: '📊' },
              { key: 'topics', label: 'Topic Analysis', icon: '📚' },
              { key: 'subtopics', label: 'Sub-topic Analysis', icon: '📖' },
              { key: 'questions', label: 'All Questions', icon: '❓' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  viewMode === tab.key
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary View */}
        {viewMode === 'summary' && (
          <div className="space-y-8">
            {/* Score Card */}
            <div className={`rounded-xl shadow-sm border p-8 text-center ${getScoreBackgroundColor(displayPercentage)}`}>
              <div className={`text-6xl font-bold mb-2 ${getScoreTextColor(displayPercentage)}`}>
                {displayPercentage}%
              </div>
              <p className="text-lg font-medium text-slate-700 mb-4">Overall Score</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{correctAnswers}</div>
                  <div className="text-sm text-slate-600">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{wrongAnswers}</div>
                  <div className="text-sm text-slate-600">Wrong</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{answeredQuestions}</div>
                  <div className="text-sm text-slate-600">Answered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{unansweredQuestions}</div>
                  <div className="text-sm text-slate-600">Unanswered</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Topic Analysis View */}
        {viewMode === 'topics' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Topic-wise Analysis (Areas 1-7)</h2>
            
            {topicStats.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Topic Analysis Not Available</h3>
                <p className="text-slate-600 mb-4">No questions found for topics 1-7 in this test.</p>
                <button
                  onClick={() => setViewMode('summary')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View Summary
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {topicStats.map((topic) => (
                  <div key={topic.area} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {topic.areaName}
                          </h3>
                          <p className="text-slate-600">{topic.total} questions in this topic</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreTextColor(parseFloat(topic.percentage))}`}>
                            {topic.percentage}%
                          </div>
                          <div className="text-sm font-medium text-slate-600">Score</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-slate-700">{topic.total}</div>
                          <div className="text-sm font-medium text-slate-600">Total</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-emerald-700">{topic.correct}</div>
                          <div className="text-sm font-medium text-emerald-600">Correct</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-700">{topic.wrong}</div>
                          <div className="text-sm font-medium text-red-600">Wrong</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-700">{topic.answered}</div>
                          <div className="text-sm font-medium text-blue-600">Answered</div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-700">{topic.accuracy}%</div>
                          <div className="text-sm font-medium text-yellow-600">Accuracy</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-topic Analysis View */}
        {viewMode === 'subtopics' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Sub-topic-wise Analysis</h2>
            
            {subTopicStats.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Sub-topic Analysis Not Available</h3>
                <p className="text-slate-600 mb-4">No sub-topics found in this test.</p>
                <button
                  onClick={() => setViewMode('summary')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View Summary
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {subTopicStats.map((subTopic, index) => (
                  <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {subTopic.subarea}
                          </h3>
                          <p className="text-slate-600">
                            {subTopic.areaName} • {subTopic.total} questions
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreTextColor(parseFloat(subTopic.percentage))}`}>
                            {subTopic.percentage}%
                          </div>
                          <div className="text-sm font-medium text-slate-600">Score</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-slate-700">{subTopic.total}</div>
                          <div className="text-sm font-medium text-slate-600">Total</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-emerald-700">{subTopic.correct}</div>
                          <div className="text-sm font-medium text-emerald-600">Correct</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-700">{subTopic.wrong}</div>
                          <div className="text-sm font-medium text-red-600">Wrong</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-700">{subTopic.answered}</div>
                          <div className="text-sm font-medium text-blue-600">Answered</div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-700">{subTopic.accuracy}%</div>
                          <div className="text-sm font-medium text-yellow-600">Accuracy</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Questions View */}
        {viewMode === 'questions' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">All Questions Review</h2>
            
            {testDetails.questions && (
              <div className="space-y-8">
                {testDetails.questions.map((question, index) => {
                  const userAnswer = getUserAnswer(index);
                  const correctOption = question.options?.find(opt => opt.correct);
                  const userOption = question.options?.find(opt => opt.key === userAnswer);
                  
                  // Determine question status
                  let status = { 
                    status: 'unanswered', 
                    icon: '⭕', 
                    color: 'bg-slate-100 text-slate-700' 
                  };
                  
                  if (userAnswer) {
                    if (userAnswer === correctOption?.key) {
                      status = { 
                        status: 'correct', 
                        icon: '✅', 
                        color: 'bg-emerald-100 text-emerald-700' 
                      };
                    } else {
                      status = { 
                        status: 'wrong', 
                        icon: '❌', 
                        color: 'bg-red-100 text-red-700' 
                      };
                    }
                  }

                  return (
                    <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <h3 className="text-lg font-bold text-slate-900">
                              Question {index + 1}
                            </h3>
                            {question.area && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                {getAreaName(question.area)}
                              </span>
                            )}
                            {question.subarea && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                {question.subarea}
                              </span>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded text-sm font-medium ${status.color}`}>
                            <span className="mr-1">{status.icon}</span>
                            {status.status === 'correct' ? 'Correct' : status.status === 'wrong' ? 'Wrong' : 'Not Attempted'}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-6">
                          <div className="text-slate-900 leading-relaxed text-lg whitespace-pre-line">
                            {formatTextWithLineBreaks(question.question)}
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          {question.options?.map((option, optionIndex) => {
                            const isUserAnswer = option.key === userAnswer;
                            const isCorrectAnswer = option.correct;
                            
                            let optionStyle = 'border-slate-200 bg-slate-50';
                            if (isCorrectAnswer && isUserAnswer) {
                              optionStyle = 'border-emerald-300 bg-emerald-50';
                            } else if (isCorrectAnswer) {
                              optionStyle = 'border-emerald-300 bg-emerald-100';
                            } else if (isUserAnswer) {
                              optionStyle = 'border-red-300 bg-red-50';
                            }

                            return (
                              <div key={optionIndex} className={`p-4 rounded-lg border ${optionStyle}`}>
                                <div className="flex items-center space-x-4">
                                  <span className="font-medium">{option.key}</span>
                                  <div className="whitespace-pre-line flex-1">
                                    {formatTextWithLineBreaks(option.text)}
                                  </div>
                                  {isUserAnswer && <span className="text-blue-600 font-medium">Your Choice</span>}
                                  {isCorrectAnswer && <span className="text-green-600 font-medium">✓ Correct</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-slate-700">Your Answer: </span>
                              <span className={userAnswer ? 'text-slate-900' : 'text-slate-500'}>
                                {userAnswer ? `${userAnswer} - ${userOption?.text}` : 'Not Attempted'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Correct Answer: </span>
                              <span className="text-emerald-700">
                                {correctOption?.key} - {correctOption?.text}
                              </span>
                            </div>
                          </div>
                        </div>

                        {question.explanation && (
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
                            <div className="text-blue-800 leading-relaxed whitespace-pre-line">
                              {formatTextWithLineBreaks(question.explanation)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isHistoricalData ? (
              // Buttons for historical data view
              <>
                <button
                  onClick={() => navigate('/performance')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold"
                >
                  ← Back to Performance
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Take Another Test
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-8 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Print Report
                </button>
              </>
            ) : (
              // Buttons for live test results
              <>
                <button
                  onClick={() => navigate('/performance')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold"
                >
                  View All Performance
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Take Another Test
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-8 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Print Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResult;