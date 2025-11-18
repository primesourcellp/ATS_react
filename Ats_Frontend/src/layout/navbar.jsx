import React, { useState, useEffect } from "react";
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
  FaSignOutAlt,
  FaChartBar
} from "react-icons/fa";
import { authAPI } from "../api/api";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname.toLowerCase());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userRole = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setRole(userRole);
  }, []);

  useEffect(() => {
    setCurrentPath(location.pathname.toLowerCase());
  }, [location.pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem("jwtToken");
    localStorage.clear(); // Clear all local storage

    if (token) {
      try {
        await authAPI.logout();
      } catch (err) {
        console.error("Server logout failed:", err);
      }
    }
    window.location.href = "/"; // redirect to login page
  };


  const normalizedRole = (role || "").toUpperCase();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaChartLine className="text-sm" /> },
    { name: "Jobs", path: "/jobs", icon: <FaBriefcase className="text-sm" /> },
    { name: "Candidates", path: "/candidates", icon: <FaUsers className="text-sm" /> },
    { name: "Applications", path: "/applications", icon: <FaFileAlt className="text-sm" /> },
    { name: "Interviews", path: "/interviews", icon: <FaCalendarCheck className="text-sm" /> },
    { name: "Clients", path: "/clients", icon: <FaUser className="text-sm" /> },
    { name: "Website Apps", path: "/wesiteapplication", icon: <FaGlobe className="text-sm" /> },
  ];

  if (["ADMIN", "SECONDARY_ADMIN", "RECRUITER"].includes(normalizedRole)) {
    navItems.push({ name: "Reports", path: "/reports", icon: <FaChartBar className="text-sm" /> });
  }

  if (normalizedRole.includes("ADMIN")) {
    navItems.push({ name: "Users", path: "/users", icon: <FaUserCog className="text-sm" /> });
  }

  return (
    <>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-green-600 to-teal-500 shadow-md z-30 flex items-center justify-between px-4">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center">
          <button 
            className="lg:hidden text-white mr-3"
            onClick={() => setMobileNavOpen(true)}
          >
            <FaBars className="text-lg" />
          </button>
          <div className="flex items-center">
            <FaCubes className="text-white mr-2" />
            <h1 className="text-white font-bold text-lg">TalentPrime</h1>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-4">
          {/* User Info and Logout */}
          <div className="relative">
            <button 
              className="flex items-center text-white text-sm"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center mr-2">
                <FaUser className="text-xs" />
              </div>
              <span className="hidden sm:inline mr-2 font-semibold">{role || "User"}</span>
              <FaChevronDown className="text-xs" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-10 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm text-gray-800">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900">{role || "User"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaSignOutAlt className="mr-2 text-gray-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-20 hover:w-64 bg-white shadow-xl rounded-r-2xl h-screen fixed top-0 left-0 z-20 transition-all duration-300 group">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 relative">
          <img 
            src={logo} 
            alt="ATS Logo" 
            className="h-10 w-auto object-contain opacity-100 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>
        <nav className="flex-1 px-2 py-6 space-y-2 overflow-hidden">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                currentPath === item.path
                  ? "text-white bg-gradient-to-r from-green-600 to-teal-500 shadow-md"
                  : "text-gray-600 hover:bg-green-50 hover:text-green-600"
              }`}
              title={item.name}
              onClick={() => navigate(item.path)}
            >
              <span className="min-w-[24px] flex justify-center">
                {item.icon}
              </span>
              <span className="ml-3 text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.name}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Navigation */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 p-4 rounded-r-2xl transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <img 
                src={logo} 
                alt="ATS Logo" 
                className="h-10 w-auto object-contain"
              />
              <button onClick={() => setMobileNavOpen(false)}>
                <FaTimes className="text-xl text-gray-600 hover:text-green-600" />
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                    currentPath === item.path
                      ? "text-white bg-gradient-to-r from-green-600 to-teal-500 shadow-md"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                  }`}
                  onClick={() => {
                    navigate(item.path);
                    setMobileNavOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                </button>
              ))}
            </nav>

            <div className="absolute bottom-4 left-4 right-4 p-3 border-t border-gray-200">
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

      {/* Add padding to main content */}
      <div className="pt-16 lg:pl-20"></div>
    </>
  );
};

export default Navbar;
