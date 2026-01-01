import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackQuizEvent, trackConversion, trackEngagement } from '../utils/analytics';
import adjsonData from '../utils/adjson.json';
import questionsData from '../utils/questions.json';

const Snapshot2025 = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({}); // Store answers for all questions
  const [showExplanations, setShowExplanations] = useState({}); // Store explanation visibility
  const [confetti, setConfetti] = useState([]);
  const [showSignupPopup, setShowSignupPopup] = useState(false); // Popup state
  const questionRefs = useRef([]); // Refs for auto-scrolling
  const eventRefs = useRef([]); // Refs for event auto-scrolling
  const quizSectionRef = useRef(null); // Ref for quiz section
  const [startTime] = useState(Date.now()); // Track session start time
  const [eventViewedCount, setEventViewedCount] = useState(new Set()); // Track unique events viewed
  const [quizStarted, setQuizStarted] = useState(false); // Track if quiz has started

  // Generate confetti particles for celebration effect + Page Load Tracking
  useEffect(() => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    }));
    setConfetti(particles);

    // Track page engagement - user visited 2025 snapshot
    trackEngagement('snapshot_page_loaded', { 
      label: '2025-year-review',
      value: adjsonData.items.length 
    });

    // Track session start time for time-on-page analytics
    const sessionStartTime = Date.now();
    
    // Track when user leaves the page
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
      trackEngagement('page_time_spent', {
        label: '2025-snapshot',
        value: timeSpent
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track scroll behavior and content engagement
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      // Track scroll milestones
      if (scrollPercent === 25) {
        trackEngagement('page_scroll_25', { label: '2025-snapshot' });
      } else if (scrollPercent === 50) {
        trackEngagement('page_scroll_50', { label: '2025-snapshot' });
      } else if (scrollPercent === 75) {
        trackEngagement('page_scroll_75', { label: '2025-snapshot' });
      } else if (scrollPercent === 100) {
        trackEngagement('page_scroll_100', { label: '2025-snapshot' });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track when user scrolls to quiz section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target === quizSectionRef.current && !quizStarted) {
            trackEngagement('quiz_section_viewed', { label: '2025-snapshot' });
          }
        });
      },
      { threshold: 0.3 }
    );

    if (quizSectionRef.current) {
      observer.observe(quizSectionRef.current);
    }

    return () => observer.disconnect();
  }, [quizStarted]);

  // Track event reading behavior
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const eventIndex = eventRefs.current.findIndex(ref => ref === entry.target);
            if (eventIndex !== -1 && !eventViewedCount.has(eventIndex)) {
              setEventViewedCount(prev => new Set([...prev, eventIndex]));
              trackEngagement('event_viewed', {
                label: `event_${eventIndex + 1}`,
                value: eventIndex + 1
              });

              // Track reading progress milestones
              const viewedCount = eventViewedCount.size + 1;
              if (viewedCount === 5) {
                trackEngagement('events_25_percent_read', { 
                  label: '2025-snapshot',
                  value: 5 
                });
              } else if (viewedCount === 10) {
                trackEngagement('events_50_percent_read', { 
                  label: '2025-snapshot',
                  value: 10 
                });
              } else if (viewedCount === 20) {
                trackEngagement('events_75_percent_read', { 
                  label: '2025-snapshot',
                  value: 20 
                });
              } else if (viewedCount === 25) {
                trackEngagement('events_100_percent_read', { 
                  label: '2025-snapshot',
                  value: 25 
                });
              }
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -100px 0px' }
    );

    eventRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [eventViewedCount]);

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

    // Track quiz start on first question
    if (!quizStarted && questionIndex === 0) {
      setQuizStarted(true);
      trackQuizEvent('quiz_started', { 
        label: '2025-snapshot',
        value: Date.now() - startTime // Time before starting quiz
      });
    }

    // Track each answer selection with detailed data
    trackQuizEvent('question_answered', {
      label: `q${questionIndex + 1}_${question.subject}_${isCorrect ? 'correct' : 'incorrect'}`,
      value: isCorrect ? 1 : 0
    });

    // Track subject-wise performance
    trackQuizEvent(`subject_${question.subject.toLowerCase().replace(/\s+/g, '_')}`, {
      label: isCorrect ? 'correct' : 'incorrect',
      value: questionIndex + 1
    });

    // Track quiz progress milestones
    const answeredCount = Object.keys(answers).length + 1;
    const currentScore = calculateScore() + (isCorrect ? 1 : 0);

    if (answeredCount === 5) {
      trackEngagement('quiz_25_percent', { 
        label: '2025-snapshot',
        value: Math.round((currentScore / answeredCount) * 100) // Accuracy percentage
      });
    } else if (answeredCount === 10) {
      trackEngagement('quiz_50_percent', { 
        label: '2025-snapshot',
        value: Math.round((currentScore / answeredCount) * 100)
      });
    } else if (answeredCount === 15) {
      trackEngagement('quiz_75_percent', { 
        label: '2025-snapshot',
        value: Math.round((currentScore / answeredCount) * 100)
      });
    } else if (answeredCount === 20) {
      trackEngagement('quiz_90_percent', { 
        label: '2025-snapshot',
        value: Math.round((currentScore / answeredCount) * 100)
      });
    }

    // Show signup popup after 3rd question (index 2)
    if (questionIndex === 2) {
      setTimeout(() => {
        setShowSignupPopup(true);
        trackConversion('signup_popup_shown', { 
          label: `after_q3_score_${currentScore}_of_3`,
          value: currentScore
        });
      }, 1000);
    }
  };

  const scrollToNextQuestion = (currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questionsData.length && questionRefs.current[nextIndex]) {
      questionRefs.current[nextIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Track navigation behavior
      trackEngagement('next_question_clicked', {
        label: `from_q${currentIndex + 1}_to_q${nextIndex + 1}`,
        value: nextIndex + 1
      });
    }
  };

  const scrollToNextEvent = (currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < adjsonData.items.length && eventRefs.current[nextIndex]) {
      eventRefs.current[nextIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });

      // Track event navigation
      trackEngagement('next_event_clicked', {
        label: `from_event_${currentIndex + 1}_to_event_${nextIndex + 1}`,
        value: nextIndex + 1
      });
    }
  };

  const scrollToQuiz = () => {
    if (quizSectionRef.current) {
      quizSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Track skip to quiz behavior
      trackEngagement('skip_to_quiz_clicked', {
        label: '2025-snapshot',
        value: eventViewedCount.size // How many events they viewed before skipping
      });
    }
  };

  const calculateScore = () => {
    let score = 0;
    Object.keys(answers).forEach(questionIndex => {
      if (answers[questionIndex] === questionsData[questionIndex].correct - 1) {
        score++;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    const finalScore = calculateScore();
    const totalAnswered = Object.keys(answers).length;
    const accuracy = totalAnswered > 0 ? Math.round((finalScore / totalAnswered) * 100) : 0;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Track quiz completion with comprehensive data
    trackQuizEvent('quiz_completed', {
      label: `score_${finalScore}_of_${totalAnswered}_accuracy_${accuracy}%`,
      value: finalScore
    });

    // Track completion time
    trackQuizEvent('quiz_completion_time', {
      label: '2025-snapshot',
      value: timeSpent
    });

    // Track conversion from quiz to signup
    trackConversion('quiz_to_signup_clicked', {
      label: `performance_${accuracy}%_time_${timeSpent}s`,
      value: finalScore
    });

    // Track performance categories
    if (accuracy >= 90) {
      trackQuizEvent('high_performer', { label: '2025-snapshot', value: finalScore });
    } else if (accuracy >= 70) {
      trackQuizEvent('good_performer', { label: '2025-snapshot', value: finalScore });
    } else if (accuracy >= 50) {
      trackQuizEvent('average_performer', { label: '2025-snapshot', value: finalScore });
    } else {
      trackQuizEvent('needs_improvement', { label: '2025-snapshot', value: finalScore });
    }

    navigate('/login');
  };

  // Handle signup popup interactions
  const handleSignupClick = () => {
    trackConversion('signup_popup_clicked', {
      label: 'premium_signup',
      value: calculateScore()
    });
    window.open('https://civilscoach.com/signup', '_blank');
  };

  const handlePopupDismiss = () => {
    trackConversion('signup_popup_dismissed', {
      label: 'continue_quiz',
      value: calculateScore()
    });
    setShowSignupPopup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10">
        {/* Happy New Year Banner - Full Width */}
        <div className="text-center py-8 md:py-12 lg:py-16 px-4 md:px-6 w-full">
          <div className="w-full mx-auto">
            {/* Main Title with Glowing Effect */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent animate-pulse mb-2 md:mb-4">
                Happy New Year 2026
              </h1>
              <p className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text text-transparent mb-1 md:mb-2">
                UPSC Aspirants
              </p>
              <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-4 md:mb-6">
                from Civils Coach
              </p>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-2 animate-fade-in">
                  🎊 2025 Top Current Affairs 🎊
                </h2>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-base md:text-xl lg:text-2xl text-gray-200 mb-6 md:mb-8 font-light leading-relaxed px-2">
              First read the Current Affairs of 2025, then test your knowledge! <br className="hidden sm:block" />
              <span className="text-yellow-300 font-semibold">Scroll down to explore • Can you score 100%? 🏆</span>
            </p>

            {/* Navigation Buttons */}
            <div className="flex flex-col gap-3 md:gap-4 justify-center items-center">
              <button
                onClick={scrollToQuiz}
                className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
              >
                Skip to Quiz 🎯
              </button>
              <p className="text-xs md:text-sm text-gray-400">
                Or scroll down to read the facts first
              </p>
            </div>
          </div>
        </div>

        {/* Facts Section - Same background as questions */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8 md:py-12 lg:py-16 w-full">
          <div className="px-4 md:px-6 w-full">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
                📚 25 Top Current Affairs of 2025
              </h2>
              <p className="text-sm md:text-lg lg:text-xl text-gray-300 mb-4 md:mb-6">
                Read through these key developments before taking the quiz
              </p>
            </div>

            {/* Vertical Scrolling Events */}
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 lg:space-y-12">
              {adjsonData.items.map((item, index) => (
                <div
                  key={index}
                  ref={el => eventRefs.current[index] = el}
                  className="scroll-mt-24"
                >
                  {/* Event Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-6 lg:p-8 shadow-2xl">
                    {/* Event Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-bold">
                        Event {index + 1} of {adjsonData.items.length}
                      </div>
                    </div>

                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-blue-300 mb-4 md:mb-6 leading-relaxed">
                      {item.Title}
                    </h3>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg md:rounded-xl border border-yellow-500/20 p-4 md:p-6 mb-4 md:mb-6">
                      <div className="flex items-start gap-3">
                        <div className="text-lg md:text-xl">📝</div>
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-yellow-300 mb-2">Summary</h4>
                          <p className="text-gray-200 leading-relaxed text-sm md:text-base">{item.Summary}</p>
                        </div>
                      </div>
                    </div>

                    {/* Full Text */}
                    <div className="text-xs md:text-sm lg:text-base text-gray-300 leading-relaxed space-y-3">
                      {item.Text.split('\\n').map((line, lineIndex) => (
                        <p key={lineIndex} className="leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Next Event Button */}
                    {index < adjsonData.items.length - 1 && (
                      <div className="flex justify-center mt-6 md:mt-8">
                        <button
                          onClick={() => scrollToNextEvent(index)}
                          className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm md:text-base"
                        >
                          Next Event
                          <span className="text-base md:text-lg">↓</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8 md:mt-16">
              <button
                onClick={scrollToQuiz}
                className="px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base lg:text-lg"
              >
                Now Take the Quiz! 🎯
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Section - Full Width */}
        <div ref={quizSectionRef} className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8 md:py-12 lg:py-16 w-full">
          <div className="px-4 md:px-6 w-full">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
                🎯 Knowledge Test
              </h2>
              <p className="text-sm md:text-lg lg:text-xl text-gray-300 mb-4 md:mb-6">
                Answer these questions based on what you just read
              </p>
              
              {/* Live Score Display */}
              <div className="inline-flex items-center gap-3 md:gap-6 bg-white/10 backdrop-blur-md rounded-full px-4 md:px-8 py-2 md:py-3 border border-white/20">
                <div className="text-xs md:text-sm text-gray-300">
                  Answered: <span className="text-green-400 font-bold">{Object.keys(answers).length}</span> / {questionsData.length}
                </div>
                <div className="text-xs md:text-sm text-gray-300">
                  Score: <span className="text-yellow-400 font-bold">{calculateScore()}</span> / {Object.keys(answers).length}
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 lg:space-y-12">
              {questionsData.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  ref={el => questionRefs.current[questionIndex] = el}
                  className="scroll-mt-24"
                >
                  {/* Question Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-6 lg:p-8 shadow-2xl">
                    {/* Question Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-bold">
                        Question {questionIndex + 1} • {question.subject}
                      </div>
                      {answers[questionIndex] !== undefined && (
                        <div className="flex items-center gap-2">
                          {answers[questionIndex] === question.correct - 1 ? (
                            <span className="bg-green-500 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="bg-red-500 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                              ✗ Incorrect
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6 leading-relaxed">
                      {question.question}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                      {[question.option1, question.option2, question.option3, question.option4].map((option, optionIndex) => {
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
                            className={`w-full p-3 md:p-4 text-left rounded-lg md:rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${bgClass} ${textClass} ${!showExplanations[questionIndex] ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0 ${
                                showResult && isCorrect ? 'bg-green-500 border-green-500 text-white' :
                                showResult && isSelected && !isCorrect ? 'bg-red-500 border-red-500 text-white' :
                                'border-current'
                              }`}>
                                {showResult && isCorrect ? '✓' : 
                                 showResult && isSelected && !isCorrect ? '✗' :
                                 String.fromCharCode(65 + optionIndex)}
                              </div>
                              <span className="font-medium leading-relaxed text-sm md:text-base">{option}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {showExplanations[questionIndex] && (
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg md:rounded-xl border border-blue-500/20 p-4 md:p-6 mb-4 md:mb-6">
                        <div className="flex items-start gap-3">
                          <div className="text-lg md:text-xl">💡</div>
                          <div>
                            <h3 className="text-base md:text-lg font-bold text-blue-300 mb-2">Explanation</h3>
                            <p className="text-gray-200 leading-relaxed text-sm md:text-base">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Button */}
                    {showExplanations[questionIndex] && questionIndex < questionsData.length - 1 && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => scrollToNextQuestion(questionIndex)}
                          className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm md:text-base"
                        >
                          Next Question 
                          <span className="text-base md:text-lg">↓</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Submit Button - Always show */}
              <div className="text-center pt-6 md:pt-8">
                <div className="text-base md:text-lg lg:text-xl text-gray-300 mb-4 md:mb-6 font-medium">
                  For Other Free Content & PYQs
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base lg:text-lg"
                >
                  Signup for CivilsCoach
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 rounded-xl md:rounded-2xl p-6 md:p-8 max-w-sm md:max-w-lg w-full border border-white/20 shadow-2xl relative animate-fade-in mx-auto">
            {/* Close Button */}
            <button
              onClick={handlePopupDismiss}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-white/70 hover:text-white text-xl md:text-2xl font-bold transition-colors duration-300"
            >
              ×
            </button>

            {/* Popup Content */}
            <div className="text-center">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">🚀</div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 md:mb-4">
                Unlock Premium Features!
              </h3>
              <p className="text-gray-200 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                Join <span className="text-yellow-300 font-bold">CivilsCoach</span> to access:
              </p>
              
              <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-left">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-200 text-xs md:text-sm">Complete test with detailed solutions</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-200 text-xs md:text-sm">Performance analytics & progress tracking</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-200 text-xs md:text-sm">1000+ more practice questions</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-200 text-xs md:text-sm">Expert mentorship & doubt clearing</span>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={handleSignupClick}
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                >
                  Join CivilsCoach Now! 🎯
                </button>
                <button
                  onClick={handlePopupDismiss}
                  className="w-full px-4 md:px-6 py-2 md:py-3 bg-transparent border border-white/30 text-white font-semibold rounded-lg md:rounded-xl hover:bg-white/10 transition-all duration-300 text-sm md:text-base"
                >
                  Continue Test Here
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
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .scroll-mt-24 {
          scroll-margin-top: 6rem;
        }
        
        .flex.overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        
        .flex.overflow-x-auto {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Snapshot2025;