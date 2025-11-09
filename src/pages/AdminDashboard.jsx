import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    testName: '',
    jsonFile: null,
    correctScore: 4,      // Default scoring similar to JEE/NEET
    wrongScore: -1,       // Negative marking
    unansweredScore: 0    // No penalty for unanswered
  });
  const navigate = useNavigate();

  useEffect(() => {
    const adminCredentials = sessionStorage.getItem('adminCredentials');
    if (!adminCredentials) {
      navigate('/admin');
      return;
    }
    fetchTests();
  }, [navigate]);

  const getAdminCredentials = () => {
    const stored = sessionStorage.getItem('adminCredentials');
    return stored ? JSON.parse(stored) : null;
  };

  const fetchTests = async () => {
    try {
      const credentials = getAdminCredentials();
      if (!credentials) {
        navigate('/admin');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/admin/tests', credentials);
      setTests(response.data.tests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tests:', error);
      if (error.response?.status === 401) {
        sessionStorage.removeItem('adminCredentials');
        navigate('/admin');
      } else {
        setError('Failed to load tests');
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminCredentials');
    navigate('/admin');
  };

  const handleInputChange = (e) => {
    // Clear error when user starts making changes
    if (error) {
      setError('');
    }

    if (e.target.name === 'jsonFile') {
      setFormData({
        ...formData,
        jsonFile: e.target.files[0]
      });
    } else if (e.target.name === 'correctScore' || e.target.name === 'wrongScore' || e.target.name === 'unansweredScore') {
      setFormData({
        ...formData,
        [e.target.name]: parseFloat(e.target.value)
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      const credentials = getAdminCredentials();
      if (!credentials) {
        navigate('/admin');
        return;
      }

      // Validate that all required fields are filled
      if (!formData.testName.trim()) {
        setError('Test name is required');
        setCreateLoading(false);
        return;
      }

      if (!formData.jsonFile) {
        setError('Please select a JSON file');
        setCreateLoading(false);
        return;
      }

      // Validate scoring values
      if (formData.correctScore <= 0) {
        setError('Correct answer score must be positive');
        setCreateLoading(false);
        return;
      }

      const submitData = new FormData();
      submitData.append('testName', formData.testName);
      submitData.append('correctScore', formData.correctScore);
      submitData.append('wrongScore', formData.wrongScore);
      submitData.append('unansweredScore', formData.unansweredScore);
      submitData.append('jsonFile', formData.jsonFile);
      submitData.append('adminId', credentials.adminId);
      submitData.append('password', credentials.password);

      const response = await axios.post('http://localhost:5000/api/admin/create-test', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setShowCreateForm(false);
        setFormData({ 
          testName: '', 
          jsonFile: null,
          correctScore: 4,
          wrongScore: -1,
          unansweredScore: 0
        });
        fetchTests(); // Refresh the tests list
        alert(`Test created successfully!\nDuration: ${response.data.timeInMins} minutes\nQuestions: ${response.data.questionsCount}`);
      }
    } catch (error) {
      console.error('Error creating test:', error);
      
      // Extract specific error message from server response
      let errorMessage = 'Failed to create test';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Add helpful suggestions for common errors
        if (errorMessage.includes('already exists')) {
          errorMessage += '. Please choose a different test name.';
        } else if (errorMessage.includes('JSON validation failed')) {
          errorMessage += '. Please check your JSON file format.';
        } else if (errorMessage.includes('Duration')) {
          errorMessage += '. Please check the timeInMins field in your JSON file.';
        }
      } else if (error.response?.data?.errors) {
        errorMessage = 'Validation errors: ' + error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) {
      return;
    }

    try {
      const credentials = getAdminCredentials();
      if (!credentials) {
        navigate('/admin');
        return;
      }

      const response = await axios.delete(`http://localhost:5000/api/admin/tests/${testId}`, {
        data: credentials
      });

      if (response.data.success) {
        fetchTests(); // Refresh the tests list
        alert('Test deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatScoring = (test) => {
    if (test.scoring) {
      return `+${test.scoring.correct} | ${test.scoring.wrong} | ${test.scoring.unanswered}`;
    }
    return 'Standard';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage tests and view statistics</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Create Test Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Cancel' : 'Create New Test'}
        </button>
      </div>

      {/* Create Test Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Test</h2>
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Name
              </label>
              <input
                type="text"
                name="testName"
                value={formData.testName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter test name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Use unique names like "JEE Main 2024 Session 1" or add dates/times to avoid duplicates
              </p>
            </div>



            {/* Scoring Configuration */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-md font-medium text-gray-800 mb-3">Scoring Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score for Correct Answer
                  </label>
                  <input
                    type="number"
                    name="correctScore"
                    value={formData.correctScore}
                    onChange={handleInputChange}
                    required
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 4"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score for Wrong Answer
                  </label>
                  <input
                    type="number"
                    name="wrongScore"
                    value={formData.wrongScore}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., -1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use negative values for penalty</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score for Unanswered
                  </label>
                  <input
                    type="number"
                    name="unansweredScore"
                    value={formData.unansweredScore}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Usually 0 for no penalty</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Preview:</strong> Correct: +{formData.correctScore}, Wrong: {formData.wrongScore}, Unanswered: {formData.unansweredScore}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON File
              </label>
              <input
                type="file"
                name="jsonFile"
                accept=".json"
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a JSON file containing questions in the required format. Test duration will be taken from the "timeInMins" field in the JSON file.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={createLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {createLoading ? 'Creating...' : 'Create Test'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sample JSON Format */}
      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-8 border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-2">Sample JSON Format:</h3>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "year": 2024,
  "paper": "JEE Main Paper-1",
  "numberOfQuestions": 90,
  "timeInMins": 180,
  "cutoff": {
    "Gen": 89.75,
    "EWS": 78.22,
    "OBC": 70.32,
    "SC": 42.17,
    "ST": 27.58
  },
  "questions": [
    {
      "question": "If the coefficient of x^7 in the expansion of (1+x)^10(1+x+x^2+x^3)^7 is k, then k equals:",
      "difficulty": "Medium",
      "area": "Mathematics",
      "OptionA": "330",
      "OptionB": "287",
      "OptionC": "715",
      "OptionD": "462",
      "key": "C",
      "explanation": "Using binomial theorem and multinomial expansion..."
    }
  ]
}`}
          </pre>
        </div>
      )}

      {/* Tests List */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          All Tests ({tests.length})
        </h2>
        
        {tests.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-4 rounded-full">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No tests created yet</h3>
            <p className="text-gray-500">Create your first test using the button above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test._id} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {test.name}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {test.year}
                    </span>
                  </div>
                  
                  <div className="mb-4 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Paper:</span> {test.paper}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Duration:</span> {formatDuration(test.duration)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Questions:</span> {test.questions.length}
                      {test.numberOfQuestions && test.numberOfQuestions !== test.questions.length && 
                        <span className="text-red-600 ml-1">({test.numberOfQuestions} expected)</span>
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Scoring:</span> {formatScoring(test)}
                    </p>
                    {test.cutoff && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Cutoffs:</span> Gen:{test.cutoff.Gen} | EWS:{test.cutoff.EWS} | OBC:{test.cutoff.OBC} | SC:{test.cutoff.SC} | ST:{test.cutoff.ST}
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Created: {new Date(test.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <a
                      href={`/test/${test._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-center text-sm"
                    >
                      Preview
                    </a>
                    <button
                      onClick={() => handleDeleteTest(test._id)}
                      className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;