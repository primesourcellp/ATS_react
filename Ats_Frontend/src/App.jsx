import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Applications from "./components/application/Applications";
import ApplicationDetailsPage from "./components/application/ApplicationDetailsPage";
import Candidates from "./components/candidate/Candidates";
import CandidateDetailsPage from "./components/candidate/CandidateDetailsPage";
import Clients from "./components/client/Clients";
import AccountManager from "./components/client/AccountManager";
import AccountManagerClientDetail from "./components/client/AccountManagerClientDetail";
import ClientDetailsPage from "./components/client/ClientDetailsPage";
import Dashboard from "./components/Dashboard";
import InterviewManagement from "./components/interview/Interviews";
import Jobs from "./components/job/Jobs";
import JobDetailsPage from "./components/job/JobDetailsPage";
import LoginRegister from "./components/LoginRegister";
import ForgotPassword from "./components/auth/ForgotPassword";
import { ToastProvider } from "./components/toast/ToastContext";
import UserManagement from "./components/user/Users";
import Wesiteapplication from "./components/websiteapplication/wesiteapplication";
import NotificationCenter from "./components/notifications/NotificationCenter";
import Reports from "./components/reports/Reports";
import CandidateEmailManagement from "./components/admin/CandidateEmailManagement";

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

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
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/candidates"
          element={
            <RequireAuth>
              <Candidates />
            </RequireAuth>
          }
        />
        <Route
          path="/candidates/:id"
          element={
            <RequireAuth>
              <CandidateDetailsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/jobs"
          element={
            <RequireAuth>
              <Jobs />
            </RequireAuth>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <RequireAuth>
              <JobDetailsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/applications"
          element={
            <RequireAuth>
              <Applications />
            </RequireAuth>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <RequireAuth>
              <ApplicationDetailsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/Interviews"
          element={
            <RequireAuth>
              <InterviewManagement />
            </RequireAuth>
          }
        />
        <Route
          path="/Users"
          element={
            <RequireAuth>
              <UserManagement />
            </RequireAuth>
          }
        />
        <Route
          path="/clients"
          element={
            <RequireAuth>
              <Clients />
            </RequireAuth>
          }
        />
        <Route
          path="/account-manager"
          element={
            <RequireAuth>
              <AccountManager />
            </RequireAuth>
          }
        />
        <Route
          path="/account-manager/clients/:id"
          element={
            <RequireAuth>
              <AccountManagerClientDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <RequireAuth>
              <ClientDetailsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/wesiteapplication"
          element={
            <RequireAuth>
              <Wesiteapplication />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <NotificationCenter />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <Reports />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate-emails"
          element={
            <RequireAuth>
              <CandidateEmailManagement />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
