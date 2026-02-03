import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackQuizEvent, trackConversion, trackEngagement } from '../utils/analytics';

// Current Affairs Questions - January 2026
const questionsData = [
  {
    id: 1,
    question: "With reference to the new CPI series (Base Year 2024), consider the following statements:\n1. The weightage of the food and beverages group has been increased.\n2. It aligns India's inflation data with international classification standards.\nWhich of the statements given above is/are correct?",
    options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
    correct: 2,
    explanation: "The new CPI series (2024 base) has actually reduced the weightage of 'Food and Beverages' from ~45.8% to ~36.7% to reflect changing consumption patterns (Engel's Law). Statement 2 is correct as it aligns with international standards.",
    subject: "Economy",
    topic: "Consumer Price Index"
  },
  {
    id: 2,
    question: "The 'Engel's Law,' often cited during the revision of the CPI basket, refers to:",
    options: [
      "The relationship between tax rates and tax revenue",
      "The proportion of income spent on food as income rises",
      "The impact of money supply on inflation",
      "The distribution of wealth in a society"
    ],
    correct: 2,
    explanation: "Engel's Law states that as income rises, the proportion of income spent on food falls, even if absolute spending on food rises. This is why the weightage of food in CPI decreases as economies develop.",
    subject: "Economy",
    topic: "Economic Laws"
  },
  {
    id: 3,
    question: "Which of the following states in India holds the largest resources of Coking Coal?",
    options: ["Odisha", "Chhattisgarh", "Jharkhand", "Madhya Pradesh"],
    correct: 3,
    explanation: "Jharkhand holds the largest resources of Coking Coal in India. The government has notified Coking Coal as a 'Critical and Strategic Mineral' under the MMDR Act.",
    subject: "Geography",
    topic: "Mineral Resources"
  },
  {
    id: 4,
    question: "When a mineral is notified as 'Critical and Strategic' under the MMDR Act, which of the following is true?",
    options: [
      "Only the State Government can conduct its auction",
      "The Central Government has the power to prioritize its auction for national security",
      "Private sector participation is completely banned",
      "All royalties accrue to the Union Government"
    ],
    correct: 2,
    explanation: "When a mineral is notified as 'Critical and Strategic', the Central Government gains the power to prioritize its auction for national security purposes, though royalties still accrue to State governments.",
    subject: "Geography",
    topic: "Mining Laws"
  },
  {
    id: 5,
    question: "Under the Solid Waste Management Rules 2026, the concept of 'Circular Economy' primarily emphasizes:",
    options: [
      "Shifting all waste to landfills in a circular geographic pattern",
      "Prioritizing waste reduction, reuse, and recycling over disposal",
      "Mandatory incineration of all plastic waste",
      "Universal government-only waste collection"
    ],
    correct: 2,
    explanation: "The Circular Economy concept emphasizes the 3 R's - Reduce, Reuse, and Recycle - prioritizing these over disposal methods like landfilling or incineration.",
    subject: "Environment",
    topic: "Waste Management"
  },
  {
    id: 6,
    question: "Which of the following is responsible for providing the 'Authorisation' to waste processing facilities under SWM Rules?",
    options: [
      "Central Pollution Control Board (CPCB)",
      "State Pollution Control Board (SPCB)",
      "Ministry of Housing and Urban Affairs",
      "District Magistrate"
    ],
    correct: 2,
    explanation: "State Pollution Control Boards (SPCBs) are responsible for providing authorisation to waste processing facilities under the Solid Waste Management Rules.",
    subject: "Environment",
    topic: "Pollution Control"
  },
  {
    id: 7,
    question: "The 'Diamond Triangle' of Buddhist sites is located in which state of India?",
    options: ["Andhra Pradesh", "Odisha", "Bihar", "Maharashtra"],
    correct: 2,
    explanation: "The 'Diamond Triangle' consisting of Ratnagiri, Udayagiri, and Lalitgiri Buddhist heritage sites is located in Odisha and has been included in India's UNESCO tentative list.",
    subject: "Art & Culture",
    topic: "Buddhist Heritage"
  },
  {
    id: 8,
    question: "Ratnagiri and Lalitgiri are primarily associated with which school of Buddhism?",
    options: ["Theravada", "Zen", "Vajrayana", "Shinto"],
    correct: 3,
    explanation: "Ratnagiri and Lalitgiri, along with Udayagiri, are crucial sites for understanding the evolution of Vajrayana Buddhism in ancient India.",
    subject: "Art & Culture",
    topic: "Buddhist Schools"
  },
  {
    id: 9,
    question: "Which of the following was the last country to join the Eurozone before Bulgaria?",
    options: ["Croatia", "Lithuania", "Latvia", "Estonia"],
    correct: 1,
    explanation: "Croatia joined the Eurozone in 2023, making it the 20th member before Bulgaria became the 21st member in January 2026.",
    subject: "International Relations",
    topic: "European Union"
  },
  {
    id: 10,
    question: "Membership of the Eurozone is governed by the 'Convergence Criteria' established by which treaty?",
    options: ["Treaty of Versailles", "Maastricht Treaty", "Treaty of Rome", "Lisbon Treaty"],
    correct: 2,
    explanation: "The Maastricht Treaty established the convergence criteria (also known as Maastricht criteria) that countries must meet to join the Eurozone, including fiscal, monetary, and exchange rate stability requirements.",
    subject: "International Relations",
    topic: "International Treaties"
  }
];

