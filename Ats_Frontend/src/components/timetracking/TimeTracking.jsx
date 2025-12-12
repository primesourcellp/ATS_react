import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { timeTrackingAPI, userAPI, userActivityAPI } from "../../api/api";
import {
  FaClock,
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaUsers,
  FaSync,
  FaStopwatch,
  FaLaptop
} from "react-icons/fa";

const TimeTracking = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserSession, setCurrentUserSession] = useState(null);
  const [userWorkingHours, setUserWorkingHours] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [previousActiveCount, setPreviousActiveCount] = useState(0);

  const currentUsername = localStorage.getItem("username");

  // Update current time every second for live clock
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    loadData();
    
    // Update all user statuses every 3 seconds to check for AWAY/ONLINE status changes
    // This ensures immediate status updates when user interacts
    const statusInterval = setInterval(() => {
      userActivityAPI.updateAllStatuses().catch(err => console.error("Status update failed:", err));
    }, 3000);
    
    // Refresh every 2 seconds for ultra-live updates
    const interval = setInterval(() => {
      loadActiveSessions();
      // Also refresh current user session if available
      if (currentUsername) {
        loadCurrentUserSession();
      }
      setLastUpdate(new Date());
    }, 2000);
    
    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [currentUsername]);
  
  // Track user activity on ANY interaction (clicks, navigation, API calls)
  // When user in AWAY status interacts, immediately change to ONLINE
  useEffect(() => {
    let lastInteractionTime = Date.now();
    const INTERACTION_THROTTLE = 10000; // Max once per 10 seconds (faster response)
    
    const handleUserInteraction = () => {
      const now = Date.now();
      // Ping activity if enough time has passed since last interaction
      if (now - lastInteractionTime >= INTERACTION_THROTTLE) {
        lastInteractionTime = now;
        // Immediately update activity to change AWAY to ONLINE
        userActivityAPI.ping().catch(err => console.error("Activity ping failed:", err));
      }
    };
    
    // Track all real user interactions
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('mousedown', handleUserInteraction);
    document.addEventListener('scroll', handleUserInteraction); // User scrolling = active
    
    // Track when tab becomes visible (user switched to this tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User switched to this tab - immediately update activity
        lastInteractionTime = Date.now();
        userActivityAPI.ping().catch(err => console.error("Activity ping failed:", err));
      }
    };
    
    // Track when window gains focus
    const handleFocus = () => {
      // User clicked on window - immediately update activity
      lastInteractionTime = Date.now();
      userActivityAPI.ping().catch(err => console.error("Activity ping failed:", err));
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('mousedown', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Auto-refresh all users' working hours every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      allUsers.forEach(user => {
        loadUserWorkingHours(user.id);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [allUsers]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActiveSessions(),
        loadAllUsers(),
        loadCurrentUserSession()
      ]);
      
      // Load working hours for all users
      const users = await userAPI.getAll();
      const usersArray = Array.isArray(users) ? users : [];
      usersArray.forEach(user => {
        loadUserWorkingHours(user.id);
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      setRefreshing(true);
      const sessions = await timeTrackingAPI.getAllActive();
      const sessionsArray = Array.isArray(sessions) ? sessions : [];
      
      // Check for new users coming online
      if (sessionsArray.length > previousActiveCount) {
        // New user came online - could add notification here
        console.log("New user came online!");
      }
      setPreviousActiveCount(sessionsArray.length);
      
      setActiveSessions(sessionsArray);
    } catch (error) {
      console.error("Error loading active sessions:", error);
      setActiveSessions([]);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await userAPI.getAll();
      const usersArray = Array.isArray(users) ? users : [];
      setAllUsers(usersArray);
    } catch (error) {
      console.error("Error loading users:", error);
      setAllUsers([]);
    }
  };

  const loadCurrentUserSession = async () => {
    try {
      const session = await timeTrackingAPI.getCurrentSession();
      setCurrentUserSession(session);
    } catch (error) {
      console.error("Error loading current session:", error);
      setCurrentUserSession(null);
    }
  };


  const loadUserWorkingHours = async (userId) => {
    try {
      const data = await timeTrackingAPI.getTotalWorkingMinutesToday(userId);
      setUserWorkingHours(prev => ({
        ...prev,
        [userId]: data
      }));
    } catch (error) {
      console.error("Error loading working hours:", error);
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateCurrentWorkingTime = (loginTime) => {
    if (!loginTime) return 0;
    const login = new Date(loginTime);
    const now = new Date();
    const diffMs = now - login;
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  };


  // Status indicator component
  const getStatusIndicator = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONLINE':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-sm"></div>;
      case 'AWAY':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>;
      case 'OFFLINE':
        return <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONLINE':
        return 'text-green-600';
      case 'AWAY':
        return 'text-yellow-600';
      case 'OFFLINE':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONLINE':
        return 'Online';
      case 'AWAY':
        return 'Away';
      case 'OFFLINE':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  // Calculate statistics
  const onlineCount = activeSessions.filter(s => s.status === 'ONLINE').length;
  const awayCount = activeSessions.filter(s => s.status === 'AWAY').length;
  const totalWorkingMinutes = activeSessions.reduce((sum, s) => sum + calculateCurrentWorkingTime(s.loginTime), 0);
  const avgWorkingHours = activeSessions.length > 0 ? Math.round(totalWorkingMinutes / activeSessions.length / 60 * 10) / 10 : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
              <p className="text-gray-600 mt-1">Monitor active users, working hours, and login/logout times</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                <div className="text-sm font-semibold text-gray-700 tabular-nums">
                  {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-green-700">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Stats Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-1">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Active Users:</span>
              <span className="text-lg font-semibold text-gray-900">{activeSessions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Online:</span>
              <span className="text-lg font-semibold text-green-600">{onlineCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Away:</span>
              <span className="text-lg font-semibold text-yellow-600">{awayCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Avg. Hours:</span>
              <span className="text-lg font-semibold text-blue-600">{avgWorkingHours}h</span>
            </div>
          </div>
        </div>

        {/* Current User Session Card */}
        {currentUserSession && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaUser className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Your Current Session</h3>
                  <p className="text-xs text-gray-500">{currentUserSession.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Login:</span> {formatTime(currentUserSession.loginTime)}
                </div>
                {currentUserSession.isActive && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaClock className="text-blue-600" />
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {formatDuration(calculateCurrentWorkingTime(currentUserSession.loginTime))}
                    </span>
                  </div>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentUserSession.status === 'ONLINE'
                    ? 'bg-green-100 text-green-800'
                    : currentUserSession.status === 'AWAY'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusLabel(currentUserSession.status || 'OFFLINE')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Active Users
          </h2>
          <button
            onClick={loadActiveSessions}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <FaSync className="mr-2" />
                Refresh
              </>
            )}
          </button>
        </div>

        {/* Active Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading active sessions...</p>
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <FaUser className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Active Users</h3>
              <p className="text-gray-500 max-w-md mx-auto">No users are currently working. Users will appear here when they log in.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Login Time
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Working Hours
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSessions.map((session, index) => {
                    const workingMinutes = calculateCurrentWorkingTime(session.loginTime);
                    return (
                      <tr 
                        key={session.id} 
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 relative">
                              <span className="text-blue-800 font-medium">{session.username?.charAt(0).toUpperCase() || 'U'}</span>
                              <div className="absolute -top-1 -right-1">
                                {getStatusIndicator(session.status || 'ONLINE')}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{session.username}</div>
                              <div className="text-sm text-gray-500">{session.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900 font-medium">{session.role || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {formatTime(session.loginTime)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FaClock className="text-blue-600" />
                            <span className="font-semibold text-gray-900 tabular-nums">
                              {formatDuration(workingMinutes)}
                            </span>
                            <span className="text-xs text-green-600 font-medium">● LIVE</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'ONLINE'
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'AWAY'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusLabel(session.status || 'ONLINE')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Users Section */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">
              All Users
            </h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Login Time
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Working Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => {
                    const userSession = activeSessions.find(s => s.userId === user.id);
                    const userStatus = userSession?.status || 'OFFLINE';
                    const workingHours = userWorkingHours[user.id];
                    const isActive = !!userSession;
                    
                    return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-50 transition-colors duration-150 ${isActive ? 'bg-green-50/30' : ''}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 relative">
                              <span className="text-blue-800 font-medium">{user.username?.charAt(0).toUpperCase() || 'U'}</span>
                              <div className="absolute -top-1 -right-1">
                                {getStatusIndicator(userStatus)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900 font-medium">{user.role || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userStatus === 'ONLINE'
                              ? 'bg-green-100 text-green-800'
                              : userStatus === 'AWAY'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusLabel(userStatus)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {userSession ? formatTime(userSession.loginTime) : 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            {userSession ? (
                              <>
                                <FaClock className="text-blue-600" />
                                <span className="font-semibold text-gray-900 tabular-nums">
                                  {formatDuration(calculateCurrentWorkingTime(userSession.loginTime))}
                                </span>
                                <span className="text-xs text-green-600 font-medium">● LIVE</span>
                              </>
                            ) : workingHours ? (
                              <span className="text-gray-700 tabular-nums">
                                {formatDuration(workingHours.totalMinutes)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TimeTracking;

// Add custom scrollbar styles
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #14b8a6, #0d9488);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #0d9488, #0f766e);
  }
`;
document.head.appendChild(style);

