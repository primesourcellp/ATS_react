import React, { useEffect, useState } from "react";
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
  FaBell,
  FaArrowUp,
  FaArrowDown,
  FaGlobe
} from "react-icons/fa";
import { notificationAPI } from "../api/notificationApi";

// Desktop Navigation Component
const DesktopNav = ({ role, currentPath }) => {
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaChartLine className="text-lg" /> },
    { name: "Jobs", path: "/jobs", icon: <FaBriefcase className="text-lg" /> },
    { name: "Candidates", path: "/Candidates", icon: <FaUsers className="text-lg" /> },
    { name: "Applications", path: "/applications", icon: <FaFileAlt className="text-lg" /> },
    { name: "Interviews", path: "/Interviews", icon: <FaCalendarCheck className="text-lg" /> },
    { name: "Clients", path: "/clients", icon: <FaUser className="text-lg" /> },
    { name: "Website Applications", path: "/wesiteapplication", icon: <FaGlobe className="text-lg" /> },
    { name: "Notifications", path: "/notifications", icon: <FaBell className="text-lg" /> },
  ];

  if (role === "ADMIN") {
    navItems.push({ 
      name: "User Management", 
      path: "/Users", 
      icon: <FaUserCog className="text-lg" /> 
    });
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-800 shadow-xl rounded-r-2xl transition-all duration-300 border-r border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <FaCubes className="text-indigo-500 dark:text-indigo-300" /> ATS
        </h1>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item, idx) => (
          <a
            key={idx}
            href={item.path}
            className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentPath === item.path
                ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center px-2 py-3 text-gray-600 dark:text-gray-300">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-200 font-bold shadow-inner">
              {role.charAt(0)}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">User Account</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Mobile Navigation Component
const MobileNav = ({ role, mobileNavOpen, setMobileNavOpen, currentPath }) => {
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaChartLine className="text-lg" /> },
    { name: "Jobs", path: "/jobs", icon: <FaBriefcase className="text-lg" /> },
    { name: "Candidates", path: "/Candidates", icon: <FaUsers className="text-lg" /> },
    { name: "Applications", path: "/applications", icon: <FaFileAlt className="text-lg" /> },
    { name: "Interviews", path: "/interview", icon: <FaCalendarCheck className="text-lg" /> },
    { name: "Clients", path: "/clients", icon: <FaUser className="text-lg" /> },
    { name: "Notifications", path: "/notifications", icon: <FaBell className="text-lg" /> },
  ];

  if (role === "ADMIN") {
    navItems.push({ 
      name: "User Management", 
      path: "/user", 
      icon: <FaUserCog className="text-lg" /> 
    });
  }

  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-50 p-4 rounded-r-2xl transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-gray-700">
              <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                <FaCubes className="mr-2" /> ATS
              </h2>
              <button onClick={() => setMobileNavOpen(false)}>
                <FaTimes className="text-xl text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400" />
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.path}
                  className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                    currentPath === item.path
                      ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                      : "text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </a>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-2 py-3 text-gray-600 dark:text-gray-300">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-200 font-bold">
                    {role.charAt(0)}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">User Account</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role.toLowerCase()}</p>
                </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Header Component
