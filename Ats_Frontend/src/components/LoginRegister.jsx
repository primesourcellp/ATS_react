import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../api/api";
import { setLoginDate } from "../utils/dailyLogout";
import logo from "../assets/logo.png";

const LoginRegister = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    email: "",
    role: "admin",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // Handle Register
  const handleRegister = async () => {
    const { username, password, email, role } = registerData;
    if (!username || !password || !email) {
      showMessage("Username, password, and email are required", "error");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }
    
    if (role.toLowerCase() !== "admin") {
      showMessage("Only admin registration is allowed initially.", "error");
      return;
    }
    try {
      const response = await userAPI.createAdmin({ username, password, email });
      showMessage(typeof response === 'string' ? response : "Admin user created successfully", "success");
      setTimeout(() => setShowLogin(true), 1500);
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // Handle Login
  const handleLogin = async () => {
    const { username, password } = loginData;
    if (!username || !password) {
      showMessage("Username/Email and password are required", "error");
      return;
    }
    try {
      // Try username or email - backend will handle both
      const data = await authAPI.login(username.trim(), password);
      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);
      // Store login date for daily logout check
      setLoginDate();
      navigate("/dashboard");
    } catch (err) {
      const msg = err.message || "";
      if (
        msg.includes("Invalid") ||
        msg.includes("401") ||
        msg === "Unauthorized" ||
        msg === "Forbidden"
      ) {
        showMessage("Invalid username/email or password", "error");
      } else if (msg.includes("Session expired")) {
        showMessage("Session expired. Please log in again.", "error");
      } else {
        showMessage(msg || "Unable to log in. Please try again.", "error");
      }
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Logo at top left */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <img 
          src={logo} 
          alt="ATS Logo" 
          className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
        />
      </div>

      {/* Powered by footer at bottom right - Desktop */}
      <div className="hidden sm:block absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-10">
        <a 
          href="https://primesourcellp.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-xs sm:text-sm font-medium flex items-center gap-1"
        >
          Powered by <span className="font-semibold text-indigo-600">primesourcellp</span>
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Form Section */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10">
            {message.text && (
              <div
                className={`p-3 sm:p-4 mb-4 sm:mb-6 rounded-xl border text-sm sm:text-base ${
                  message.type === "error" 
                    ? "bg-red-50 text-red-800 border-red-200" 
                    : "bg-green-50 text-green-800 border-green-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {message.type === "error" ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {showLogin ? (
              <div>
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                  <p className="text-sm sm:text-base text-gray-600">Sign in to continue to your account</p>
                </div>
                
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username or Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your username or email"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sign In
                  </button>
                </div>

                <div className="mt-5 sm:mt-6 text-center">
                  <p className="text-sm sm:text-base text-gray-600">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setShowLogin(false)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                    >
                      Register Now
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
                  <p className="text-sm sm:text-base text-gray-600">Register to get started with ATS Portal</p>
                </div>
                
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <select
                        value={registerData.role}
                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="recruiter">Recruiter</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleRegister}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Create Account
                  </button>
                </div>

                <div className="mt-5 sm:mt-6 text-center">
                  <p className="text-sm sm:text-base text-gray-600">
                    Already have an account?{" "}
                    <button
                      onClick={() => setShowLogin(true)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Show powered by at bottom center */}
      <div className="sm:hidden absolute bottom-3 left-0 right-0 text-center z-10">
        <a 
          href="https://primesourcellp.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-xs font-medium inline-flex items-center gap-1"
        >
          Powered by <span className="font-semibold text-indigo-600">primesourcellp</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default LoginRegister;
