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

  // Function to fetch test questions from API
  const fetchTestQuestions = async (testId, testResult) => {
    try {
      let actualTestId = testId;
      if (typeof testId === 'string' && testId.startsWith('test_')) {
        const parts = testId.split('_');
        if (parts.length >= 2) {
          actualTestId = parts[1];
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_APP_URI}/api/tests/${actualTestId}`);
      const data = await response.json();
      
      if (data.success && data.test) {
        setTestDetails({
          name: testResult.testName || data.test.name,
          testType: testResult.testType || data.test.testType,
          questions: data.test.questions || [],
          duration: testResult.duration || data.test.duration || 0
        });
        setLoading(false);
      } else {
        throw new Error('Failed to fetch test questions');
      }
    } catch (error) {
      console.error('Error fetching test questions:', error);
      setTestDetails({
        name: testResult.testName || 'Test',
        testType: testResult.testType || 'Practice',
        questions: [],
        duration: testResult.duration || 0
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.resultData && location.state?.testDetails) {
      setResultData(location.state.resultData);
      setTestDetails(location.state.testDetails);
      setLoading(false);
    } else if (location.state?.testResult) {
      const testResult = location.state.testResult;
      console.log('Enhanced backend test result:', testResult);
      
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
      
      fetchTestQuestions(testResult.testId || testResult.sessionId, testResult);
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
    
    testDetails.questions.forEach((question, index) => {
      const areaNumber = question.area || 1;
      const areaName = getAreaName(areaNumber);
      const subarea = question.subarea || '';
      const areaKey = subarea ? `${areaName} - ${subarea}` : areaName;
      
      const userAnswer = resultData.userAnswers[index];
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
        attempted: userAnswer !== undefined,
        options: question.options,
        difficulty: question.difficulty,
        area: areaNumber,
        subarea: subarea
      });
      
      if (!userAnswer || userAnswer === undefined) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Your Performance</h3>
          <p className="text-slate-600">Processing your test results...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData || !testDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Results</h2>
            <p className="text-slate-600 mb-6">{error || 'Result data is not available.'}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Return to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const areaWiseStats = calculateAreaWisePerformance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Performance Analysis</h1>
              <h2 className="text-xl text-slate-700 font-medium mb-2">{testDetails.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span>{testDetails.testType}</span>
                <span>{testDetails.questions.length} Questions</span>
                <span>{testDetails.duration} Minutes</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <span>← Back to Tests</span>
            </button>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className={`text-3xl font-bold mb-1 ${getScoreTextColor(parseFloat(resultData.percentage))}`}>
                {resultData.percentage}%
              </div>
              <div className="text-sm font-medium text-slate-600">Overall Score</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-emerald-700 mb-1">{resultData.breakdown.correct}</div>
              <div className="text-sm font-medium text-slate-600">Correct Answers</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-red-700 mb-1">{resultData.breakdown.wrong}</div>
              <div className="text-sm font-medium text-slate-600">Wrong Answers</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-slate-700 mb-1">{resultData.breakdown.unanswered}</div>
              <div className="text-sm font-medium text-slate-600">Unanswered</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-2 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode('summary')}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                viewMode === 'summary' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('questions')}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                viewMode === 'questions' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Questions ({testDetails.questions.length})
            </button>
            <button
              onClick={() => setViewMode('areas')}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                viewMode === 'areas' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Areas ({areaWiseStats.length})
            </button>
          </div>
        </div>

        {/* Content Sections */}
        {viewMode === 'summary' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Subject Performance</h2>
            {areaWiseStats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {areaWiseStats.map((area) => (
                  <div key={area.area} className="border border-slate-200 rounded-xl p-6">
                    <h3 className="font-bold text-slate-900 mb-4">
                      {area.areaName || area.area}
                      {area.subarea && (
                        <div className="text-sm font-normal text-slate-600 mt-1">
                          {area.subarea}
                        </div>
                      )}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-slate-600">Score</span>
                        <span className={`text-2xl font-bold ${getScoreTextColor(parseFloat(area.percentage))}`}>
                          {area.percentage}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                          <div className="text-lg font-bold text-emerald-700">{area.correct}</div>
                          <div className="text-xs font-medium text-emerald-600">Correct</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-lg font-bold text-red-700">{area.wrong}</div>
                          <div className="text-xs font-medium text-red-600">Wrong</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-700">{area.unanswered}</div>
                          <div className="text-xs font-medium text-slate-600">Skipped</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Subject Performance Not Available</h3>
                <p className="text-slate-600">Unable to load subject-wise breakdown.</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'questions' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Question Analysis</h2>
            
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
                                  {isUserAnswer && <span className="text-blue-600">Your Choice</span>}
                                  {isCorrectAnswer && <span className="text-green-600">✓ Correct</span>}
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