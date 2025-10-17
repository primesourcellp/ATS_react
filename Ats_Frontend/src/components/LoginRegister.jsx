import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      const response = await fetch("http://localhost:8080/api/users/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });
      if (!response.ok) throw new Error(await response.text());
      const msg = await response.text();
      showMessage(msg, "success");
      setTimeout(() => setShowLogin(true), 1500);
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // Handle Login
  const handleLogin = async () => {
    const { username, password } = loginData;
    if (!username || !password) {
      showMessage("Username and password are required", "error");
      return;
    }
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid username or password");
        throw new Error(await response.text());
      }
      const data = await response.json();
      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);
      navigate("/dashboard");
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-indigo-600 text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Admin & Recruiter Portal</h1>
        <p className="text-lg mb-8">Manage your recruitment process efficiently</p>
        <ul className="space-y-4 text-left">
          <li>🔒 Secure Access with role-based authentication</li>
          <li>👥 Manage Admin & Recruiter accounts</li>
          <li>📊 Real-time recruitment dashboard</li>
        </ul>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center w-full md:w-1/2 p-8 bg-white shadow-lg">
        {message.text && (
          <div
            className={`p-3 mb-4 rounded ${
              message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {showLogin ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Sign In</h2>
            <input
              type="text"
              placeholder="Username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              className="w-full border p-2 mb-3 rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full border p-2 mb-3 rounded"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Login
            </button>
            <p className="mt-2 text-sm text-center">
              <span 
                className="text-blue-600 cursor-pointer hover:underline" 
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </span>
            </p>
            <p className="mt-4 text-sm">
              Don't have an account?{" "}
              <span className="text-blue-600 cursor-pointer" onClick={() => setShowLogin(false)}>
                Register
              </span>
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">Register</h2>
            <input
              type="text"
              placeholder="Username"
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
              className="w-full border p-2 mb-3 rounded"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              className="w-full border p-2 mb-3 rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              className="w-full border p-2 mb-3 rounded"
            />
            <select
              value={registerData.role}
              onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
              className="w-full border p-2 mb-3 rounded"
            >
              <option value="admin">Admin</option>
              <option value="recruiter">Recruiter</option>
            </select>
            <button
              onClick={handleRegister}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Register
            </button>
            <p className="mt-4 text-sm">
              Already have an account?{" "}
              <span className="text-blue-600 cursor-pointer" onClick={() => setShowLogin(true)}>
                Login
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginRegister;
