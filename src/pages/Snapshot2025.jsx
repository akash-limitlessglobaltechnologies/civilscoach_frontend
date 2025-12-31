import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Generate confetti particles for celebration effect
  useEffect(() => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    }));
    setConfetti(particles);
  }, []);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
    
    setShowExplanations(prev => ({
      ...prev,
      [questionIndex]: true
    }));

    // Show signup popup after 3rd question (index 2)
    if (questionIndex === 2) {
      setTimeout(() => {
        setShowSignupPopup(true);
      }, 1000); // Show popup 1 second after answering 3rd question
    }
  };

  const scrollToNextQuestion = (currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questionsData.length && questionRefs.current[nextIndex]) {
      questionRefs.current[nextIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
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
    }
  };

  const scrollToQuiz = () => {
    if (quizSectionRef.current) {
      quizSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const calculateScore = () => {
    let score = 0;
    Object.keys(answers).forEach(questionIndex => {
      if (answers[questionIndex] === questionsData[questionIndex].correct - 1) { // Adjust for 0-based indexing
        score++;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10">
        {/* Happy New Year Banner - Full Width */}
        <div className="text-center py-16 px-6 w-full">
          <div className="w-full mx-auto">
            {/* Main Title with Glowing Effect */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent animate-pulse mb-4">
                Happy New Year 2026
              </h1>
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text text-transparent mb-2">
                UPSC Aspirants
              </p>
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-6">
                from Civils Coach
              </p>
              <div className="relative">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-2 animate-fade-in">
                  🎊 2025 Year in Review 🎊
                </h2>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light leading-relaxed">
              First read the major events of 2025, then test your knowledge! <br />
              <span className="text-yellow-300 font-semibold">Scroll down to explore • Can you score 100%? 🏆</span>
            </p>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={scrollToQuiz}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Skip to Quiz 🎯
              </button>
              <p className="text-sm text-gray-400">
                Or scroll down to read the facts first
              </p>
            </div>
          </div>
        </div>

        {/* Facts Section - Same background as questions */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16 w-full">
          <div className="px-6 w-full">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                📚 Major Events of 2025
              </h2>
              <p className="text-xl text-gray-300">
                Swipe right to read through these key developments before taking the quiz
              </p>
            </div>

            {/* Horizontal Scrolling Events */}
            <div className="relative h-96 md:h-[500px]">
              <div 
                className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-0 pb-6 h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {adjsonData.items.map((item, index) => (
                  <div
                    key={index}
                    ref={el => eventRefs.current[index] = el}
                    className="flex-shrink-0 w-full snap-center h-full"
                  >
                    {/* Event Content - Scrollable */}
                    <div className="h-full overflow-y-auto px-6 py-8" style={{ scrollbarWidth: 'thin' }}>
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full px-4 py-2 text-sm font-bold mb-6">
                          Event {index + 1} of {adjsonData.items.length}
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-bold text-blue-300 mb-6 leading-relaxed max-w-5xl mx-auto">
                          {item.Title}
                        </h3>
                        
                        <div className="text-lg text-gray-200 mb-6 leading-relaxed max-w-5xl mx-auto">
                          <p className="mb-4">
                            <span className="text-yellow-300 font-semibold">Summary:</span> {item.Summary}
                          </p>
                        </div>
                        
                        <div className="text-base text-gray-300 leading-relaxed max-w-5xl mx-auto mb-8">
                          {item.Text.split('\\n').map((line, lineIndex) => (
                            <p key={lineIndex} className="mb-3">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fixed Navigation Arrows */}
              <button
                onClick={() => {
                  const container = document.querySelector('.flex.overflow-x-auto');
                  container.scrollBy({ left: -400, behavior: 'smooth' });
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 z-10"
              >
                ←
              </button>
              
              <button
                onClick={() => {
                  const container = document.querySelector('.flex.overflow-x-auto');
                  container.scrollBy({ left: 400, behavior: 'smooth' });
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 z-10"
              >
                →
              </button>
            </div>

            <div className="text-center mt-16">
              <button
                onClick={scrollToQuiz}
                className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
              >
                Now Take the Quiz! 🎯
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Section - Full Width */}
        <div ref={quizSectionRef} className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16 w-full">
          <div className="px-6 w-full">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                🎯 Knowledge Test
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Answer these questions based on what you just read
              </p>
              
              {/* Live Score Display */}
              <div className="inline-flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-full px-8 py-3 border border-white/20">
                <div className="text-sm text-gray-300">
                  Answered: <span className="text-green-400 font-bold">{Object.keys(answers).length}</span> / {questionsData.length}
                </div>
                <div className="text-sm text-gray-300">
                  Score: <span className="text-yellow-400 font-bold">{calculateScore()}</span> / {Object.keys(answers).length}
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-12">
              {questionsData.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  ref={el => questionRefs.current[questionIndex] = el}
                  className="scroll-mt-24"
                >
                  {/* Question Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 md:p-8 shadow-2xl">
                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full px-4 py-2 text-sm font-bold">
                        Question {questionIndex + 1} • {question.subject}
                      </div>
                      {answers[questionIndex] !== undefined && (
                        <div className="flex items-center gap-2">
                          {answers[questionIndex] === question.correct - 1 ? (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              ✗ Incorrect
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-white mb-6 leading-relaxed">
                      {question.question}
                    </h2>

                    {/* Options */}
                    <div className="space-y-4 mb-6">
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
                            className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${bgClass} ${textClass} ${!showExplanations[questionIndex] ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0 ${
                                showResult && isCorrect ? 'bg-green-500 border-green-500 text-white' :
                                showResult && isSelected && !isCorrect ? 'bg-red-500 border-red-500 text-white' :
                                'border-current'
                              }`}>
                                {showResult && isCorrect ? '✓' : 
                                 showResult && isSelected && !isCorrect ? '✗' :
                                 String.fromCharCode(65 + optionIndex)}
                              </div>
                              <span className="font-medium leading-relaxed">{option}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {showExplanations[questionIndex] && (
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-6 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="text-xl">💡</div>
                          <div>
                            <h3 className="text-lg font-bold text-blue-300 mb-2">Explanation</h3>
                            <p className="text-gray-200 leading-relaxed">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Button */}
                    {showExplanations[questionIndex] && questionIndex < questionsData.length - 1 && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => scrollToNextQuestion(questionIndex)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                        >
                          Next Question 
                          <span className="text-lg">↓</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Submit Button - Always show */}
              <div className="text-center pt-8">
                <button
                  onClick={handleSubmit}
                  className="px-12 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
                >
                  Submit & Continue 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 rounded-2xl p-8 max-w-lg w-full border border-white/20 shadow-2xl relative animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => setShowSignupPopup(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold transition-colors duration-300"
            >
              ×
            </button>

            {/* Popup Content */}
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Unlock Premium Features!
              </h3>
              <p className="text-gray-200 mb-6 leading-relaxed">
                Join <span className="text-yellow-300 font-bold">CivilsCoach</span> to access:
              </p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-200">Complete test with detailed solutions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-200">Performance analytics & progress tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-200">1000+ more practice questions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-200">Expert mentorship & doubt clearing</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.open('https://civilscoach.com/signup', '_blank')}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Join CivilsCoach Now! 🎯
                </button>
                <button
                  onClick={() => setShowSignupPopup(false)}
                  className="w-full px-6 py-3 bg-transparent border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
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