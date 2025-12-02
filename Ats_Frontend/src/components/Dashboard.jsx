import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaCubes,
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaCalendarCheck,
  FaUser,
  FaUserCog,
  FaSignOutAlt,
  FaChartLine,
  FaChevronDown,
  FaChevronRight,
  FaBell,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight,
  FaGlobe,
  FaChartBar,
  FaEnvelope
} from "react-icons/fa";
import { notificationAPI, jobAPI, candidateAPI, interviewAPI, applicationAPI, authAPI } from "../api/api";
import logo from "../assets/logo.png";

// Desktop Navigation Component
const normalizeRole = (role) => (role || "").replace("ROLE_", "");

const DesktopNav = ({ role, currentPath }) => {
  const normalizedRole = normalizeRole(role);
  const navItems = [
    { name: "Jobs", path: "/jobs", icon: <FaBriefcase className="text-lg" /> },
    { name: "Clients", path: "/clients", icon: <FaUser className="text-lg" /> },
    { name: "Candidates", path: "/Candidates", icon: <FaUsers className="text-lg" /> },
    { name: "Interviews", path: "/Interviews", icon: <FaCalendarCheck className="text-lg" /> },
    { name: "Applications", path: "/applications", icon: <FaFileAlt className="text-lg" /> },
  ];

  if (["ADMIN", "SECONDARY_ADMIN", "RECRUITER"].includes(normalizedRole.toUpperCase())) {
    navItems.push({
      name: "Reports",
      path: "/reports",
      icon: <FaChartBar className="text-lg" />
    });
  }

  if (normalizedRole.toUpperCase().includes("ADMIN")) {
    navItems.push({ 
      name: "User Management", 
      path: "/Users", 
      icon: <FaUserCog className="text-lg" /> 
    });
    navItems.push({ 
      name: "Account Manager", 
      path: "/account-manager", 
      icon: <FaUserCog className="text-lg" /> 
    });
    navItems.push({ 
      name: "Candidate Email", 
      path: "/candidate-emails", 
      icon: <FaEnvelope className="text-lg" />,
      hasDropdown: true
    });
    navItems.push({ 
      name: "Website Applications", 
      path: "/wesiteapplication", 
      icon: <FaGlobe className="text-lg" /> 
    });
  } else if (normalizedRole.toUpperCase() === "RECRUITER") {
    navItems.push({ 
      name: "Website Applications", 
      path: "/wesiteapplication", 
      icon: <FaGlobe className="text-lg" /> 
    });
  }

  // Sort by text length, but keep Dashboard first
  navItems.sort((a, b) => {
    if (a.name === "Dashboard") return -1;
    if (b.name === "Dashboard") return 1;
    return a.name.length - b.name.length;
  });

  // Add Dashboard at the beginning
  navItems.unshift({ name: "Dashboard", path: "/dashboard", icon: <FaChartLine className="text-lg" /> });

  return (
    <aside className="hidden lg:flex flex-col w-66 bg-white shadow-xl rounded-r-2xl transition-all duration-300 border-r border-gray-100">
      <div className="flex items-center justify-center h-20 border-b border-gray-200 px-4">
        <img 
          src={logo} 
          alt="ATS Logo" 
          className="h-14 w-auto object-contain mx-auto"
        />
      </div>
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, idx) => (
          <a
            key={idx}
            href={item.path}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentPath === item.path
                ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <div className="flex items-center">
              <span className="mr-3">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            {item.hasDropdown && (
              <FaChevronRight className="text-xs ml-2" />
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
};

// Mobile Navigation Component
const MobileNav = ({ role, mobileNavOpen, setMobileNavOpen, currentPath }) => {
    const normalizedRole = normalizeRole(role);
  const navItems = [
    { name: "Jobs", path: "/jobs", icon: <FaBriefcase className="text-lg" /> },
    { name: "Clients", path: "/clients", icon: <FaUser className="text-lg" /> },
    { name: "Candidates", path: "/Candidates", icon: <FaUsers className="text-lg" /> },
    { name: "Interviews", path: "/Interviews", icon: <FaCalendarCheck className="text-lg" /> },
    { name: "Applications", path: "/applications", icon: <FaFileAlt className="text-lg" /> },
  ];

  if (["ADMIN", "SECONDARY_ADMIN", "RECRUITER"].includes(normalizedRole.toUpperCase())) {
    navItems.push({
      name: "Reports",
      path: "/reports",
      icon: <FaChartBar className="text-lg" />
    });
  }

  if (normalizedRole.toUpperCase().includes("ADMIN")) {
    navItems.push({ 
      name: "User Management", 
      path: "/Users", 
      icon: <FaUserCog className="text-lg" /> 
    });
    navItems.push({ 
      name: "Account Manager", 
      path: "/account-manager", 
      icon: <FaUserCog className="text-lg" /> 
    });
    navItems.push({ 
      name: "Candidate Emails", 
      path: "/candidate-emails", 
      icon: <FaEnvelope className="text-lg" /> 
    });
    navItems.push({ 
      name: "Website Applications", 
      path: "/wesiteapplication", 
      icon: <FaGlobe className="text-lg" /> 
    });
  } else if (normalizedRole.toUpperCase() === "RECRUITER") {
    navItems.push({ 
      name: "Website Applications", 
      path: "/wesiteapplication", 
      icon: <FaGlobe className="text-lg" /> 
    });
  }

  // Sort by text length, but keep Dashboard first
  navItems.sort((a, b) => {
    if (a.name === "Dashboard") return -1;
    if (b.name === "Dashboard") return 1;
    return a.name.length - b.name.length;
  });

  // Add Dashboard at the beginning
  navItems.unshift({ name: "Dashboard", path: "/dashboard", icon: <FaChartLine className="text-lg" /> });

  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="fixed top-0 left-0 h-full w-66 bg-white shadow-xl z-50 flex flex-col rounded-r-2xl transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4 p-4 flex-shrink-0">
              <img 
                src={logo} 
                alt="ATS Logo" 
                className="h-10 w-auto object-contain"
              />
              <button onClick={() => setMobileNavOpen(false)}>
                <FaTimes className="text-xl text-gray-600 hover:text-indigo-600" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-2">
              {navItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.path}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                    currentPath === item.path
                      ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                      : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {item.hasDropdown && (
                    <FaChevronRight className="text-xs ml-2" />
                  )}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

// Header Component
const Header = ({ role, handleLogout, setMobileNavOpen, displayName }) => {
  const navigate = useNavigate();
  const normalizedRole = normalizeRole(role);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) return;

        const [allNotifications, unreadCountResponse] = await Promise.all([
          notificationAPI.getAll(),
          notificationAPI.getUnreadCount()
        ]);
        
        setNotifications(allNotifications || []);
        // Extract count from response object if it's an object, otherwise use the value directly
        const count = typeof unreadCountResponse === 'object' && unreadCountResponse.count !== undefined 
          ? unreadCountResponse.count 
          : unreadCountResponse || 0;
        setUnreadCount(count);
        
        console.log("🔔 Dashboard: Notifications:", allNotifications);
        console.log("🔔 Dashboard: Unread count:", unreadCountResponse);
        console.log("🔔 Dashboard: Extracted count:", count);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationDropdown && 
          !event.target.closest('.notification-dropdown') && 
          !event.target.closest('.bell-button')) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationDropdown]);

  // Handle notification click - navigate to website application
  const handleNotificationClick = async (notification) => {
    // Mark notification as read if not already read
    if (!notification.read) {
      try {
        await notificationAPI.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Close dropdown
    setShowNotificationDropdown(false);
    
    // Navigate to website application page
    window.location.href = '/wesiteapplication';
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm lg:px-6 border-b border-gray-100">
      <div className="flex items-center">
        <button className="lg:hidden text-gray-600 mr-4" onClick={() => setMobileNavOpen(true)}>
          <FaBars className="text-xl" />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            className="bell-button text-gray-500 hover:text-indigo-600 p-2 relative transition-colors duration-200"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotificationDropdown && (
            <div className="notification-dropdown absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                  <button 
                    onClick={() => setShowNotificationDropdown(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-100 transition-colors duration-200 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-800">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      // Clear all notifications
                      const clearAllNotifications = async () => {
                        try {
                          // Delete each notification individually
                          for (const notification of notifications) {
                            await notificationAPI.delete(notification.id);
                          }
                          // Refresh notifications
                          const fetchNotifications = async () => {
                            try {
                              const [allNotifications, unreadCountResponse] = await Promise.all([
                                notificationAPI.getAll(),
                                notificationAPI.getUnreadCount()
                              ]);
                              setNotifications(allNotifications || []);
                              // Extract count from response object if it's an object, otherwise use the value directly
                              const count = typeof unreadCountResponse === 'object' && unreadCountResponse.count !== undefined 
                                ? unreadCountResponse.count 
                                : unreadCountResponse || 0;
                              setUnreadCount(count);
                            } catch (error) {
                              console.error("Error refreshing notifications:", error);
                            }
                          };
                          fetchNotifications();
                        } catch (error) {
                          console.error("Error clearing notifications:", error);
                        }
                      };
                      clearAllNotifications();
                    }}
                    className="w-full text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
              
            </div>
          )}
        </div>
        
        <div className="hidden md:flex items-center space-x-2 bg-indigo-50 rounded-lg px-3 py-1.5">
          {normalizedRole.toUpperCase().includes("ADMIN") && (
            <button
              onClick={() => navigate("/Users")}
              className="mr-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-100 rounded-full px-3 py-1 transition-colors duration-200"
            >
              <FaUserCog className="text-sm" />
              Manage Users
            </button>
          )}
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              normalizedRole.toUpperCase() === "ADMIN"
                ? "text-red-800 bg-red-100"
                : "text-blue-800 bg-blue-100"
            }`}
          >
            {normalizedRole || "User"}
          </span>
          <span className="text-sm text-gray-600">|</span>
          <button className="text-gray-600 hover:text-indigo-600 text-sm flex items-center transition-colors duration-200">
            {displayName || "User"} <FaChevronDown className="ml-1 text-xs" />
          </button>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 p-2"
          title="Logout"
        >
          <FaSignOutAlt className="text-xl" />
        </button>
      </div>
    </header>
  );
};

// Stat Card Component
const StatCard = ({ icon, value, label, change, color, loading, onClick }) => {
  const colorClasses = {
    blue: { 
      bg: "bg-blue-50", 
      text: "text-blue-600",
      changeText: "text-blue-500" 
    },
    green: { 
      bg: "bg-green-50", 
      text: "text-green-600",
      changeText: "text-green-500" 
    },
    yellow: { 
      bg: "bg-yellow-50", 
      text: "text-yellow-600",
      changeText: "text-yellow-500" 
    },
    indigo: { 
      bg: "bg-indigo-50", 
      text: "text-indigo-600",
      changeText: "text-indigo-500" 
    },
  };

  const changeValue = change || 0;
  const isPositive = changeValue >= 0;

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:scale-[1.02]' : ''
      }`}
    >
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color].bg} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
          {React.cloneElement(icon, { className: `text-xl ${colorClasses[color].text}` })}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
            {Math.abs(changeValue)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{loading ? "--" : value}</div>
        <div className="text-gray-500 text-sm font-medium mt-1">{label}</div>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ icon, label, path, color = "indigo" }) => {
  const navigate = useNavigate();
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
    teal: "bg-teal-50 text-teal-600 hover:bg-teal-100",
  };

  return (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-lg hover:scale-105 group ${colorClasses[color]}`}
    >
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-800">{label}</span>
    </button>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [role, setRole] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState({
    jobs: "--",
    candidates: "--",
    interviews: "--",
    applications: "--",
  });
  const [previousStats, setPreviousStats] = useState({
    jobs: 0,
    candidates: 0,
    interviews: 0,
    applications: 0,
  });
  const [trends, setTrends] = useState({
    jobs: 0,
    candidates: 0,
    interviews: 0,
    applications: 0,
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentDate, setCurrentDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [todayInterviews, setTodayInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  // Function to calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (!storedRole) {
      alert("User role not found. Please log in again.");
      window.location.href = "/";
      return;
    }
    const normalizedRole = normalizeRole(storedRole);
    setRole(normalizedRole);
    const storedUsername = localStorage.getItem("username") || "";
    setDisplayName(storedUsername);

    // Set current date
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("jwtToken");
        if (!token) throw new Error("Authentication token missing");

        const headers = { Authorization: `Bearer ${token}` };
        
        // Store current stats as previous before fetching new ones
        const currentStats = {
          jobs: typeof stats.jobs === 'number' ? stats.jobs : 0,
          candidates: typeof stats.candidates === 'number' ? stats.candidates : 0,
          interviews: typeof stats.interviews === 'number' ? stats.interviews : 0,
          applications: typeof stats.applications === 'number' ? stats.applications : 0,
        };

        const [newJobs, newCandidates, newInterviews, newApplications] = await Promise.all([
          jobAPI.getCount().catch(() => "--"),
          candidateAPI.getCount().catch(() => "--"),
          interviewAPI.getCount().catch(() => "--"),
          applicationAPI.getCount().catch(() => "--"),
        ]);

        // Calculate trends based on previous values
        const newTrends = {
          jobs: calculatePercentageChange(newJobs, currentStats.jobs),
          candidates: calculatePercentageChange(newCandidates, currentStats.candidates),
          interviews: calculatePercentageChange(newInterviews, currentStats.interviews),
          applications: calculatePercentageChange(newApplications, currentStats.applications),
        };

        setStats({
          jobs: newJobs,
          candidates: newCandidates,
          interviews: newInterviews,
          applications: newApplications,
        });

        setTrends(newTrends);
        setLoading(false);
      } catch (err) {
        console.error("Stats load error:", err);
        setStats({ jobs: "--", candidates: "--", interviews: "--", applications: "--" });
        setLoading(false);
      }
    };

    fetchStats();

    // Set up interval to fetch stats every 30 seconds for real-time updates
    const intervalId = setInterval(fetchStats, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Fetch today's interviews
  useEffect(() => {
    const fetchTodayInterviews = async () => {
      try {
        setLoadingInterviews(true);
        const allInterviews = await interviewAPI.getAll();
        
        // Get today's date in YYYY-MM-DD format
        const todayDate = new Date().toISOString().split('T')[0];
        
        // Filter interviews for today
        const today = allInterviews.filter(interview => {
          return interview.interviewDate === todayDate;
        });
        
        // Sort by interview time (earliest first)
        today.sort((a, b) => {
          if (a.interviewTime && b.interviewTime) {
            return a.interviewTime.localeCompare(b.interviewTime);
          }
          return 0;
        });
        
        setTodayInterviews(today);
        setLoadingInterviews(false);
      } catch (err) {
        console.error("Error fetching today's interviews:", err);
        setTodayInterviews([]);
        setLoadingInterviews(false);
      }
    };

    fetchTodayInterviews();
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchTodayInterviews, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("jwtToken");
    localStorage.clear();

    if (token) {
      try {
        await authAPI.logout();
      } catch (err) {
        console.error("Server logout failed:", err);
      }
    }
    window.location.href = "/";
  };


  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Desktop Navigation */}
      <DesktopNav role={role} currentPath={currentPath} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          role={role}
          handleLogout={handleLogout}
          setMobileNavOpen={setMobileNavOpen}
          displayName={displayName}
        />
        
        {/* Mobile Navigation */}
        <MobileNav 
          role={role} 
          mobileNavOpen={mobileNavOpen} 
          setMobileNavOpen={setMobileNavOpen} 
          currentPath={currentPath}
        />

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard Overview</h1>
                <p className="text-gray-500 text-sm">Welcome back! Here's what's happening with your candidates today.</p>
                <p className="text-gray-400 text-xs mt-1">{currentDate}</p>
              </div>
              
            </div>

            {/* Quick Stats */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <FaChartLine className="text-indigo-500 text-sm" /> Key Metrics
                </h2>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Live Updates
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div 
                  onClick={() => navigate('/jobs')}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FaBriefcase className="text-blue-600 text-sm" />
                    </div>
                    {trends.jobs !== undefined && (
                      <div className={`flex items-center text-xs font-medium ${trends.jobs >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trends.jobs >= 0 ? <FaArrowUp className="text-xs mr-0.5" /> : <FaArrowDown className="text-xs mr-0.5" />}
                        {Math.abs(trends.jobs).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-0.5">{loading ? "--" : stats.jobs}</div>
                  <div className="text-xs text-gray-500 font-medium">Active Jobs</div>
                </div>
                <div 
                  onClick={() => navigate('/candidates')}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <FaUsers className="text-green-600 text-sm" />
                    </div>
                    {trends.candidates !== undefined && (
                      <div className={`flex items-center text-xs font-medium ${trends.candidates >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trends.candidates >= 0 ? <FaArrowUp className="text-xs mr-0.5" /> : <FaArrowDown className="text-xs mr-0.5" />}
                        {Math.abs(trends.candidates).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-0.5">{loading ? "--" : stats.candidates}</div>
                  <div className="text-xs text-gray-500 font-medium">Total Candidates</div>
                </div>
                <div 
                  onClick={() => navigate('/applications')}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                      <FaFileAlt className="text-yellow-600 text-sm" />
                    </div>
                    {trends.applications !== undefined && (
                      <div className={`flex items-center text-xs font-medium ${trends.applications >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trends.applications >= 0 ? <FaArrowUp className="text-xs mr-0.5" /> : <FaArrowDown className="text-xs mr-0.5" />}
                        {Math.abs(trends.applications).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-0.5">{loading ? "--" : stats.applications}</div>
                  <div className="text-xs text-gray-500 font-medium">Applications</div>
                </div>
                <div 
                  onClick={() => navigate('/Interviews')}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <FaCalendarCheck className="text-indigo-600 text-sm" />
                    </div>
                    {trends.interviews !== undefined && (
                      <div className={`flex items-center text-xs font-medium ${trends.interviews >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trends.interviews >= 0 ? <FaArrowUp className="text-xs mr-0.5" /> : <FaArrowDown className="text-xs mr-0.5" />}
                        {Math.abs(trends.interviews).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-0.5">{loading ? "--" : stats.interviews}</div>
                  <div className="text-xs text-gray-500 font-medium">Interviews Today</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FaCubes className="text-indigo-500" /> Quick Actions
              </h2>
              <div className={`grid grid-cols-1 gap-4 ${!loadingInterviews && todayInterviews.length > 0 ? 'lg:grid-cols-3' : ''}`}>
                {/* Quick Action Buttons */}
                <div className={!loadingInterviews && todayInterviews.length > 0 ? 'lg:col-span-2' : ''}>
                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${!loadingInterviews && todayInterviews.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-6'}`}>
                    <QuickActionButton
                      icon={<FaBriefcase />}
                      label="Jobs"
                      path="/jobs"
                      color="blue"
                    />
                    <QuickActionButton
                      icon={<FaUsers />}
                      label="Candidates"
                      path="/Candidates"
                      color="green"
                    />
                    <QuickActionButton
                      icon={<FaFileAlt />}
                      label="Applications"
                      path="/applications"
                      color="yellow"
                    />
                    <QuickActionButton
                      icon={<FaCalendarCheck />}
                      label="Interviews"
                      path="/Interviews"
                      color="indigo"
                    />
                    <QuickActionButton
                      icon={<FaUser />}
                      label="Clients"
                      path="/clients"
                      color="teal"
                    />
                    <QuickActionButton
                      icon={<FaGlobe />}
                      label="Website Apps"
                      path="/wesiteapplication"
                      color="purple"
                    />
                    {role && ["ADMIN", "SECONDARY_ADMIN", "RECRUITER"].includes(role.toUpperCase()) && (
                      <QuickActionButton
                        icon={<FaChartBar />}
                        label="Reports"
                        path="/reports"
                        color="indigo"
                      />
                    )}
                    {role && role.toUpperCase().includes("ADMIN") && (
                      <>
                        <QuickActionButton
                          icon={<FaUserCog />}
                          label="Users"
                          path="/Users"
                          color="purple"
                        />
                        <QuickActionButton
                          icon={<FaUserCog />}
                          label="Account Manager"
                          path="/account-manager"
                          color="teal"
                        />
                        <QuickActionButton
                          icon={<FaEnvelope />}
                          label="Candidate Emails"
                          path="/candidate-emails"
                          color="orange"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Today's Interviews */}
                {!loadingInterviews && todayInterviews.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <FaCalendarCheck className="text-indigo-500 text-xs" />
                        Today's Interviews
                      </h3>
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                        {todayInterviews.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {todayInterviews.slice(0, 5).map((interview) => {
                        const getJobTitle = (interview) => {
                          if (interview.jobTitle) return interview.jobTitle;
                          if (interview.application?.job?.jobTitle) return interview.application.job.jobTitle;
                          if (interview.job?.jobTitle) return interview.job.jobTitle;
                          return 'N/A';
                        };
                        
                        const getClientName = (interview) => {
                          if (interview.clientName) return interview.clientName;
                          if (interview.application?.job?.client?.clientName) return interview.application.job.client.clientName;
                          return '';
                        };
                        
                        const formatTime = (time) => {
                          if (!time) return '';
                          const [hours, minutes] = time.split(':');
                          const hour12 = parseInt(hours) % 12 || 12;
                          const ampm = parseInt(hours) >= 12 ? 'pm' : 'am';
                          return `${hour12}:${minutes} ${ampm}`;
                        };
                        
                        const jobTitle = getJobTitle(interview);
                        const clientName = getClientName(interview);
                        const startTime = formatTime(interview.interviewTime);
                        const endTime = interview.endTime ? formatTime(interview.endTime) : '';
                        const jobDisplay = clientName ? `${jobTitle} - ${clientName}` : jobTitle;
                        const displayText = endTime ? `${startTime} ${jobDisplay} - ${endTime}` : `${startTime} ${jobDisplay}`;
                        
                        return (
                          <div
                            key={interview.id}
                            onClick={() => navigate(`/interviews/${interview.id}`)}
                            className="flex items-center p-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors group border border-transparent hover:border-indigo-200"
                          >
                            <div className="text-xs font-medium text-gray-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                              {displayText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {todayInterviews.length > 5 && (
                      <button
                        onClick={() => navigate('/Interviews')}
                        className="mt-2 w-full text-xs text-indigo-600 hover:text-indigo-700 font-medium text-center"
                      >
                        View all {todayInterviews.length} interviews
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;