import { useState, useEffect } from 'react';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import InterviewsTable from './InterviewsTable';
import InterviewModal from './InterviewModal';
import { interviewAPI } from '../../api/api';

const InterviewManagement = () => {
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadInterviews();
  }, []);

  useEffect(() => {
    filterInterviews();
  }, [interviews, searchTerm, dateFilter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = await interviewAPI.getAll();
      console.log('Interviews data:', data); // Debug log to see API response structure
      setInterviews(data || []);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const searchInterviews = async () => {
    try {
      setLoading(true);
      const data = await interviewAPI.search(searchTerm, 0, 1000);
      setInterviews(data.content || []);
    } catch (error) {
      showToast('Error', error.message || 'Failed to search interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterInterviews = () => {
    let result = [...interviews];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(interview => {
        const candidateName = getCandidateName(interview).toLowerCase();
        const jobTitle = getJobTitle(interview).toLowerCase();
        
        return candidateName.includes(term) || jobTitle.includes(term);
      });
    }

    if (dateFilter) {
      result = result.filter(interview => interview.interviewDate === dateFilter);
    }

    setFilteredInterviews(result);
  };

  // Helper function to extract candidate name from different response formats
  const getCandidateName = (interview) => {
    // Priority 1: Direct properties from search endpoint
    if (interview.candidateName) return interview.candidateName;
    
    // Priority 2: Nested application structure from getAll endpoint
    if (interview.application?.candidate?.name) return interview.application.candidate.name;
    
    // Priority 3: Direct candidate object
    if (interview.candidate?.name) return interview.candidate.name;
    
    return '-';
  };

  // Helper function to extract job title from different response formats
  const getJobTitle = (interview) => {
    // Priority 1: Direct properties from search endpoint
    if (interview.jobTitle) return interview.jobTitle;
    
    // Priority 2: Nested application structure from getAll endpoint
    if (interview.application?.job?.title) return interview.application.job.title;
    if (interview.application?.job?.jobName) return interview.application.job.jobName;
    
    // Priority 3: Direct job object
    if (interview.job?.title) return interview.job.title;
    if (interview.job?.jobName) return interview.job.jobName;
    
    return '-';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchInterviews();
    } else {
      loadInterviews();
    }
  };

  const handleEditInterview = (interview) => {
    setSelectedInterview(interview);
    setShowInterviewModal(true);
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      await interviewAPI.delete(id);
      showToast('Success', 'Interview deleted successfully', 'success');
      loadInterviews();
    } catch (error) {
      showToast('Error', error.message || 'Failed to delete interview', 'error');
    }
  };

  const handleSaveInterview = async (interviewData) => {
    try {
      if (selectedInterview) {
        await interviewAPI.update(selectedInterview.id, interviewData);
        showToast('Success', 'Interview updated successfully', 'success');
      }
      setShowInterviewModal(false);
      loadInterviews();
    } catch (error) {
      showToast('Error', error.message || 'Failed to save interview', 'error');
    }
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  return (
    <div className="flex">
      {/* Sidebar-style Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1 p-4">
        {/* Role badge */}
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            userRole === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
          }`}>{userRole}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-10 mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-calendar-check mr-2 text-green-500"></i>
            Interview Management
          </h2>
        </div>

        

        {/* Interviews Table */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <InterviewsTable
            interviews={filteredInterviews}
            loading={loading}
            onEditInterview={handleEditInterview}
            onDeleteInterview={handleDeleteInterview}
          />
        </div>

        {/* Modals */}
        {showInterviewModal && selectedInterview && (
          <InterviewModal
            interview={selectedInterview}
            onSave={handleSaveInterview}
            onClose={() => {
              setShowInterviewModal(false);
              setSelectedInterview(null);
            }}
            showToast={showToast}
          />
        )}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default InterviewManagement;