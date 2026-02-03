import React from 'react';
import { useNavigate } from 'react-router-dom';

const UntimedSubjectSelection = ({ onClose }) => {
  const navigate = useNavigate();

  // Subject options with area mapping
  const subjects = [
    {
      id: 'all',
      name: 'All Subjects',
      description: 'Practice questions from all areas',
      icon: '📚',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      hoverColor: 'hover:bg-blue-200'
    },
    {
      id: 1,
      name: 'Current Affairs',
      description: 'Recent events and developments',
      icon: '📰',
      color: 'bg-red-100 text-red-800 border-red-200',
      hoverColor: 'hover:bg-red-200'
    },
    {
      id: 2,
      name: 'History',
      description: 'Indian and world history',
      icon: '🏛️',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hoverColor: 'hover:bg-yellow-200'
    },
    {
      id: 3,
      name: 'Polity',
      description: 'Indian Constitution and governance',
      icon: '⚖️',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      hoverColor: 'hover:bg-blue-200'
    },
    {
      id: 4,
      name: 'Economy',
      description: 'Economic concepts and policies',
      icon: '💰',
      color: 'bg-green-100 text-green-800 border-green-200',
      hoverColor: 'hover:bg-green-200'
    },
    {
      id: 5,
      name: 'Geography',
      description: 'Physical and human geography',
      icon: '🌍',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      hoverColor: 'hover:bg-indigo-200'
    },
    {
      id: 6,
      name: 'Ecology',
      description: 'Environment and ecology',
      icon: '🌱',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      hoverColor: 'hover:bg-emerald-200'
    },
    {
      id: 7,
      name: 'General Science',
      description: 'Science and technology',
      icon: '🔬',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      hoverColor: 'hover:bg-purple-200'
    },
    {
      id: 8,
      name: 'Arts & Culture',
      description: 'Indian art and culture',
      icon: '🎭',
      color: 'bg-pink-100 text-pink-800 border-pink-200',
      hoverColor: 'hover:bg-pink-200'
    }
  ];

  const handleSubjectSelect = (subject) => {
    navigate('/untimed-practice', {
      state: {
        subject: subject.id,
        subjectName: subject.name
      }
    });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Subject for Practice MCQs</h2>
              <p className="text-gray-600 mt-1">
                Practice questions one by one without time pressure. Track your progress and skip questions you want to revisit later.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Subject Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSubjectSelect(subject)}
                className={`p-4 border-2 rounded-lg text-left transition-all duration-200 transform hover:scale-105 hover:shadow-md ${subject.color} ${subject.hoverColor}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{subject.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{subject.name}</h3>
                    <p className="text-sm opacity-80">{subject.description}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center text-sm font-medium opacity-75">
                  <span>Start Practice</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Info */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">✨ Practice MCQS Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">No Time Pressure</div>
                <div className="text-gray-600">Take as much time as you need</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Instant Feedback</div>
                <div className="text-gray-600">Get explanations immediately</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Smart Skip</div>
                <div className="text-gray-600">Skipped questions come back later</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Progress Tracking</div>
                <div className="text-gray-600">See completed and skipped counts</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L12 12m6.364 6.364L12 12m0 0L5.636 5.636M12 12l6.364-6.364" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">No Repetition</div>
                <div className="text-gray-600">Answered questions won't repeat</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Focus Learning</div>
                <div className="text-gray-600">One question at a time approach</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UntimedSubjectSelection;