const CurrentAffairsQuiz = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const questionRefs = useRef([]);
  const quizSectionRef = useRef(null);
  const [startTime] = useState(Date.now());
  const [quizStarted, setQuizStarted] = useState(false);

  // Track page engagement
  useEffect(() => {
    trackEngagement('ca_quiz_page_loaded', { 
      label: 'january-2026-current-affairs',
      value: questionsData.length 
    });

    // Track session time
    const sessionStartTime = Date.now();
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
      trackEngagement('page_time_spent', {
        label: 'ca-quiz',
        value: timeSpent
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      if (scrollPercent === 25) {
        trackEngagement('page_scroll_25', { label: 'ca-quiz' });
      } else if (scrollPercent === 50) {
        trackEngagement('page_scroll_50', { label: 'ca-quiz' });
      } else if (scrollPercent === 75) {
        trackEngagement('page_scroll_75', { label: 'ca-quiz' });
      } else if (scrollPercent === 100) {
        trackEngagement('page_scroll_100', { label: 'ca-quiz' });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const question = questionsData[questionIndex];
    const isCorrect = answerIndex === question.correct - 1;
    
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
    
    setShowExplanations(prev => ({
      ...prev,
      [questionIndex]: true
    }));

    // Track quiz start
    if (!quizStarted && questionIndex === 0) {
      setQuizStarted(true);
      trackQuizEvent('ca_quiz_started', { 
        label: 'january-2026',
        value: Date.now() - startTime
      });
    }

    // Track answer selection
    trackQuizEvent('ca_question_answered', {
      label: `q${questionIndex + 1}_${question.subject}_${isCorrect ? 'correct' : 'incorrect'}`,
      value: isCorrect ? 1 : 0
    });

    // Track progress milestones
    const answeredCount = Object.keys(answers).length + 1;
    if (answeredCount === 5) {
      trackEngagement('ca_quiz_50_percent', { 
        label: 'january-2026',
        value: calculateScore() + (isCorrect ? 1 : 0)
      });
    } else if (answeredCount === questionsData.length) {
      const finalScore = calculateScore() + (isCorrect ? 1 : 0);
      trackEngagement('ca_quiz_completed', { 
        label: 'january-2026',
        value: finalScore
      });
      
      // Show signup popup after a delay if all questions are answered
      setTimeout(() => {
        setShowSignupPopup(true);
        trackConversion('ca_quiz_completion_popup_shown', {
          label: 'signup_prompt',
          value: finalScore
        });
      }, 2000);
    }
  };

  const calculateScore = () => {
    return Object.entries(answers).reduce((score, [questionIndex, answerIndex]) => {
      const question = questionsData[parseInt(questionIndex)];
      return score + (answerIndex === question.correct - 1 ? 1 : 0);
    }, 0);
  };

  const scrollToNextQuestion = (currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questionsData.length && questionRefs.current[nextIndex]) {
      questionRefs.current[nextIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleSubmit = () => {
    const finalScore = calculateScore();
    const totalQuestions = questionsData.length;
    
    trackConversion('ca_quiz_submit_clicked', {
      label: `score_${finalScore}_of_${totalQuestions}`,
      value: finalScore
    });
    
    setShowSignupPopup(true);
  };

  const handleSignupClick = () => {
    trackConversion('ca_quiz_signup_clicked', {
      label: 'from_popup',
      value: calculateScore()
    });
    
    navigate('/signup', { 
      state: { 
        source: 'ca-quiz',
        score: calculateScore(),
        totalQuestions: questionsData.length
      }
    });
  };

  const handlePopupDismiss = () => {
    trackEngagement('ca_quiz_popup_dismissed', {
      label: 'continue_quiz',
      value: calculateScore()
    });
    
    setShowSignupPopup(false);
  };

  const getSubjectIcon = (subject) => {
    const icons = {
      'Economy': '💰',
      'Geography': '🌍',
      'Environment': '🌱',
      'Art & Culture': '🎭',
      'International Relations': '🌐'
    };
    return icons[subject] || '📚';
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Economy': 'from-green-500 to-emerald-600',
      'Geography': 'from-blue-500 to-cyan-600',
      'Environment': 'from-emerald-500 to-green-600',
      'Art & Culture': 'from-purple-500 to-pink-600',
      'International Relations': 'from-indigo-500 to-blue-600'
    };
    return colors[subject] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="relative z-20 text-center py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-2 sm:mb-3">
              🎯 Current Affairs Quiz
            </h1>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg px-4 sm:px-6 py-2 sm:py-3 inline-block mb-4 sm:mb-6">
              <div className="text-lg sm:text-xl text-yellow-300 font-bold">
                UPSC Aspirants
              </div>
              <div className="text-lg sm:text-xl text-purple-200 font-semibold">
                from Civils Coach
              </div>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-200 mb-4">
              January 2026 - Important Topics
            </p>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Test your knowledge of recent current affairs with these carefully curated questions covering Economy, Environment, Geography, Culture & International Relations
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Section */}
      <div className="relative z-20 pb-12 sm:pb-16 lg:pb-20">
        <div ref={quizSectionRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 sm:space-y-12">
            {questionsData.map((question, questionIndex) => (
              <div
                key={question.id}
                ref={el => questionRefs.current[questionIndex] = el}
                className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/20 shadow-2xl scroll-mt-24 animate-fade-in"
                style={{ animationDelay: `${questionIndex * 0.1}s` }}
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <div className="bg-white/20 rounded-full px-4 py-2">
                      <span className="text-white font-bold text-lg">
                        Q{questionIndex + 1}
                      </span>
                    </div>
                    <div className={`bg-gradient-to-r ${getSubjectColor(question.subject)} rounded-full px-4 py-2`}>
                      <span className="text-white font-semibold text-sm flex items-center gap-2">
                        {getSubjectIcon(question.subject)}
                        {question.subject}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 bg-white/10 rounded-full px-3 py-1">
                    {question.topic}
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed whitespace-pre-line">
                    {question.question}
                  </h2>
                </div>

                {/* Answer Options */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[questionIndex] === optionIndex;
                    const isCorrect = optionIndex === question.correct - 1;
                    const showResult = showExplanations[questionIndex];
                    
                    let bgClass = 'bg-white/5 hover:bg-white/10 border-white/20';
                    let textClass = 'text-white';
                    
                    if (showResult) {
                      if (isCorrect) {
                        bgClass = 'bg-green-500/20 border-green-400';
                        textClass = 'text-green-100';
                      } else if (isSelected && !isCorrect) {
                        bgClass = 'bg-red-500/20 border-red-400';
                        textClass = 'text-red-100';
                      } else {
                        bgClass = 'bg-white/5 border-gray-500';
                        textClass = 'text-gray-300';
                      }
                    }

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => !showExplanations[questionIndex] && handleAnswerSelect(questionIndex, optionIndex)}
                        disabled={showExplanations[questionIndex]}
                        className={`w-full p-4 sm:p-5 text-left rounded-xl sm:rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${bgClass} ${textClass} ${!showExplanations[questionIndex] ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0 ${
                            showResult && isCorrect ? 'bg-green-500 border-green-500 text-white' :
                            showResult && isSelected && !isCorrect ? 'bg-red-500 border-red-500 text-white' :
                            'border-current'
                          }`}>
                            {showResult && isCorrect ? '✓' : 
                             showResult && isSelected && !isCorrect ? '✗' :
                             String.fromCharCode(65 + optionIndex)}
                          </div>
                          <span className="font-medium leading-relaxed text-base sm:text-lg">
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showExplanations[questionIndex] && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl border border-blue-500/20 p-5 sm:p-6 mb-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="text-2xl sm:text-3xl">💡</div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-3">
                          Explanation
                        </h3>
                        <p className="text-gray-200 leading-relaxed text-base sm:text-lg">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Button */}
                {showExplanations[questionIndex] && questionIndex < questionsData.length - 1 && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => scrollToNextQuestion(questionIndex)}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 text-base sm:text-lg"
                    >
                      Next Question 
                      <span className="text-xl">↓</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div className="text-center pt-8 sm:pt-12">
              <div className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 font-medium">
                📚 Want More Current Affairs Questions & Detailed Analysis?
              </div>
              <button
                onClick={handleSubmit}
                className="px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg sm:text-xl"
              >
                Join CivilsCoach Platform
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 rounded-2xl lg:rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/20 shadow-2xl relative animate-fade-in">
            {/* Close Button */}
            <button
              onClick={handlePopupDismiss}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold transition-colors duration-300"
            >
              ×
            </button>

            {/* Popup Content */}
            <div className="text-center">
              <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">🎯</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
                Great Job! 🌟
              </h3>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <div className="text-3xl font-bold text-blue-300">
                  {calculateScore()}/{questionsData.length}
                </div>
                <div className="text-sm text-gray-300">Questions Correct</div>
              </div>
              
              <p className="text-gray-200 mb-6 sm:mb-8 leading-relaxed">
                Join <span className="text-blue-300 font-bold">CivilsCoach</span> for:
              </p>
              
              <div className="space-y-3 mb-6 sm:mb-8 text-left">
                {[
                  "📈 Monthly Current Affairs with 100+ Questions",
                  "🎯 Subject-wise Practice Tests & Mock Tests",
                  "📊 Detailed Performance Analytics",
                  "🧠 AI-powered Weak Area Analysis",
                  "👨‍🏫 Expert Guidance & Doubt Resolution"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-2"></div>
                    <span className="text-gray-200 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSignupClick}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg"
                >
                  Start Free Trial Now! 🚀
                </button>
                <button
                  onClick={handlePopupDismiss}
                  className="w-full px-6 py-3 bg-transparent border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 text-sm sm:text-base"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .scroll-mt-24 {
          scroll-margin-top: 6rem;
        }
      `}</style>
    </div>
  );
};

export default CurrentAffairsQuiz;