import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState(null);
  const [tests, setTests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  
  // Form state for test creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    testName: '',
    testType: 'Practice',
    correctScore: '4',
    wrongScore: '-1',
    unansweredScore: '0',
    jsonFile: null
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Question Bank state
  const [questionBankStats, setQuestionBankStats] = useState(null);
  const [questionBankList, setQuestionBankList] = useState([]);
  const [questionBankLoading, setQuestionBankLoading] = useState(false);
  const [showQuestionBankUpload, setShowQuestionBankUpload] = useState(false);
  const [questionBankFilters, setQuestionBankFilters] = useState({
    area: '',
    difficulty: '',
    subarea: '',
    sortBy: 'createdAt'
  });
  const [questionBankPagination, setQuestionBankPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalQuestions: 0,
    limit: 20
  });
  const [questionBankUpload, setQuestionBankUpload] = useState({
    jsonFile: null,
    uploading: false,
    uploadResult: null,
    error: ''
  });

  // Area mapping for display
  const AREA_MAPPING = {
    1: 'Current Affairs',
    2: 'History',
    3: 'Polity',
    4: 'Economy',
    5: 'Geography',
    6: 'Ecology',
    7: 'General Science',
    8: 'Arts & Culture'
  };

  const testTypes = [
    { 
      value: 'PYQ', 
      label: 'Previous Year Questions', 
      description: 'Questions from previous year examinations',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      value: 'Practice', 
      label: 'Practice Questions', 
      description: 'Practice questions for skill development',
      color: 'bg-green-100 text-green-800'
    },
    { 
      value: 'Assessment', 
      label: 'Assessment Test', 
      description: 'Formal assessment and evaluation tests',
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  useEffect(() => {
    const storedCredentials = sessionStorage.getItem('adminCredentials');
    if (!storedCredentials) {
      navigate('/admin');
      return;
    }

    try {
      const parsedCredentials = JSON.parse(storedCredentials);
      setCredentials(parsedCredentials);
      fetchStatistics(parsedCredentials);
      fetchQuestionBankStats(parsedCredentials);
    } catch (error) {
      console.error('Error parsing credentials:', error);
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    if (credentials) {
      if (currentTab === 'question-bank') {
        fetchQuestionBankList(credentials, 1, questionBankFilters);
      } else {
        fetchTests(credentials, currentTab);
      }
    }
  }, [credentials, currentTab]);

  // ========================================
  // EXISTING TEST FUNCTIONS
  // ========================================

  const fetchTests = async (creds, testType = 'all') => {
    try {
      setLoading(true);
      setError('');
      
      let queryParam = '';
      if (testType && testType !== 'all' && testType !== 'question-bank') {
        queryParam = `?testType=${testType}`;
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_APP_URI}/api/admin/tests${queryParam}`,
        creds
      );
      
      setTests(response.data.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Failed to load tests');
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (creds) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_URI}/api/admin/statistics`,
        creds
      );
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    if (tab === 'question-bank' && credentials) {
      fetchQuestionBankList(credentials, 1, questionBankFilters);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setFormError('Please select a JSON file');
        return;
      }
      setFormData(prev => ({
        ...prev,
        jsonFile: file
      }));
      setFormError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const submitData = new FormData();
      submitData.append('testName', formData.testName);
      submitData.append('testType', formData.testType);
      submitData.append('correctScore', formData.correctScore);
      submitData.append('wrongScore', formData.wrongScore);
      submitData.append('unansweredScore', formData.unansweredScore);
      submitData.append('adminId', credentials.adminId);
      submitData.append('password', credentials.password);
      submitData.append('jsonFile', formData.jsonFile);

      const response = await axios.post(
        `${import.meta.env.VITE_APP_URI}/api/admin/create-test`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setFormSuccess(`Test "${formData.testName}" created successfully!`);
      
      setFormData({
        testName: '',
        testType: 'Practice',
        correctScore: '4',
        wrongScore: '-1',
        unansweredScore: '0',
        jsonFile: null
      });
      
      const fileInput = document.getElementById('jsonFile');
      if (fileInput) fileInput.value = '';

      fetchTests(credentials, currentTab);
      fetchStatistics(credentials);
      
      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Error creating test:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setFormError(errorData.errors.join(', '));
        } else if (errorData.message) {
          setFormError(errorData.message);
        } else {
          setFormError('Failed to create test');
        }
        
        if (errorData.suggestions) {
          setFormError(prev => prev + '\n\nSuggestions:\n' + errorData.suggestions.join('\n'));
        }
      } else {
        setFormError('Failed to create test');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTest = async (testId, testName) => {
    if (!window.confirm(`Are you sure you want to delete "${testName}"?`)) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_URI}/api/admin/tests/${testId}`,
        { data: credentials }
      );
      
      fetchTests(credentials, currentTab);
      fetchStatistics(credentials);
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminCredentials');
    navigate('/admin');
  };

  // ========================================
  // QUESTION BANK FUNCTIONS
  // ========================================

  const fetchQuestionBankStats = async (creds) => {
    try {
      setQuestionBankLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_APP_URI}/api/admin/question-bank/statistics`,
        creds
      );
      setQuestionBankStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching question bank stats:', error);
      // Don't show error for question bank if not implemented yet
    } finally {
      setQuestionBankLoading(false);
    }
  };

  const fetchQuestionBankList = async (creds, page = 1, filters = {}) => {
    try {
      setQuestionBankLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: questionBankPagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      }).toString();
      
      const response = await axios.post(
        `${import.meta.env.VITE_APP_URI}/api/admin/question-bank/list?${queryParams}`,
        creds
      );
      
      setQuestionBankList(response.data.questions || []);
      setQuestionBankPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching question bank list:', error);
      setQuestionBankList([]);
    } finally {
      setQuestionBankLoading(false);
    }
  };

  const handleQuestionBankUpload = async () => {
    if (!questionBankUpload.jsonFile || !credentials) {
      setQuestionBankUpload(prev => ({
        ...prev,
        error: 'Please select a JSON file'
      }));
      return;
    }

    try {
      setQuestionBankUpload(prev => ({ ...prev, uploading: true, error: '', uploadResult: null }));

      const formData = new FormData();
      formData.append('jsonFile', questionBankUpload.jsonFile);
      formData.append('adminId', credentials.adminId);
      formData.append('password', credentials.password);

      const response = await axios.post(
        `${import.meta.env.VITE_APP_URI}/api/admin/question-bank/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      setQuestionBankUpload(prev => ({
        ...prev,
        uploadResult: response.data,
        jsonFile: null
      }));

      // Reset file input
      const fileInput = document.getElementById('questionBankFile');
      if (fileInput) fileInput.value = '';

      // Refresh stats and list
      await fetchQuestionBankStats(credentials);
      if (currentTab === 'question-bank') {
        await fetchQuestionBankList(credentials, 1, questionBankFilters);
      }

      setShowQuestionBankUpload(false);

    } catch (error) {
      console.error('Question bank upload error:', error);
      setQuestionBankUpload(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Upload failed'
      }));
    } finally {
      setQuestionBankUpload(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleQuestionBankFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setQuestionBankUpload(prev => ({
        ...prev,
        error: 'Please select a valid JSON file'
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setQuestionBankUpload(prev => ({
        ...prev,
        error: 'File size must be less than 10MB'
      }));
      return;
    }

    setQuestionBankUpload(prev => ({
      ...prev,
      jsonFile: file,
      error: '',
      uploadResult: null
    }));
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTestTypeColor = (testType) => {
    const typeConfig = testTypes.find(t => t.value === testType);
    return typeConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getAreaColor = (areaNumber) => {
    const colors = {
      1: 'bg-red-100 text-red-700',
      2: 'bg-yellow-100 text-yellow-700',
      3: 'bg-blue-100 text-blue-700',
      4: 'bg-green-100 text-green-700',
      5: 'bg-indigo-100 text-indigo-700',
      6: 'bg-emerald-100 text-emerald-700',
      7: 'bg-purple-100 text-purple-700',
      8: 'bg-pink-100 text-pink-700'
    };
    return colors[areaNumber] || 'bg-gray-100 text-gray-700';
  };

  const getAreaBreakdown = (test) => {
    if (!test.questions || !Array.isArray(test.questions)) {
      return {};
    }

    const breakdown = {};
    test.questions.forEach(question => {
      const area = question.area || 1;
      const areaName = AREA_MAPPING[area] || `Area ${area}`;
      
      if (!breakdown[area]) {
        breakdown[area] = { name: areaName, count: 0 };
      }
      breakdown[area].count++;
    });

    return breakdown;
  };

  const getTestCounts = () => {
    if (!statistics?.testsByType) return { PYQ: 0, Practice: 0, Assessment: 0, total: 0 };
    
    const counts = {
      PYQ: statistics.testsByType.PYQ?.count || 0,
      Practice: statistics.testsByType.Practice?.count || 0,
      Assessment: statistics.testsByType.Assessment?.count || 0
    };
    
    counts.total = counts.PYQ + counts.Practice + counts.Assessment;
    return counts;
  };

  // ========================================
  // RENDER COMPONENTS
  // ========================================

  // Question Bank Upload Modal Component
  const QuestionBankUploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Questions to Bank</h3>
          <button
            onClick={() => setShowQuestionBankUpload(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <input
              id="questionBankFile"
              type="file"
              accept=".json"
              onChange={handleQuestionBankFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload JSON file with questions. Duplicates will be automatically detected and skipped.
            </p>
          </div>

          {questionBankUpload.jsonFile && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p><strong>Selected:</strong> {questionBankUpload.jsonFile.name}</p>
              <p><strong>Size:</strong> {formatFileSize(questionBankUpload.jsonFile.size)}</p>
            </div>
          )}

          {questionBankUpload.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
              {questionBankUpload.error}
            </div>
          )}

          {questionBankUpload.uploadResult && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded">
              <p className="font-semibold">{questionBankUpload.uploadResult.message}</p>
              <div className="text-sm mt-2 space-y-1">
                <p>✅ <strong>New Questions:</strong> {questionBankUpload.uploadResult.results.inserted}</p>
                <p>🔄 <strong>Duplicates Skipped:</strong> {questionBankUpload.uploadResult.results.duplicates}</p>
                <p>❌ <strong>Errors:</strong> {questionBankUpload.uploadResult.results.errors}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleQuestionBankUpload}
              disabled={!questionBankUpload.jsonFile || questionBankUpload.uploading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {questionBankUpload.uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                'Upload to Question Bank'
              )}
            </button>
            
            <button
              onClick={() => setShowQuestionBankUpload(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Question Bank Content Component
  const QuestionBankContent = () => (
    <div className="space-y-6">
      {/* Question Bank Statistics */}
      {questionBankStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Questions</p>
                <p className="text-2xl font-semibold text-gray-900">{questionBankStats.overview.totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verified</p>
                <p className="text-2xl font-semibold text-gray-900">{questionBankStats.overview.verifiedQuestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                <p className="text-2xl font-semibold text-gray-900">{questionBankStats.usageStatistics.totalUsage}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{questionBankStats.usageStatistics.globalSuccessRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Bank List */}
      <div className="bg-white rounded-lg shadow">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={questionBankFilters.area}
              onChange={(e) => {
                const newFilters = { ...questionBankFilters, area: e.target.value };
                setQuestionBankFilters(newFilters);
                if (credentials) fetchQuestionBankList(credentials, 1, newFilters);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Areas</option>
              {Object.entries(AREA_MAPPING).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>

            <select
              value={questionBankFilters.difficulty}
              onChange={(e) => {
                const newFilters = { ...questionBankFilters, difficulty: e.target.value };
                setQuestionBankFilters(newFilters);
                if (credentials) fetchQuestionBankList(credentials, 1, newFilters);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <input
              type="text"
              placeholder="Subarea..."
              value={questionBankFilters.subarea}
              onChange={(e) => {
                const newFilters = { ...questionBankFilters, subarea: e.target.value };
                setQuestionBankFilters(newFilters);
                if (credentials) fetchQuestionBankList(credentials, 1, newFilters);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />

            <select
              value={questionBankFilters.sortBy}
              onChange={(e) => {
                const newFilters = { ...questionBankFilters, sortBy: e.target.value };
                setQuestionBankFilters(newFilters);
                if (credentials) fetchQuestionBankList(credentials, 1, newFilters);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt">Latest First</option>
              <option value="usage">Most Used</option>
              <option value="quality">Highest Quality</option>
              <option value="area">By Area</option>
            </select>
          </div>
        </div>

        {/* Question List */}
        <div className="overflow-x-auto">
          {questionBankLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : questionBankList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading questions to the question bank.</p>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questionBankList.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{question.questionPreview}</div>
                      <div className="text-xs text-gray-500">Answer: {question.correctAnswer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAreaColor(question.area)}`}>
                        {AREA_MAPPING[question.area] || `Area ${question.area}`}
                      </span>
                      {question.subarea && (
                        <div className="text-xs text-gray-500 mt-1">{question.subarea}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        question.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {question.difficulty || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Used: {question.usage.timesUsed}x</div>
                      <div className="text-xs text-gray-500">Success: {question.usage.successRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">{question.qualityScore}/5</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(question.qualityScore / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {questionBankPagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((questionBankPagination.currentPage - 1) * questionBankPagination.limit) + 1} to{' '}
                {Math.min(questionBankPagination.currentPage * questionBankPagination.limit, questionBankPagination.totalQuestions)} of{' '}
                {questionBankPagination.totalQuestions} questions
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const page = questionBankPagination.currentPage - 1;
                    if (credentials) fetchQuestionBankList(credentials, page, questionBankFilters);
                  }}
                  disabled={questionBankPagination.currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-3 py-1 text-sm">
                  Page {questionBankPagination.currentPage} of {questionBankPagination.totalPages}
                </span>
                
                <button
                  onClick={() => {
                    const page = questionBankPagination.currentPage + 1;
                    if (credentials) fetchQuestionBankList(credentials, page, questionBankFilters);
                  }}
                  disabled={questionBankPagination.currentPage >= questionBankPagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && !statistics) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const testCounts = getTestCounts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage tests, question bank and view analytics</p>
        </div>
        <div className="flex space-x-4">
          {currentTab === 'question-bank' ? (
            <button
              onClick={() => setShowQuestionBankUpload(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload Questions</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Test</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button 
            onClick={() => setError('')} 
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {formSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {formSuccess}
          <button 
            onClick={() => setFormSuccess('')} 
            className="ml-2 text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{statistics.totalTests}</h3>
                <p className="text-sm text-gray-600">Total Tests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{testCounts.PYQ}</h3>
                <p className="text-sm text-gray-600">PYQ Tests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{testCounts.Practice}</h3>
                <p className="text-sm text-gray-600">Practice Tests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6M9 17h6m-6 0H5a2 2 0 01-2-2V7a2 2 0 012-2h4m4-2v14M13 5h6a2 2 0 012 2v8a2 2 0 01-2 2h-6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{testCounts.Assessment}</h3>
                <p className="text-sm text-gray-600">Assessments</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Type Tabs */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-wrap space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            📚 All Tests ({testCounts.total})
          </button>
          {testTypes.map(type => (
            <button
              key={type.value}
              onClick={() => handleTabChange(type.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === type.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {type.value === 'PYQ' ? '📖' : type.value === 'Practice' ? '✍️' : '🎯'} {type.label} ({testCounts[type.value] || 0})
            </button>
          ))}
          <button
            onClick={() => handleTabChange('question-bank')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'question-bank'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            🏦 Question Bank
          </button>
        </div>
      </div>

      {/* Content */}
      {currentTab === 'question-bank' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Question Bank</h2>
            <button
              onClick={() => setShowQuestionBankUpload(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload Questions</span>
            </button>
          </div>
          <QuestionBankContent />
        </div>
      ) : (
        /* Tests List */
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentTab === 'all' ? 'All Tests' : testTypes.find(t => t.value === currentTab)?.label || 'Tests'}
              </h2>
              <div className="text-sm text-gray-500">
                Showing {tests.length} tests
                {currentTab !== 'all' && ` • Filtered by: ${testTypes.find(t => t.value === currentTab)?.label}`}
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {currentTab === 'all' ? 'all' : currentTab} tests...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : tests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {currentTab === 'all' ? '' : currentTab + ' '}tests found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tests.map((test) => {
                const areaBreakdown = getAreaBreakdown(test);
                
                return (
                  <div key={test.id || test._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{test.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTestTypeColor(test.testType)}`}>
                            {test.testType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p><span className="font-medium">Paper:</span> {test.paper} • <span className="font-medium">Year:</span> {test.year}</p>
                          <p><span className="font-medium">Questions:</span> {test.questionCount} • <span className="font-medium">Duration:</span> {test.duration} mins</p>
                          
                          {/* Area Breakdown Display */}
                          {Object.keys(areaBreakdown).length > 0 && (
                            <div>
                              <span className="font-medium">Areas:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(areaBreakdown).map(([area, data]) => (
                                  <span key={area} className={`px-2 py-1 rounded-full text-xs font-medium ${getAreaColor(parseInt(area))}`}>
                                    {data.name}: {data.count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <p><span className="font-medium">Created:</span> {new Date(test.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteTest(test.id || test._id, test.name)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                          title="Delete test"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Create New Test</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Name *
                    </label>
                    <input
                      type="text"
                      name="testName"
                      value={formData.testName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter test name"
                    />
                  </div>

                  {/* Test Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Type *
                    </label>
                    <div className="space-y-3">
                      {testTypes.map(type => (
                        <div key={type.value} className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="testType"
                            value={type.value}
                            checked={formData.testType === type.value}
                            onChange={handleInputChange}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{type.label}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
                                {type.value}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scoring Configuration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scoring Configuration
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Correct (+)</label>
                        <input
                          type="number"
                          name="correctScore"
                          value={formData.correctScore}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Wrong (-)</label>
                        <input
                          type="number"
                          name="wrongScore"
                          value={formData.wrongScore}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Unanswered</label>
                        <input
                          type="number"
                          name="unansweredScore"
                          value={formData.unansweredScore}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Questions JSON File *
                    </label>
                    <input
                      type="file"
                      id="jsonFile"
                      accept=".json"
                      onChange={handleFileChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Upload a JSON file containing test questions with area and subarea fields
                    </p>
                  </div>

                  {/* Messages */}
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg whitespace-pre-line">
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      {formSuccess}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={formLoading || !formData.jsonFile}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {formLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Test...
                        </div>
                      ) : (
                        'Create Test'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              {/* Area Guide Section */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4 sticky top-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📚 Subject Area Guide</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Use these numbers in your JSON for the "area" field:
                  </p>
                  <div className="space-y-2">
                    {Object.entries(AREA_MAPPING).map(([number, name]) => (
                      <div key={number} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAreaColor(parseInt(number)).replace(/text-\w+-\d+/, 'text-white').replace(/bg-(\w+)-100/, 'bg-$1-600')}`}>
                            {number}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips:</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Each question needs an "area" field (1-8)</li>
                      <li>• "subarea" field is optional (any text)</li>
                      <li>• System auto-converts area names to numbers</li>
                      <li>• Flexible validation handles missing fields</li>
                    </ul>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h5 className="text-sm font-semibold text-green-900 mb-2">📄 JSON Example:</h5>
                    <pre className="text-xs text-green-800 whitespace-pre-wrap">
{`{
  "questions": [{
    "question": "What is...?",
    "area": 1,
    "subarea": "Daily News",
    "OptionA": "Option A",
    ...
  }]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Bank Upload Modal */}
      {showQuestionBankUpload && <QuestionBankUploadModal />}
    </div>
  );
};

export default AdminDashboard;