const Header = ({ role, handleLogout, setMobileNavOpen }) => {
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

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm lg:px-6 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center">
        <button className="lg:hidden text-gray-600 dark:text-gray-300 mr-4" onClick={() => setMobileNavOpen(true)}>
          <FaBars className="text-xl" />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            className="bell-button text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 relative transition-colors duration-200"
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
            <div className="notification-dropdown absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  <button 
                    onClick={() => setShowNotificationDropdown(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
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
                    className="w-full text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
              
            </div>
          )}
        </div>
        
        <div className="hidden md:flex items-center space-x-2 bg-indigo-50 dark:bg-gray-700 rounded-lg px-3 py-1.5">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              role === "ADMIN"
                ? "text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900"
                : "text-blue-800 bg-blue-100 dark:text-blue-300 dark:bg-blue-900"
            }`}
          >
            {role}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">|</span>
          <button className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center transition-colors duration-200">
            Admin User <FaChevronDown className="ml-1 text-xs" />
          </button>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 p-2"
          title="Logout"
        >
          <FaSignOutAlt className="text-xl" />
        </button>
      </div>
    </header>
  );
};

// Stat Card Component
const StatCard = ({ icon, value, label, change, color, loading }) => {
  const colorClasses = {
    blue: { 
      bg: "bg-blue-50 dark:bg-blue-900/20", 
      text: "text-blue-600 dark:text-blue-400",
      changeText: "text-blue-500" 
    },
    green: { 
      bg: "bg-green-50 dark:bg-green-900/20", 
      text: "text-green-600 dark:text-green-400",
      changeText: "text-green-500" 
    },
    yellow: { 
      bg: "bg-yellow-50 dark:bg-yellow-900/20", 
      text: "text-yellow-600 dark:text-yellow-400",
      changeText: "text-yellow-500" 
    },
    indigo: { 
      bg: "bg-indigo-50 dark:bg-indigo-900/20", 
      text: "text-indigo-600 dark:text-indigo-400",
      changeText: "text-indigo-500" 
    },
  };

  const changeValue = change || 0;
  const isPositive = changeValue >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center z-10">
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
        <div className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? "--" : value}</div>
        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">{label}</div>
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, text, btn, link, icon }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center mb-5">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="ml-4 text-md font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm flex-grow mb-5">{text}</p>
      <a
        href={link}
        className="self-start flex items-center px-4 py-2.5 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xs group-hover:gap-2 gap-1"
      >
        {btn} <FaArrowUp className="rotate-45 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </a>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [role, setRole] = useState("");
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
  const [cards, setCards] = useState([]);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentDate, setCurrentDate] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const userRole = localStorage.getItem("role");
    if (!userRole) {
      alert("User role not found. Please log in again.");
      window.location.href = "/";
      return;
    }
    setRole(userRole);

    // Set current date
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    const baseCards = [
      {
        title: "Job Listings",
        text: "View and manage all job postings.",
        btn: "View Jobs",
        link: "/jobs",
        icon: <FaBriefcase className="text-md" />,
      },
      {
        title: "Candidates",
        text: "Browse and manage all candidates.",
        btn: "View Candidates",
        link: "/Candidates",
        icon: <FaUsers className="text-md" />,
      },
      {
        title: "Applications",
        text: "Track candidate application statuses.",
        btn: "Track Apps",
        link: "/Applications",
        icon: <FaFileAlt className="text-md" />,
      },
      {
        title: "Interviews",
        text: "View and schedule interviews.",
        btn: "View Interviews",
        link: "/Interviews",
        icon: <FaCalendarCheck className="text-md" />,
      },
      {
        title: "Clients",
        text: "Manage all client details.",
        btn: "View Clients",
        link: "/Clients",
        icon: <FaUser className="text-md" />,
      },
    ];

    if (userRole === "ADMIN") {
      baseCards.push({
        title: "User Management",
        text: "Manage admin and recruiter accounts.",
        btn: "Manage Users",
        link: "/Users",
        icon: <FaUserCog className="text-md" />,
      });
    }

    setCards(baseCards);
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

        const [jobsRes, candidatesRes, interviewsRes, applicationsRes] = await Promise.all([
          fetch("http://localhost:8080/jobs/counts", { headers }),
          fetch("http://localhost:8080/api/candidates/count", { headers }),
          fetch("http://localhost:8080/api/interviews/count/today", { headers }),
          fetch("http://localhost:8080/api/applications/count", { headers }),
        ]);

        const newJobs = jobsRes.ok ? await jobsRes.json() : "--";
        const newCandidates = candidatesRes.ok ? await candidatesRes.json() : "--";
        const newInterviews = interviewsRes.ok ? await interviewsRes.json() : "--";
        const newApplications = applicationsRes.ok ? await applicationsRes.json() : "--";

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

  const handleLogout = async () => {
    const token = localStorage.getItem("jwtToken");
    localStorage.clear();

    if (token) {
      try {
        await fetch("http://localhost:8080/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Server logout failed:", err);
      }
    }
    window.location.href = "/";
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      {/* Desktop Navigation */}
      <DesktopNav role={role} currentPath={currentPath} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header role={role} handleLogout={handleLogout} setMobileNavOpen={setMobileNavOpen} />
        
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back! Here's what's happening with your candidates today.</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{currentDate}</p>
              </div>
              
            </div>

            {/* Quick Stats */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <FaChartLine className="text-indigo-500" /> Key Metrics
                <span className="text-xs text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                  Live Updates
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                  icon={<FaBriefcase />} 
                  value={stats.jobs} 
                  label="Active Jobs" 
                  change={trends.jobs}
                  color="blue" 
                  loading={loading}
                />
                <StatCard 
                  icon={<FaUsers />} 
                  value={stats.candidates} 
                  label="Total Candidates" 
                  change={trends.candidates}
                  color="green" 
                  loading={loading}
                />
                <StatCard 
                  icon={<FaFileAlt />} 
                  value={stats.applications} 
                  label="Applications" 
                  change={trends.applications}
                  color="yellow" 
                  loading={loading}
                />
                <StatCard 
                  icon={<FaCalendarCheck />} 
                  value={stats.interviews} 
                  label="Interviews Today" 
                  change={trends.interviews}
                  color="indigo" 
                  loading={loading}
                />
              </div>
            </div>

            {/* Dashboard Cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                  <DashboardCard
                    key={idx}
                    title={card.title}
                    text={card.text}
                    btn={card.btn}
                    link={card.link}
                    icon={card.icon}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;