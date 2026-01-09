import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authService';

const TestResult = () => {
  const [resultData, setResultData] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [viewMode, setViewMode] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  // Calculate correct answers with better debugging
  const calculateCorrectAnswers = () => {
    if (!resultData?.userAnswers || !testDetails?.questions) return 0;
    
    let correctCount = 0;
    
    // Debug the structure
    console.log('=== DEBUGGING USER ANSWERS ===');
    console.log('User Answers Object:', resultData.userAnswers);
    console.log('User Answers Type:', typeof resultData.userAnswers);
    console.log('User Answers Keys:', Object.keys(resultData.userAnswers));
    console.log('User Answers Values:', Object.values(resultData.userAnswers));
    
    // Try different ways to access the data
    const userAnswersObj = resultData.userAnswers;
    
    for (let i = 0; i < testDetails.questions.length; i++) {
      const question = testDetails.questions[i];
      const correctOption = question?.options?.find(opt => opt.correct);
      
      // Try multiple ways to get user answer
      let userAnswer = null;
      
      // Method 1: Direct index access
      if (userAnswersObj[i] !== undefined) {
        userAnswer = userAnswersObj[i];
      }
      // Method 2: String index access
      else if (userAnswersObj[i.toString()] !== undefined) {
        userAnswer = userAnswersObj[i.toString()];
      }
      // Method 3: Check if it's an array instead of object
      else if (Array.isArray(userAnswersObj) && userAnswersObj[i] !== undefined) {
        userAnswer = userAnswersObj[i];
      }
      
      if (i < 5) { // Only log first 5 for debugging
        console.log(`Q${i}: User Answer: "${userAnswer}", Correct: "${correctOption?.key}", Match: ${userAnswer === correctOption?.key}`);
      }
      
      if (userAnswer && userAnswer === correctOption?.key) {
        correctCount++;
      }
    }
    
    console.log('=== FINAL COUNT ===');
    console.log('Total Correct:', correctCount);
    return correctCount;
  };

  // Calculate wrong answers
  const calculateWrongAnswers = () => {
    if (!resultData?.userAnswers || !testDetails?.questions) return 0;
    
    let wrongCount = 0;
    const userAnswersObj = resultData.userAnswers;
    
    for (let i = 0; i < testDetails.questions.length; i++) {
      const question = testDetails.questions[i];
      const correctOption = question?.options?.find(opt => opt.correct);
      
      // Try multiple ways to get user answer
      let userAnswer = null;
      if (userAnswersObj[i] !== undefined) {
        userAnswer = userAnswersObj[i];
      } else if (userAnswersObj[i.toString()] !== undefined) {
        userAnswer = userAnswersObj[i.toString()];
      } else if (Array.isArray(userAnswersObj) && userAnswersObj[i] !== undefined) {
        userAnswer = userAnswersObj[i];
      }
      
      if (userAnswer && userAnswer !== correctOption?.key) {
        wrongCount++;
      }
    }
    
    console.log('Total Wrong:', wrongCount);
    return wrongCount;
  };

  // Calculate unanswered questions
  const calculateUnansweredQuestions = () => {
    if (!resultData?.userAnswers || !testDetails?.questions) return testDetails?.questions?.length || 0;
    
    let unansweredCount = 0;
    const userAnswersObj = resultData.userAnswers;
    
    for (let i = 0; i < testDetails.questions.length; i++) {
      // Try multiple ways to get user answer
      let userAnswer = null;
      if (userAnswersObj[i] !== undefined) {
        userAnswer = userAnswersObj[i];
      } else if (userAnswersObj[i.toString()] !== undefined) {
        userAnswer = userAnswersObj[i.toString()];
      } else if (Array.isArray(userAnswersObj) && userAnswersObj[i] !== undefined) {
        userAnswer = userAnswersObj[i];
      }
      
      if (!userAnswer || userAnswer === undefined || userAnswer === null) {
        unansweredCount++;
      }
    }
    
    console.log('Total Unanswered:', unansweredCount);
    return unansweredCount;
  };

  useEffect(() => {
    // Use passed data directly instead of fetching from API
    if (location.state?.resultData && location.state?.testDetails) {
      setResultData(location.state.resultData);
      setTestDetails(location.state.testDetails);
      setLoading(false);
    } else if (location.state?.testResult && location.state?.testDetails) {
      // Data passed from TestView - use directly
      const testResult = location.state.testResult;
      const testDetails = location.state.testDetails;
      
      console.log('Test result with questions:', { testResult, testDetails });
      
      const userAnswers = {};
      if (testResult.answers && Array.isArray(testResult.answers)) {
        testResult.answers.forEach(answer => {
          if (answer.questionIndex !== undefined && answer.selectedOption) {
            userAnswers[answer.questionIndex] = answer.selectedOption;
          }
        });
      }
      
      setResultData({
        percentage: testResult.percentage,
        breakdown: testResult.breakdown,
        totalScore: testResult.totalScore || testResult.score,
        timeTaken: testResult.timeTaken,
        userAnswers: userAnswers
      });
      
      setTestDetails(testDetails);
      setLoading(false);
    } else {
      setError('No result data found');
      setLoading(false);
      setTimeout(() => navigate('/', { replace: true }), 3000);
    }
  }, [location.state, navigate]);

  const getScoreTextColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-700';
    if (percentage >= 60) return 'text-blue-700';
    if (percentage >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getAnswerStatus = (questionIndex) => {
    if (!resultData?.userAnswers || !testDetails?.questions) {
      return { status: 'unanswered', color: 'bg-slate-100 text-slate-600', icon: '○' };
    }

    const userAnswer = resultData.userAnswers[questionIndex];
    const question = testDetails.questions[questionIndex];
    
    if (!question || !question.options) {
      return { status: 'unanswered', color: 'bg-slate-100 text-slate-600', icon: '○' };
    }

    const correctOption = question.options.find(opt => opt.correct);
    const correctAnswerKey = correctOption?.key;
    
    if (!userAnswer || userAnswer === undefined) {
      return { status: 'unanswered', color: 'bg-slate-100 text-slate-600', icon: '○' };
    } else if (userAnswer === correctAnswerKey) {
      return { status: 'correct', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✓' };
    } else {
      return { status: 'wrong', color: 'bg-red-100 text-red-700 border-red-200', icon: '✕' };
    }
  };

  const calculateAreaWisePerformance = () => {
    if (!testDetails?.questions || !resultData?.userAnswers) return [];
    
    const areaStats = {};
    const userAnswersObj = resultData.userAnswers;
    
    testDetails.questions.forEach((question, index) => {
      const areaNumber = question.area || 1;
      const areaName = getAreaName(areaNumber);
      const subarea = question.subarea || '';
      const areaKey = subarea ? `${areaName} - ${subarea}` : areaName;
      
      // Try multiple ways to get user answer - same as above
      let userAnswer = null;
      if (userAnswersObj[index] !== undefined) {
        userAnswer = userAnswersObj[index];
      } else if (userAnswersObj[index.toString()] !== undefined) {
        userAnswer = userAnswersObj[index.toString()];
      } else if (Array.isArray(userAnswersObj) && userAnswersObj[index] !== undefined) {
        userAnswer = userAnswersObj[index];
      }
      
      const correctOption = question.options?.find(opt => opt.correct);
      const correctAnswerKey = correctOption?.key;
      
      if (!areaStats[areaKey]) {
        areaStats[areaKey] = { 
          correct: 0, 
          wrong: 0, 
          unanswered: 0, 
          total: 0,
          questions: [],
          areaName: areaName,
          subarea: subarea
        };
      }
      
      areaStats[areaKey].total++;
      areaStats[areaKey].questions.push({
        index,
        question: question.question,
        explanation: question.explanation,
        userAnswer,
        correctAnswer: correctAnswerKey,
        isCorrect: userAnswer === correctAnswerKey,
        attempted: userAnswer !== undefined && userAnswer !== null,
        options: question.options,
        difficulty: question.difficulty,
        area: areaNumber,
        subarea: subarea
      });
      
      // Fix counting logic with same approach
      if (!userAnswer || userAnswer === undefined || userAnswer === null) {
        areaStats[areaKey].unanswered++;
      } else if (userAnswer === correctAnswerKey) {
        areaStats[areaKey].correct++;
      } else {
        areaStats[areaKey].wrong++;
      }
    });
    
    return Object.entries(areaStats).map(([area, stats]) => ({
      area,
      ...stats,
      percentage: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0.0',
      accuracy: stats.correct + stats.wrong > 0 ? ((stats.correct / (stats.correct + stats.wrong)) * 100).toFixed(1) : '0.0'
    }));
  };

  const areaWiseStats = calculateAreaWisePerformance();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData || !testDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error || 'No test result data found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Test Results</h1>
            <h2 className="text-xl text-slate-700 mb-4">{testDetails.name}</h2>
            <div className="flex justify-center items-center space-x-8 mb-6">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-1 ${getScoreTextColor(resultData.percentage || 0)}`}>
                  {resultData.percentage || 0}%
                </div>
                <div className="text-sm text-slate-600">Overall Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-slate-900 mb-1">
                  {resultData.totalScore || 0}
                </div>
                <div className="text-sm text-slate-600">Total Marks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-slate-900 mb-1">
                  {resultData.timeTaken ? `${Math.floor(resultData.timeTaken / 60)}m ${resultData.timeTaken % 60}s` : 'N/A'}
                </div>
                <div className="text-sm text-slate-600">Time Taken</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'summary' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode('questions')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'questions' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Questions
              </button>
              <button
                onClick={() => setViewMode('areas')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'areas' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Subject Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Debug Section - REMOVE AFTER FIXING */}
        {viewMode === 'summary' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info (Remove after fixing)</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div><strong>User Answers Keys:</strong> {Object.keys(resultData.userAnswers || {}).join(', ')}</div>
              <div><strong>User Answers Values:</strong> {Object.values(resultData.userAnswers || {}).join(', ')}</div>
              <div><strong>Total Questions:</strong> {testDetails.questions.length}</div>
              <div><strong>Calculated Correct:</strong> {calculateCorrectAnswers()}</div>
              <div><strong>Calculated Wrong:</strong> {calculateWrongAnswers()}</div>
              <div><strong>Calculated Unanswered:</strong> {calculateUnansweredQuestions()}</div>
              <div><strong>Backend Breakdown:</strong> {resultData.breakdown ? `C:${resultData.breakdown.correct} W:${resultData.breakdown.wrong} U:${resultData.breakdown.unanswered}` : 'Not available'}</div>
            </div>
          </div>
        )}

        {/* Summary View */}
        {viewMode === 'summary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Performance Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {calculateCorrectAnswers()}
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">Correct</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {calculateWrongAnswers()}
                  </div>
                  <div className="text-sm text-red-600 font-medium">Wrong</div>
                </div>
                
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-600">
                    {calculateUnansweredQuestions()}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Unanswered</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{testDetails.questions.length}</div>
                  <div className="text-sm text-blue-600 font-medium">Total Questions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions View */}
        {viewMode === 'questions' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">All Questions with Answers</h2>
            
            {testDetails.questions.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Questions Not Available</h3>
                <p className="text-slate-600 mb-4">Question details are not available for this test result.</p>
                <button
                  onClick={() => setViewMode('summary')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Summary
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {testDetails.questions.map((question, index) => {
                  const status = getAnswerStatus(index);
                  const userAnswer = resultData.userAnswers?.[index];
                  const correctOption = question.options?.find(opt => opt.correct);
                  const userOption = userAnswer ? question.options?.find(opt => opt.key === userAnswer) : null;
                  
                  return (
                    <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-bold text-slate-900">Q{index + 1}</span>
                            {question.difficulty && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                question.difficulty === 'Easy' ? 'bg-green-100 text-green-600' :
                                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {question.difficulty}
                              </span>
                            )}
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

        {viewMode === 'areas' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Subject-wise Analysis</h2>
            
            {areaWiseStats.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Area Analysis Not Available</h3>
                <p className="text-slate-600 mb-4">Subject-wise breakdown is not available for this test result.</p>
                <button
                  onClick={() => setViewMode('summary')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View Summary
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {areaWiseStats.map((area) => (
                  <div key={area.area} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            {area.areaName || area.area}
                          </h3>
                          {area.subarea && (
                            <p className="text-slate-600 text-lg mb-1">{area.subarea}</p>
                          )}
                          <p className="text-slate-600">{area.total} questions in this subject</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl font-bold ${getScoreTextColor(parseFloat(area.percentage))}`}>
                            {area.percentage}%
                          </div>
                          <div className="text-sm font-medium text-slate-600">Overall Score</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center">
                          <div className="text-3xl font-bold text-emerald-700 mb-1">{area.correct}</div>
                          <div className="text-sm font-medium text-emerald-600">Correct</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
                          <div className="text-3xl font-bold text-red-700 mb-1">{area.wrong}</div>
                          <div className="text-sm font-medium text-red-600">Wrong</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-center">
                          <div className="text-3xl font-bold text-slate-700 mb-1">{area.unanswered}</div>
                          <div className="text-sm font-medium text-slate-600">Unanswered</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center">
                          <div className="text-3xl font-bold text-blue-700 mb-1">{area.accuracy}%</div>
                          <div className="text-sm font-medium text-blue-600">Accuracy</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResult;