import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Main analytics data
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // View states
  const [activeView, setActiveView] = useState('users'); // users, userDetail
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Test history pagination
  const [testHistoryPage, setTestHistoryPage] = useState(1);
  const [practiceHistoryPage, setPracticeHistoryPage] = useState(1);
  const [practiceSubjectFilter, setPracticeSubjectFilter] = useState('all');

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

  useEffect(() => {
    const storedCredentials = sessionStorage.getItem('adminCredentials');
    if (!storedCredentials) {
      navigate('/admin');
      return;
    }

    try {
      const parsedCredentials = JSON.parse(storedCredentials);
      setCredentials(parsedCredentials);
      setLoading(false);
    } catch (error) {
      console.error('Error parsing credentials:', error);
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    if (credentials && activeView === 'users') {
      fetchUsers();
    }
  }, [credentials, currentPage, searchQuery, sortBy, sortOrder, activeView]);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_APP_URI}/api/admin/analytics/users?${params}`,
        {
          headers: {
            'x-admin-id': credentials.adminId,
            'x-admin-password': credentials.password
          }
        }
      );
      
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      setDetailsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_URI}/api/admin/analytics/users/${userId}`,
        {
          headers: {
            'x-admin-id': credentials.adminId,
            'x-admin-password': credentials.password
          }
        }
      );
      setUserDetails(response.data.data);
      setActiveView('userDetail');
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color for area
  const getAreaColor = (area) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-blue-100 text-blue-800',
      4: 'bg-green-100 text-green-800',
      5: 'bg-indigo-100 text-indigo-800',
      6: 'bg-purple-100 text-purple-800',
      7: 'bg-pink-100 text-pink-800',
      8: 'bg-orange-100 text-orange-800'
    };
    return colors[area] || 'bg-gray-100 text-gray-800';
  };


  // Users List View
  const UsersListView = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">View and analyze user activity</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Join Date</option>
                <option value="statistics.totalTestsCompleted">Tests Completed</option>
                <option value="statistics.averageScore">Average Score</option>
                <option value="security.lastLoginAt">Last Login</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timed Tests</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Practice Qs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {user.fullName.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {user.isVerified && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                Verified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.timedTests.total} tests</div>
                          <div className="text-xs text-gray-500">{user.timedTests.avgPercentage}% avg</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.untimedPractice.totalQuestions} Qs</div>
                          <div className="text-xs text-gray-500">{user.untimedPractice.answered} answered</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.joinedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              fetchUserDetails(user._id);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // User Detail View
  const UserDetailView = () => {
    if (detailsLoading || !userDetails) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setActiveView('users');
              setUserDetails(null);
              setSelectedUser(null);
            }}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </button>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {userDetails.user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userDetails.user.profile.firstName} {userDetails.user.profile.lastName || ''}
                </h2>
                <p className="text-gray-600">{userDetails.user.email}</p>
                <p className="text-gray-500 text-sm">{userDetails.user.phoneNumber}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded ${
                userDetails.user.security.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userDetails.user.security.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded bg-blue-100 text-blue-800">
                {userDetails.user.subscription.plan}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-lg font-semibold">{userDetails.user.profile.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Joined</p>
              <p className="text-lg font-semibold">{formatDate(userDetails.user.joinedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Active</p>
              <p className="text-lg font-semibold">{formatDate(userDetails.user.lastActive)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Streak</p>
              <p className="text-lg font-semibold">{userDetails.user.statistics.streakDays} days</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-3xl font-bold text-blue-600">{userDetails.timedTests.overall.totalTests}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Practice Questions</p>
                <p className="text-3xl font-bold text-green-600">{userDetails.untimedPractice.overall.total}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Accuracy</p>
                <p className="text-3xl font-bold text-purple-600">{userDetails.untimedPractice.overall.accuracy}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Test Performance by Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Performance by Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(userDetails.timedTests.overall.byType).map(([type, stats]) => (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 text-sm font-medium rounded ${
                    type === 'PYQ' ? 'bg-blue-100 text-blue-800' :
                    type === 'Practice' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {type}
                  </span>
                  <span className="text-sm text-gray-600">{stats.count} tests</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Score</span>
                    <span className="font-semibold">{stats.avgScore}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg %</span>
                    <span className="font-semibold">{stats.avgPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Best Score</span>
                    <span className="font-semibold text-green-600">{stats.bestScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance (From Tests)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userDetails.timedTests.subjectPerformance.map((subject) => (
              <div key={subject.subject} className="border rounded-lg p-4">
                <div className={`text-sm font-medium mb-2 px-2 py-1 rounded inline-block ${getAreaColor(parseInt(subject.subject))}`}>
                  {AREA_MAPPING[subject.subject] || `Subject ${subject.subject}`}
                </div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-semibold">{subject.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Correct</span>
                    <span className="font-semibold">{subject.correctAnswers}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Wrong</span>
                    <span className="font-semibold">{subject.wrongAnswers}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Accuracy</span>
                      <span className="text-sm font-bold text-blue-600">{subject.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${subject.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Untimed Practice by Subject */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Untimed Practice by Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userDetails.untimedPractice.bySubject.map((subject) => (
              <div key={subject.subject} className="border rounded-lg p-4">
                <div className={`text-sm font-medium mb-2 px-2 py-1 rounded inline-block ${getAreaColor(subject.subject)}`}>
                  {AREA_MAPPING[subject.subject] || `Subject ${subject.subject}`}
                </div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold">{subject.total}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600">Answered</span>
                    <span className="font-semibold">{subject.answered}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Correct</span>
                    <span className="font-semibold">{subject.correct}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Accuracy</span>
                      <span className="text-sm font-bold text-green-600">{subject.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full" 
                        style={{ width: `${subject.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tests */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Test Attempts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userDetails.timedTests.recentTests.slice(0, 10).map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{test.testName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        test.testType === 'PYQ' ? 'bg-blue-100 text-blue-800' :
                        test.testType === 'Practice' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {test.testType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{test.score}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {test.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.timeTaken} min</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(test.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Stat Card Component
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveView('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'users' || activeView === 'userDetail'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {activeView === 'users' && <UsersListView />}
        {activeView === 'userDetail' && <UserDetailView />}
      </div>
    </div>
  );
};

export default AdminAnalytics;