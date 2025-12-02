import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applicationAPI, candidateAPI, interviewAPI, jobAPI } from '../../api/api';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import ApplicationModal from './ApplicationModal';
import ApplicationsTable from './ApplicationsTable';
import InterviewModal from './InterviewModal';
import DeleteConfirmationModal from '../client/DeleteConfirmationModal';

const applicationStatusOptions = [
  { value: 'NEW_CANDIDATE', label: 'New Candidate' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'INTERVIEWED', label: 'Interviewed' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'HOLD', label: 'Hold' },
  { value: 'HIGH_CTC', label: 'High CTC' },
  { value: 'DROPPED_BY_CLIENT', label: 'Dropped by Client' },
  { value: 'SUBMITTED_TO_CLIENT', label: 'Submitted to Client' },
  { value: 'NO_RESPONSE', label: 'No Response' },
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'REJECTED_BY_CLIENT', label: 'Rejected by Client' },
  { value: 'CLIENT_SHORTLIST', label: 'Client Shortlist' },
  { value: 'FIRST_INTERVIEW_SCHEDULED', label: '1st Interview Scheduled' },
  { value: 'FIRST_INTERVIEW_FEEDBACK_PENDING', label: '1st Interview Feedback Pending' },
  { value: 'FIRST_INTERVIEW_REJECT', label: '1st Interview Reject' },
  { value: 'SECOND_INTERVIEW_SCHEDULED', label: '2nd Interview Scheduled' },
  { value: 'SECOND_INTERVIEW_FEEDBACK_PENDING', label: '2nd Interview Feedback Pending' },
  { value: 'SECOND_INTERVIEW_REJECT', label: '2nd Interview Reject' },
  { value: 'THIRD_INTERVIEW_SCHEDULED', label: '3rd Interview Scheduled' },
  { value: 'THIRD_INTERVIEW_FEEDBACK_PENDING', label: '3rd Interview Feedback Pending' },
  { value: 'THIRD_INTERVIEW_REJECT', label: '3rd Interview Reject' },
  { value: 'INTERNEL_REJECT', label: 'Internal Reject' },
  { value: 'CLIENT_REJECT', label: 'Client Reject' },
  { value: 'FINAL_SELECT', label: 'Final Select' },
  { value: 'JOINED', label: 'Joined' },
  { value: 'BACKEDOUT', label: 'Backed Out' },
  { value: 'NOT_RELEVANT', label: 'Not Relevant' },
];

const ApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [applicationIdSearch, setApplicationIdSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userRole, setUserRole] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightId, setHighlightId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(localStorage.getItem("username") || "");
  const [showMyApplications, setShowMyApplications] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    setCurrentUserName(localStorage.getItem("username") || "");
    loadCandidates();
    loadJobs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, applicationIdSearch, statusFilter, showMyApplications]);

  useEffect(() => {
    loadApplications();
  }, [currentPage, statusFilter, searchTerm, sortOrder]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightParam = params.get('highlight');
    if (highlightParam) {
      const parsed = Number(highlightParam);
      if (!Number.isNaN(parsed)) {
        setHighlightId(parsed);
      }
    } else {
      setHighlightId(null);
    }
  }, [location.search]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, applicationIdSearch, statusFilter, showMyApplications, currentUserName]);

  const clearHighlight = useCallback(() => {
    if (highlightId == null) {
      return;
    }

    setHighlightId(null);

    const params = new URLSearchParams(location.search);
    if (params.has('highlight')) {
      params.delete('highlight');
      const search = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : ''
        },
        { replace: true }
      );
    }
  }, [highlightId, location.pathname, location.search, navigate]);

  const sortApplications = (list, order = sortOrder) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const dateA = new Date(a.appliedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.appliedAt || b.createdAt || 0).getTime();
      if (order === 'oldest') {
        return dateA - dateB || (a.id || 0) - (b.id || 0);
      }
      return dateB - dateA || (b.id || 0) - (a.id || 0);
    });
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      let url = '/api/applications';
      const params = new URLSearchParams();
      params.append('page', currentPage - 1);
      params.append('size', itemsPerPage);
      params.append('sort', sortOrder === 'newest' ? 'appliedAt,desc' : 'appliedAt,asc');
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (params.toString()) url += `?${params.toString()}`;
      const data = await applicationAPI.getAll(url);
      let content = [];
      let computedTotal = 0;

      if (data && typeof data === 'object' && Array.isArray(data.content)) {
        content = data.content;
        computedTotal = data.totalElements ?? data.content.length ?? 0;
      } else if (Array.isArray(data)) {
        content = data;
        computedTotal = data.length;
      }

      const sortedContent = sortApplications(content);
      setApplications(sortedContent);
      setFilteredApplications(sortedContent);
      setTotalItems(computedTotal);

      const computedTotalPages = Math.max(1, Math.ceil((computedTotal || content.length || 0) / itemsPerPage));
      if (currentPage > computedTotalPages) {
        setCurrentPage(computedTotalPages);
      }
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
    
    // Filter by application ID (dedicated search - exact match)
    if (applicationIdSearch) {
      const idToSearch = applicationIdSearch.trim();
      result = result.filter(app => {
        if (app.id) {
          return app.id.toString() === idToSearch;
        }
        return false;
      });
    }
    
    // Filter by search term (general search - excludes ID)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app =>
        (app.candidateName || app.candidate?.name || '').toLowerCase().includes(term) ||
        (app.job?.jobName || app.job?.title || '').toLowerCase().includes(term) ||
        (app.candidate?.email || '').toLowerCase().includes(term) ||
        (app.candidate?.phone || '').toLowerCase().includes(term) ||
        (app.job?.client?.clientName || '').toLowerCase().includes(term)
      );
    }
    
    if (statusFilter) result = result.filter(app => app.status === statusFilter);
    
    // Filter by "My Applications" if enabled
    if (showMyApplications && currentUserName) {
      const normalizedUser = currentUserName.trim().toLowerCase();
      result = result.filter(app => {
        const owner = (app.createdByUsername || "").toLowerCase();
        const ownerEmail = (app.createdByEmail || "").toLowerCase();
        return owner === normalizedUser || ownerEmail === normalizedUser;
      });
    }
    
    setFilteredApplications(sortApplications(result));
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  useEffect(() => {
    const fetchHighlightApplication = async () => {
      if (highlightId == null) {
        return;
      }

      const exists = applications.some(
        (app) => Number(app.id) === Number(highlightId)
      );
      if (exists) {
        return;
      }

      try {
        const application = await applicationAPI.getById(highlightId);
        if (application) {
          setApplications((prev) => {
            const updated = [
              application,
              ...prev.filter((item) => Number(item.id) !== Number(application.id)),
            ];
            return sortApplications(updated);
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch application ${highlightId}:`, error);
      }
    };

    fetchHighlightApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  const handleNewApplication = () => { setSelectedApplication(null); setShowApplicationModal(true); };
  const handleEditApplication = (app) => { setSelectedApplication(app); setShowApplicationModal(true); };
  const handleDeleteApplication = (id) => {
    setApplicationToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteApplication = async () => {
    if (!applicationToDelete) return;
    try {
      await applicationAPI.delete(applicationToDelete);
      showToast('Success', 'Application deleted successfully', 'success');
      setShowDeleteModal(false);
      setApplicationToDelete(null);
      loadApplications();
    } catch (error) {
      // Show specific error message for applications with interviews
      if (error.message && error.message.includes('interviews')) {
        showToast('Cannot Delete', 'This application has interviews. Please delete interviews first.', 'error');
      } else {
        showToast('Error', error.message || 'Failed to delete application', 'error');
      }
      setShowDeleteModal(false);
      setApplicationToDelete(null);
    }
  };
  const handleScheduleInterview = (app) => { setSelectedApplication(app); setShowInterviewModal(true); };
  const handleViewCandidate = (id) => {
    if (id) {
      navigate(`/candidates/${id}`);
    }
  };
  const handleViewApplication = (id) => {
    if (id) {
      navigate(`/applications/${id}`);
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
      const message = error.message && error.message.toLowerCase().includes('not found')
        ? 'Resume not found for this application.'
        : (error.message || 'Failed to load resume');
      showToast(message.includes('not found') ? 'Info' : 'Error', message, message.includes('not found') ? 'info' : 'error');
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
          statusDescription: formData.statusDescription,
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

  const handleApplicationStatusChange = async (application, newStatus, statusDescription = "") => {
    if (!application?.id || !newStatus) return;
    try {
      await applicationAPI.update(application.id, { status: newStatus, statusDescription });
      showToast('Success', 'Application status updated', 'success');
      setApplications(prev =>
        sortApplications(
          prev.map(app => (app.id === application.id ? { ...app, status: newStatus } : app))
        )
      );
      setFilteredApplications(prev =>
        sortApplications(
          prev.map(app => (app.id === application.id ? { ...app, status: newStatus } : app))
        )
      );
      setSelectedApplication(prev =>
        prev && prev.id === application.id ? { ...prev, status: newStatus } : prev
      );
    } catch (error) {
      showToast('Error', error.message || 'Failed to update application status', 'error');
      throw error;
    }
  };

  const isServerPaginated = totalItems > filteredApplications.length;
  const effectiveTotal = isServerPaginated ? totalItems : filteredApplications.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / itemsPerPage));
  const currentItems = isServerPaginated
    ? filteredApplications
    : filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate my applications count
  const myApplicationsCount = useMemo(() => {
    if (!currentUserName) return 0;
    const normalized = currentUserName.trim().toLowerCase();
    return applications.filter((app) => {
      const owner = (app.createdByUsername || "").toLowerCase();
      const ownerEmail = (app.createdByEmail || "").toLowerCase();
      return owner === normalized || ownerEmail === normalized;
    }).length;
  }, [applications, currentUserName]);

  useEffect(() => {
    if (highlightId == null || isServerPaginated) {
      return;
    }
    const targetIndex = filteredApplications.findIndex(
      (app) => Number(app.id) === Number(highlightId)
    );
    if (targetIndex === -1) {
      return;
    }
    const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [highlightId, filteredApplications, isServerPaginated, itemsPerPage, currentPage]);

  const getStatusClass = (status) => {
    const map = {
      NEW_CANDIDATE: 'bg-sky-100 text-sky-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      INTERVIEWED: 'bg-purple-100 text-purple-800',
      PLACED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUBMITTED_TO_CLIENT: 'bg-indigo-100 text-indigo-800',
      NOT_INTERESTED: 'bg-gray-100 text-gray-800',
      HOLD: 'bg-amber-100 text-amber-800',
      HIGH_CTC: 'bg-rose-100 text-rose-800',
      DROPPED_BY_CLIENT: 'bg-red-100 text-red-800',
      NO_RESPONSE: 'bg-orange-100 text-orange-800',
      IMMEDIATE: 'bg-emerald-100 text-emerald-800',
      REJECTED_BY_CLIENT: 'bg-rose-100 text-rose-700',
      CLIENT_SHORTLIST: 'bg-teal-100 text-teal-800',
      FINAL_SELECT: 'bg-green-100 text-green-800',
      JOINED: 'bg-green-100 text-green-800',
      BACKEDOUT: 'bg-gray-100 text-gray-800',
      NOT_RELEVANT: 'bg-gray-100 text-gray-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex">
      <Navbar />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
              <p className="text-gray-600 mt-1">Manage and track all job applications</p>
            </div>
          </div>
        </div>

        {/* Simple Stats Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-1">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total Applications:</span>
              <span className="text-lg font-semibold text-gray-900">{effectiveTotal}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMyApplications((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showMyApplications
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              <i className="fas fa-user-check"></i>
              {showMyApplications ? "Show All Applications" : `My Applications (${myApplicationsCount})`}
            </button>
          </div>
        </div>

        {/* Real-time ATS Search Bar */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-4 mb-6 border border-purple-100">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* General Search - Large and Prominent */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search applications by candidate name, email, job title, or client..."
                  className="w-full pl-12 pr-12 py-3.5 text-base border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-purple-50 rounded-r-lg transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ID Search - Compact */}
            <div className="w-full lg:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Application ID..."
                  className="w-full pl-10 pr-10 py-3.5 text-base border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                  value={applicationIdSearch}
                  onChange={(e) => setApplicationIdSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      filterApplications();
                    }
                  }}
                />
                {applicationIdSearch && (
                  <button
                    onClick={() => {
                      setApplicationIdSearch('');
                      filterApplications();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
                    title="Clear ID search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Clear Button - Only show when search is active */}
            {(searchTerm || applicationIdSearch) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setApplicationIdSearch('');
                  loadApplications();
                }}
                className="px-4 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Real-time Results Count */}
          {(searchTerm || applicationIdSearch) && (
            <div className="mt-3 flex items-center text-sm text-purple-700">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found</span>
              {(searchTerm || applicationIdSearch) && (
                <span className="ml-2 text-purple-600">
                  {searchTerm && `• "${searchTerm}"`}
                  {applicationIdSearch && ` • ID: ${applicationIdSearch}`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Filters - Compact ATS Style */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white min-w-[180px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="NEW_CANDIDATE">New Candidate</option>
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="PLACED">Placed</option>
                <option value="REJECTED">Rejected</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="HOLD">Hold</option>
                <option value="HIGH_CTC">High CTC</option>
                <option value="DROPPED_BY_CLIENT">Dropped by Client</option>
                <option value="SUBMITTED_TO_CLIENT">Submitted to Client</option>
                <option value="NO_RESPONSE">No Response</option>
                <option value="IMMEDIATE">Immediate</option>
                <option value="REJECTED_BY_CLIENT">Rejected by Client</option>
                <option value="CLIENT_SHORTLIST">Client Shortlist</option>
                <option value="FIRST_INTERVIEW_SCHEDULED">1st Interview Scheduled</option>
                <option value="FIRST_INTERVIEW_FEEDBACK_PENDING">1st Interview Feedback Pending</option>
                <option value="FIRST_INTERVIEW_REJECT">1st Interview Reject</option>
                <option value="SECOND_INTERVIEW_SCHEDULED">2nd Interview Scheduled</option>
                <option value="SECOND_INTERVIEW_FEEDBACK_PENDING">2nd Interview Feedback Pending</option>
                <option value="SECOND_INTERVIEW_REJECT">2nd Interview Reject</option>
                <option value="THIRD_INTERVIEW_SCHEDULED">3rd Interview Scheduled</option>
                <option value="THIRD_INTERVIEW_FEEDBACK_PENDING">3rd Interview Feedback Pending</option>
                <option value="THIRD_INTERVIEW_REJECT">3rd Interview Reject</option>
                <option value="INTERNEL_REJECT">Internal Reject</option>
                <option value="CLIENT_REJECT">Client Reject</option>
                <option value="FINAL_SELECT">Final Select</option>
                <option value="JOINED">Joined</option>
                <option value="BACKEDOUT">Backed Out</option>
                <option value="NOT_RELEVANT">Not Relevant</option>
              </select>
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                value={sortOrder}
                onChange={e => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Clear All Filters */}
            {(statusFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}

            {/* Add Application Button */}
            <button
              onClick={handleNewApplication}
              className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Pipeline
            </button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <ApplicationsTable
            applications={currentItems}
            loading={loading}
            highlightId={highlightId}
            onClearHighlight={clearHighlight}
            onViewCandidate={handleViewCandidate}
            onViewApplication={handleViewApplication}
            onViewResume={handleViewResume}
            onScheduleInterview={handleScheduleInterview}
            onEditApplication={handleEditApplication}
            onDeleteApplication={handleDeleteApplication}
            getStatusClass={getStatusClass}
            onStatusChange={handleApplicationStatusChange}
            statusOptions={applicationStatusOptions}
            currentUserName={currentUserName}
          />

          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{currentItems.length}</span> of{' '}
              <span className="font-semibold">{effectiveTotal}</span> applications
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg border border-gray-300 text-sm ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Prev
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                Page
                <span className="px-3 py-1 rounded-lg border border-gray-200 bg-white font-semibold">
                  {currentPage}
                </span>
                of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg border border-gray-300 text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            title="Delete Application"
            message="Are you sure you want to delete this application? This action cannot be undone."
            onConfirm={confirmDeleteApplication}
            onClose={() => {
              setShowDeleteModal(false);
              setApplicationToDelete(null);
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
