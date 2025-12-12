import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaCubes,
  FaChartLine,
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaCalendarCheck,
  FaUser,
  FaGlobe,
  FaUserCog,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaChartBar,
  FaEnvelope,
  FaClock
} from "react-icons/fa";
import { authAPI } from "../api/api";

const Navbar = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname.toLowerCase());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const adminDropdownRef = useRef(null);

  useEffect(() => {
    const userRole = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setRole(userRole);
  }, []);

  useEffect(() => {
    setCurrentPath(location.pathname.toLowerCase());
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    };

    if (adminDropdownOpen) {
      // Delay adding listener to avoid immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [adminDropdownOpen]);

  const handleLogout = async () => {
    const token = localStorage.getItem("jwtToken");
    
    // Call logout API FIRST while token is still available
    if (token) {
      try {
        await authAPI.logout();
      } catch (err) {
        console.error("Server logout failed:", err);
      }
    }
    
    // Clear local storage AFTER API call
    localStorage.clear();
    window.location.href = "/"; // redirect to login page
  };


  const normalizedRole = (role || "").toUpperCase();

  // Main navigation items - always visible
  const mainNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaChartLine className="text-sm" /> },
    { name: "Jobs", path: "/jobs", icon: <FaBriefcase className="text-sm" /> },
    { name: "Clients", path: "/clients", icon: <FaUser className="text-sm" /> },
    { name: "Candidates", path: "/candidates", icon: <FaUsers className="text-sm" /> },
    { name: "Interviews", path: "/interviews", icon: <FaCalendarCheck className="text-sm" /> },
    { name: "Applications", path: "/applications", icon: <FaFileAlt className="text-sm" /> },
  ];

  if (["ADMIN", "SECONDARY_ADMIN", "RECRUITER"].includes(normalizedRole)) {
    mainNavItems.push({ name: "Reports", path: "/reports", icon: <FaChartBar className="text-sm" /> });
  }

  // Add Time Tracking only for admins
  if (normalizedRole.includes("ADMIN")) {
    mainNavItems.push({ name: "Time Tracking", path: "/time-tracking", icon: <FaClock className="text-sm" /> });
  }

  // Dropdown items for ADMIN
  const adminDropdownItems = [];
  if (normalizedRole.includes("ADMIN")) {
    adminDropdownItems.push(
      { name: "User Management", path: "/Users", icon: <FaUserCog className="text-sm" /> },
      { name: "Website Applications", path: "/wesiteapplication", icon: <FaGlobe className="text-sm" /> },
      { name: "Candidate Email", path: "/candidate-emails", icon: <FaEnvelope className="text-sm" /> },
      { name: "Account Manager", path: "/account-manager", icon: <FaUserCog className="text-sm" /> }
    );
  } else if (normalizedRole === "RECRUITER") {
    adminDropdownItems.push(
      { name: "Website Applications", path: "/wesiteapplication", icon: <FaGlobe className="text-sm" /> }
    );
  }

  const username = localStorage.getItem("username") || "User";

  return (
    <>
      {/* Modern Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 shadow-lg z-30" style={{ backgroundColor: '#3A9188', overflow: 'visible' }}>
        <div className="h-full flex items-center justify-between px-4 lg:px-6" style={{ overflow: 'visible', position: 'relative' }}>
          {/* Left Section: Logo & Navigation */}
          <div className="flex items-center flex-1" style={{ position: 'relative', overflow: 'visible', zIndex: 50 }}>
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden text-white mr-3 p-2 hover:bg-white/20 rounded-lg transition-colors"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Toggle menu"
            >
              <FaBars className="text-lg" />
            </button>

            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate("/dashboard")}
            >
              <h1 className="text-white font-bold text-xl">TalentPrime</h1>
            </div>

            {/* Desktop Navigation - Main items always visible */}
            <nav className="hidden lg:flex items-center ml-8 space-x-1 overflow-x-auto scrollbar-hide" style={{ overflowY: 'visible', overflow: 'visible' }}>
              {mainNavItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    currentPath === item.path
                      ? "text-white bg-white/20 backdrop-blur-sm shadow-md"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => navigate(item.path)}
                  title={item.name}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
              
              {/* Admin Dropdown */}
              {adminDropdownItems.length > 0 && (
                <div className="relative" ref={adminDropdownRef}>
                  <button
                    type="button"
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 text-white/90 hover:bg-white/10 hover:text-white ${
                      adminDropdownItems.some(item => currentPath === item.path)
                        ? "bg-white/20 backdrop-blur-sm shadow-md"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAdminDropdownOpen(prev => !prev);
                    }}
                  >
                    <span>More</span>
                    <FaChevronDown className={`ml-2 text-xs transition-transform duration-200 ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {adminDropdownOpen && (
                    <div 
                      className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 border border-gray-200"
                      style={{ zIndex: 99999 }}
                      onClick={(e) => e.stopPropagation()}
                      role="menu"
                    >
                      {adminDropdownItems && adminDropdownItems.length > 0 ? adminDropdownItems.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${
                            currentPath === item.path
                              ? "bg-green-50 text-green-600 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(item.path);
                            setAdminDropdownOpen(false);
                          }}
                        >
                          <span className="mr-3">{item.icon}</span>
                          <span>{item.name}</span>
                        </button>
                      )) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No items available</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Right Section: User Info & Actions */}
          <div className="flex items-center space-x-3">
            {/* Username Display */}
            <div className="hidden md:flex items-center text-white/90 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-300 mr-2 animate-pulse"></div>
              <span className="text-sm font-medium">{username}</span>
            </div>

            {/* Role Badge */}
            <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
              role === 'ADMIN' 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'bg-white/15 text-white border border-white/25'
            }`}>
              {role || "User"}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button 
                className="flex items-center text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                  <FaUser className="text-sm" />
                </div>
                <FaChevronDown className={`ml-2 text-xs transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500 font-medium uppercase">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{username}</p>
                      <p className="text-xs text-gray-500 mt-1">{role || "User"}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <FaSignOutAlt className="mr-3 text-gray-400" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Removed since navigation is now in top navbar */}

      {/* Mobile Navigation */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="fixed top-0 left-0 h-full w-60 bg-white shadow-xl z-50 flex flex-col rounded-r-2xl transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4 p-4 flex-shrink-0">
              <h1 className="text-green-600 font-bold text-xl">TalentPrime</h1>
              <button onClick={() => setMobileNavOpen(false)}>
                <FaTimes className="text-xl text-gray-600 hover:text-green-600" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-2">
              {/* Main Navigation Items */}
              {mainNavItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    currentPath === item.path
                      ? "text-white bg-gradient-to-r from-green-600 to-teal-500 shadow-md"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                  }`}
                  onClick={() => {
                    navigate(item.path);
                    setMobileNavOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  </div>
                </button>
              ))}
              
              {/* Admin Dropdown Items */}
              {adminDropdownItems.length > 0 && (
                <>
                  <div className="px-4 py-2 mt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Tools</p>
                  </div>
                  {adminDropdownItems.map((item, idx) => (
                    <button
                      key={`admin-${idx}`}
                      type="button"
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        currentPath === item.path
                          ? "text-white bg-gradient-to-r from-green-600 to-teal-500 shadow-md"
                          : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        setMobileNavOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3 text-sm font-medium">{item.name}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </nav>

            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex items-center mt-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                  <FaUser className="text-green-600 text-xs" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900">{role || "User"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full mt-4 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <FaSignOutAlt className="mr-2 text-gray-500" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add padding to main content for top navbar */}
      <div className="pt-16"></div>
    </>
  );
};

export default Navbar;
