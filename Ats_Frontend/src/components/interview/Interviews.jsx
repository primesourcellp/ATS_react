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
  const [idSearchTerm, setIdSearchTerm] = useState('');
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
  }, [interviews, searchTerm, idSearchTerm, dateFilter]);

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

    // Filter by ID search (exact match)
    if (idSearchTerm) {
      const idToSearch = idSearchTerm.trim();
      result = result.filter(interview => {
        if (interview.id) {
          return interview.id.toString() === idToSearch;
        }
        return false;
      });
    }

    // Filter by general search (candidate, job, client)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(interview => {
        const candidateName = getCandidateName(interview).toLowerCase();
        const jobTitle = getJobTitle(interview).toLowerCase();
        let clientName = '';
        if (interview.clientName) {
          clientName = interview.clientName.toLowerCase();
        } else if (interview.application?.job?.client?.clientName) {
          clientName = interview.application.job.client.clientName.toLowerCase();
        }
        
        return candidateName.includes(term) || jobTitle.includes(term) || clientName.includes(term);
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

  const handleCompleteInterview = async (id, completionNotes = '') => {
    try {
      await interviewAPI.complete(id, completionNotes);
      showToast('Success', 'Interview marked as completed and application status updated', 'success');
      loadInterviews();
    } catch (error) {
      showToast('Error', error.message || 'Failed to complete interview', 'error');
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
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Management</h1>
              <p className="text-gray-600 mt-1">Manage and review all interviews</p>
            </div>
          </div>
        </div>

        {/* Separate Search Bars */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* General Search Bar */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Candidate, Job, or Client
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter candidate name, job title, or client..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ID Search Bar */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Interview ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter interview ID (e.g., 123)..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={idSearchTerm}
                  onChange={(e) => setIdSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      filterInterviews();
                    }
                  }}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                  </svg>
                </div>
                {idSearchTerm && (
                  <button
                    onClick={() => {
                      setIdSearchTerm('');
                      filterInterviews();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    title="Clear ID search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {(searchTerm || idSearchTerm) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIdSearchTerm('');
                  loadInterviews();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Clear All Searches
              </button>
            </div>
          )}
        </div>

        {/* Interviews Table */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <InterviewsTable
            interviews={filteredInterviews}
            loading={loading}
            searchTerm={searchTerm}
            onEditInterview={handleEditInterview}
            onDeleteInterview={handleDeleteInterview}
            onCompleteInterview={handleCompleteInterview}
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