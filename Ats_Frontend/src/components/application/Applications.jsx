import { useEffect, useState } from 'react';
import { applicationAPI, candidateAPI, interviewAPI, jobAPI } from '../../api/api';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import ApplicationModal from './ApplicationModal';
import ApplicationsTable from './ApplicationsTable';
import CandidateModal from './CandidateModal';
import InterviewModal from './InterviewModal';

const ApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadApplications();
    loadCandidates();
    loadJobs();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      let url = '/api/applications';
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (params.toString()) url += `?${params.toString()}`;
      const data = await applicationAPI.getAll(url);
      setApplications(data || []);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    try {
      const data = await candidateAPI.getAll();
      setCandidates(data || []);
    } catch (error) {
      showToast('Error', 'Failed to load candidates', 'error');
    }
  };

  const loadJobs = async () => {
    try {
      const data = await jobAPI.getAll();
      setJobs(data || []);
    } catch (error) {
      showToast('Error', 'Failed to load jobs', 'error');
    }
  };

  const filterApplications = () => {
    let result = [...applications];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app =>
        (app.candidateName || app.candidate?.name || '').toLowerCase().includes(term) ||
        (app.job?.jobName || app.job?.title || '').toLowerCase().includes(term)
      );
    }
    if (statusFilter) result = result.filter(app => app.status === statusFilter);
    setFilteredApplications(result);
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleNewApplication = () => { setSelectedApplication(null); setShowApplicationModal(true); };
  const handleEditApplication = (app) => { setSelectedApplication(app); setShowApplicationModal(true); };
  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await applicationAPI.delete(id);
      showToast('Success', 'Application deleted successfully', 'success');
      loadApplications();
    } catch (error) {
      // Show specific error message for applications with interviews
      if (error.message && error.message.includes('interviews')) {
        showToast('Cannot Delete', 'This application has interviews. Please delete interviews first.', 'error');
      } else {
        showToast('Error', error.message || 'Failed to delete application', 'error');
      }
    }
  };
  const handleScheduleInterview = (app) => { setSelectedApplication(app); setShowInterviewModal(true); };
  const handleViewCandidate = async (id) => {
    try {
      const candidate = await candidateAPI.getById(id);
      setSelectedCandidate(candidate);
      setShowCandidateModal(true);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load candidate', 'error');
    }
  };
  const handleViewResume = async (app) => {
    try {
      const resumeUrl = await applicationAPI.viewResume(app.id);
      window.open(resumeUrl, "_blank");
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(resumeUrl);
      }, 10000);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load resume', 'error');
    }
  };
  const handleSaveApplication = async (formData) => {
    try {
      console.log("handleSaveApplication - formData:", formData); // Debug log
      console.log("handleSaveApplication - selectedApplication:", selectedApplication); // Debug log
      
      if (!formData) {
        showToast('Error', 'Form data is required', 'error');
        return;
      }
      
      if (selectedApplication) {
        // Editing existing application - only send fields that can be updated
        const updateData = {
          status: formData.status,
          resumeFile: formData.resumeFile,
          useMasterResume: formData.useMasterResume
        };
        console.log("handleSaveApplication - updateData:", updateData); // Debug log
        await applicationAPI.update(selectedApplication.id, updateData);
        showToast('Success', 'Application updated successfully', 'success');
      } else {
        // Creating new application
        console.log("handleSaveApplication - createData:", formData); // Debug log
        await applicationAPI.create(formData);
        showToast('Success', 'Application created successfully', 'success');
      }
      setShowApplicationModal(false);
      loadApplications();
    } catch (error) {
      console.error("handleSaveApplication error:", error);
      showToast('Error', error.message || 'Failed to save application', 'error');
    }
  };
  const handleScheduleInterviewSubmit = async (interviewData) => {
    try {
      await interviewAPI.schedule(selectedApplication.id, interviewData);
      showToast('Success', 'Interview scheduled successfully', 'success');
      setShowInterviewModal(false);
      loadApplications();
    } catch (error) {
      showToast('Error', error.message || 'Failed to schedule interview', 'error');
    }
  };

  const getStatusClass = (status) => {
    const map = {
      'PENDING':'bg-yellow-100 text-yellow-800',
      'SCHEDULED':'bg-blue-100 text-blue-800',
      'INTERVIEWED':'bg-purple-100 text-purple-800',
      'PLACED':'bg-green-100 text-green-800',
      'REJECTED':'bg-red-100 text-red-800',
      'SUBMITTED_BY_CLIENT':'bg-indigo-100 text-indigo-800',
      'CLIENT_SHORTLIST':'bg-teal-100 text-teal-800',
      'FINAL_SELECT':'bg-green-100 text-green-800',
      'JOINED':'bg-green-100 text-green-800',
      'BACKEDOUT':'bg-gray-100 text-gray-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex">
      <Navbar />

      <main className="flex-1 p-4">
        {/* Role badge */}
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            userRole === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>{userRole}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-briefcase mr-2 text-blue-500"></i>
            Job Applications
          </h2>
          <button onClick={handleNewApplication} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center">
            <i className="fas fa-plus mr-1"></i> New Application
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search by candidate or job..."
              className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-filter text-gray-400"></i>
            </div>
            <select
              className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="INTERVIEWED">Interviewed</option>
              <option value="PLACED">Placed</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUBMITTED_BY_CLIENT">Submitted by Client</option>
              <option value="CLIENT_SHORTLIST">Client Shortlist</option>
              <option value="FINAL_SELECT">Final Select</option>
              <option value="JOINED">Joined</option>
              <option value="BACKEDOUT">Backed Out</option>
            </select>
          </div>
{/* 
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center justify-center"
            onClick={loadApplications}
          >
            <i className="fas fa-search mr-1"></i> Search
          </button> */}
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <ApplicationsTable
            applications={filteredApplications}
            loading={loading}
            onViewCandidate={handleViewCandidate}
            onViewResume={handleViewResume}
            onScheduleInterview={handleScheduleInterview}
            onEditApplication={handleEditApplication}
            onDeleteApplication={handleDeleteApplication}
            getStatusClass={getStatusClass}
          />
        </div>

        {/* Modals */}
        {showApplicationModal && (
          <ApplicationModal
            application={selectedApplication}
            candidates={candidates}
            jobs={jobs}
            onSave={handleSaveApplication}
            onClose={() => setShowApplicationModal(false)}
            showToast={showToast}
          />
        )}

        {showInterviewModal && selectedApplication && (
          <InterviewModal
            application={selectedApplication}
            onSubmit={handleScheduleInterviewSubmit}
            onClose={() => setShowInterviewModal(false)}
          />
        )}

        {showCandidateModal && selectedCandidate && (
          <CandidateModal
            candidate={selectedCandidate}
            onClose={() => setShowCandidateModal(false)}
            onViewResume={async () => {
              setShowCandidateModal(false);
              const candidateApplication = applications.find(app =>
                app.candidate?.id === selectedCandidate.id && app.resumeAvailable
              );
              if (candidateApplication) {
                try {
                  const resumeUrl = await applicationAPI.viewResume(candidateApplication.id);
                  window.open(resumeUrl, "_blank");
                  
                  // Clean up blob URL after a delay
                  setTimeout(() => {
                    window.URL.revokeObjectURL(resumeUrl);
                  }, 10000);
                } catch (error) {
                  showToast('Error', error.message || 'Failed to load resume', 'error');
                }
              } else {
                showToast('Info', 'No resume found for this candidate', 'info');
              }
            }}
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

export default ApplicationTracker;
