import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Applications from "./components/application/Applications";
import Candidates from "./components/candidate/Candidates";
import Clients from "./components/client/Clients";
import Dashboard from "./components/Dashboard";
import InterviewManagement from "./components/interview/Interviews";
import Jobs from "./components/job/Jobs";
import LoginRegister from "./components/LoginRegister";
import ForgotPassword from "./components/auth/ForgotPassword";
import { ToastProvider } from "./components/toast/ToastContext";
import UserManagement from "./components/user/Users";
import Wesiteapplication from "./components/websiteapplication/wesiteapplication";
import NotificationCenter from "./components/notifications/NotificationCenter";

function App() {
  return (
     <ToastProvider>
    <BrowserRouter>
      <Routes>
        {/* Public login page */}
        <Route path="/" element={<LoginRegister />} />
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ATS pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/Interviews" element={<InterviewManagement  />} />
        <Route path="/Users" element={<UserManagement />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/wesiteapplication" element={<Wesiteapplication />} />
        <Route path="/notifications" element={<NotificationCenter />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
