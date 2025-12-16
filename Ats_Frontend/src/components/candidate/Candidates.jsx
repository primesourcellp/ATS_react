import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import CandidateTable from './CandidateTable';
import CreateCandidateModal from './CreateCandidateModal';
import EditCandidateModal from './EditCandidateModal';
import DeleteConfirmationModal from '../client/DeleteConfirmationModal';
import { candidateAPI } from '../../api/api';

const candidateStatusOptions = [
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

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [nameSearch, setNameSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [skillsSearch, setSkillsSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [candidateIdSearch, setCandidateIdSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [includeSkillsFilter, setIncludeSkillsFilter] = useState('');
  const [excludeSkillsFilter, setExcludeSkillsFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentUserName, setCurrentUserName] = useState(localStorage.getItem("username") || "");
  const [showMyCandidates, setShowMyCandidates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const navigate = useNavigate();
  const displayedCandidateCount = filteredCandidates.length;
  const recruiterDisplayName = currentUserName || "You";
  const recruiterCandidatesCount = useMemo(() => {
    if (!currentUserName) return 0;
    const normalized = currentUserName.trim().toLowerCase();
    return candidates.filter((candidate) => {
      const owner = (candidate.createdByUsername || "").toLowerCase();
      const ownerEmail = (candidate.createdByEmail || "").toLowerCase();
      return owner === normalized || ownerEmail === normalized;
    }).length;
  }, [candidates, currentUserName]);

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    setCurrentUserName(localStorage.getItem("username") || "");
    loadCandidates();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [nameSearch, emailSearch, phoneSearch, locationSearch, skillsSearch, jobSearch, candidateIdSearch, statusFilter, locationFilter, includeSkillsFilter, excludeSkillsFilter, sortBy, showMyCandidates]);

  useEffect(() => {
    filterCandidates();
  }, [
    candidates,
    nameSearch,
    emailSearch,
    phoneSearch,
    locationSearch,
    skillsSearch,
    jobSearch,
    candidateIdSearch,
    statusFilter,
    locationFilter,
    includeSkillsFilter,
    excludeSkillsFilter,
    sortBy,
    showMyCandidates,
    currentUserName
  ]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const candidatesData = await candidateAPI.getAll();
      
      // Ensure applications array exists and hasResume is properly set
      const updatedCandidates = candidatesData.map(c => ({ 
        ...c, 
        applications: Array.isArray(c.applications) ? c.applications : [],
        // Ensure hasResume is set correctly based on resumePath
        hasResume: c.hasResume !== undefined ? c.hasResume : (c.resumePath != null && c.resumePath !== '')
      }));
      
      setCandidates(updatedCandidates);
      
      // Update selectedCandidate if it exists to reflect the latest data
      if (selectedCandidate) {
        const updatedSelected = updatedCandidates.find(c => c.id === selectedCandidate.id);
        if (updatedSelected) {
          setSelectedCandidate(updatedSelected);
        }
      }
    } catch (error) {
      showToast('Error', error.message || 'Failed to load candidates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let result = [...candidates];
    
    // Filter by name
    if (nameSearch) {
      const term = nameSearch.toLowerCase();
      result = result.filter(c => c.name && c.name.toLowerCase().includes(term));
    }
    
    // Filter by email
    if (emailSearch) {
      const term = emailSearch.toLowerCase();
      result = result.filter(c => c.email && c.email.toLowerCase().includes(term));
    }
    
    // Filter by phone
    if (phoneSearch) {
      const term = phoneSearch.toLowerCase();
      result = result.filter(c => c.phone && c.phone.toLowerCase().includes(term));
    }
    
    // Filter by location
    if (locationSearch) {
      const term = locationSearch.toLowerCase();
      result = result.filter(c => c.location && c.location.toLowerCase().includes(term));
    }
    
    // Filter by skills
    if (skillsSearch) {
      const term = skillsSearch.toLowerCase();
      result = result.filter(c => c.skills && c.skills.toLowerCase().includes(term));
    }
    
    // Filter by job
    if (jobSearch) {
      const term = jobSearch.toLowerCase();
      result = result.filter(c => c.applications && c.applications.some(a => a.job?.jobName?.toLowerCase().includes(term)));
    }
    
    // Filter by candidate ID (dedicated search - exact match only)
    if (candidateIdSearch) {
      const idToSearch = candidateIdSearch.trim();
      // Only filter if the search term is numeric and matches exactly
      if (idToSearch && /^\d+$/.test(idToSearch)) {
        const searchId = parseInt(idToSearch, 10);
        result = result.filter(c => {
          if (c.id) {
            // Exact numeric match only
            return c.id === searchId;
          }
          return false;
        });
      } else {
        // If non-numeric input, show no results
        result = [];
      }
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    
    // Filter by location
    if (locationFilter) {
      const locationTerm = locationFilter.toLowerCase();
      result = result.filter(c => c.location && c.location.toLowerCase().includes(locationTerm));
    }
    
    // Filter by include skills (candidate MUST have these skills)
    if (includeSkillsFilter) {
      const includeSkills = includeSkillsFilter.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      result = result.filter(c => {
        if (!c.skills) return false;
        const candidateSkills = c.skills.toLowerCase();
        // All include skills must be present
        return includeSkills.every(skill => candidateSkills.includes(skill));
      });
    }
    
    // Filter by exclude skills (candidate MUST NOT have these skills)
    if (excludeSkillsFilter) {
      const excludeSkills = excludeSkillsFilter.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      result = result.filter(c => {
        if (!c.skills) return true; // If no skills, include the candidate
        const candidateSkills = c.skills.toLowerCase();
        // None of the exclude skills should be present
        return !excludeSkills.some(skill => candidateSkills.includes(skill));
      });
    }
    
    if (showMyCandidates && currentUserName) {
      const normalizedUser = currentUserName.trim().toLowerCase();
      result = result.filter(c => {
        const owner = (c.createdByUsername || "").toLowerCase();
        const ownerEmail = (c.createdByEmail || "").toLowerCase();
        return owner === normalizedUser || ownerEmail === normalizedUser;
      });
    }
    
    // Sort candidates
    switch(sortBy) {
      case 'newest':
        result.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA; // Newest first (descending)
        });
        break;
      case 'oldest':
        result.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateA - dateB; // Oldest first (ascending)
        });
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'id_asc':
        // Sort by ID: 1 to last (ascending)
        result.sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idA - idB; // Lowest ID first
        });
        break;
      case 'id_desc':
        // Sort by ID: last to 1 (descending)
        result.sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idB - idA; // Highest ID first
        });
        break;
      default:
        // Default to newest first
        result.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA; // Newest first (descending)
        });
        break;
    }
    
    setFilteredCandidates(result);
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleCandidateStatusChange = async (candidate, newStatus) => {
    if (!candidate?.id || !newStatus) return;
    try {
      await candidateAPI.update(candidate.id, { status: newStatus });
      showToast('Success', 'Candidate status updated', 'success');
      setCandidates(prev =>
        prev.map(c => (c.id === candidate.id ? { ...c, status: newStatus } : c))
      );
      setSelectedCandidate(prev =>
        prev && prev.id === candidate.id ? { ...prev, status: newStatus } : prev
      );
    } catch (error) {
      showToast('Error', error.message || 'Failed to update candidate status', 'error');
      throw error;
    }
  };

  const handleViewCandidate = (candidate) => {
    if (candidate?.id) {
      navigate(`/candidates/${candidate.id}`);
    }
  };

  const handleEditCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowEditModal(true);
  };

  const handleDeleteCandidate = (id) => {
    setCandidateToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    try {
      await candidateAPI.delete(candidateToDelete);
      showToast('Success', 'Candidate deleted successfully');
      setShowDeleteModal(false);
      setCandidateToDelete(null);
      loadCandidates();
      if (selectedCandidate?.id === candidateToDelete) setShowCandidateDetails(false);
    } catch (error) {
      // Show specific error message for candidates with applications
      if (error.message && error.message.includes('applications')) {
        showToast('Cannot Delete', 'This candidate has job applications. Please delete applications first.', 'error');
      } else {
        showToast('Error', error.message || 'Failed to delete candidate', 'error');
      }
      setShowDeleteModal(false);
      setCandidateToDelete(null);
    }
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / itemsPerPage));
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

  // Get status counts for stats

  return (
    <div className="flex min-h-screen bg-gray-50 mt-2">
      {/* Sidebar-style Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Candidate Management</h1>
              <p className="text-gray-600 mt-1">Manage and review all candidates</p>
            </div>
          </div>
        </div>

        {/* Simple Stats Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-1">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total Candidates:</span>
              <span className="text-lg font-semibold text-gray-900">{displayedCandidateCount}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMyCandidates((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showMyCandidates
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              <i className="fas fa-user-check"></i>
              {showMyCandidates ? "Show All Candidates" : `My Candidates (${recruiterCandidatesCount})`}
            </button>
          </div>
        </div>

        {/* Real-time ATS Search Bar - Separated Fields */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-4 mb-6 border border-purple-100">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Name Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                />
                {nameSearch && (
                  <button
                    onClick={() => setNameSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-purple-50 rounded-r-lg transition-colors"
                    title="Clear name search"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Email Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by email..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                />
                {emailSearch && (
                  <button
                    onClick={() => setEmailSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
                    title="Clear email search"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Phone Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by phone..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                />
                {phoneSearch && (
                  <button
                    onClick={() => setPhoneSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-green-50 rounded-r-lg transition-colors"
                    title="Clear phone search"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Location Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by location..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
                {locationSearch && (
                  <button
                    onClick={() => setLocationSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-orange-50 rounded-r-lg transition-colors"
                    title="Clear location search"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Skills Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Skills</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by skills..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200"
                  value={skillsSearch}
                  onChange={(e) => setSkillsSearch(e.target.value)}
                />
                {skillsSearch && (
                  <button
                    onClick={() => setSkillsSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-indigo-50 rounded-r-lg transition-colors"
                    title="Clear skills search"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Job Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Job</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by job..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white shadow-sm transition-all duration-200"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                />
                {jobSearch && (
                  <button
                    onClick={() => setJobSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-pink-50 rounded-r-lg transition-colors"
                    title="Clear job search"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ID Search - Compact */}
            <div className="w-full lg:w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1">Candidate ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Candidate ID..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm transition-all duration-200"
                  value={candidateIdSearch}
                  onChange={(e) => {
                    // Only allow numeric input
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setCandidateIdSearch(value);
                  }}
                  onKeyPress={(e) => {
                    // Only allow numeric keys
                    if (!/[0-9]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete') {
                      e.preventDefault();
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      filterCandidates();
                    }
                  }}
                />
                {candidateIdSearch && (
                  <button
                    onClick={() => {
                      setCandidateIdSearch('');
                      filterCandidates();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-teal-50 rounded-r-lg transition-colors"
                    title="Clear ID search"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Clear Button - Only show when search is active */}
            {(nameSearch || emailSearch || phoneSearch || locationSearch || skillsSearch || jobSearch || candidateIdSearch) && (
              <button
                onClick={() => {
                  setNameSearch('');
                  setEmailSearch('');
                  setPhoneSearch('');
                  setLocationSearch('');
                  setSkillsSearch('');
                  setJobSearch('');
                  setCandidateIdSearch('');
                }}
                className="px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Real-time Results Count */}
          {(nameSearch || emailSearch || phoneSearch || locationSearch || skillsSearch || jobSearch || candidateIdSearch) && (
            <div className="mt-3 flex items-center text-sm text-purple-700">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} found</span>
            </div>
          )}
        </div>

        {/* Quick Filters - Compact ATS Style */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                placeholder="Location"
                className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
              {locationFilter && (
                <button
                  onClick={() => setLocationFilter('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white min-w-[160px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
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
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">By Name</option>
                <option value="id_asc">ID: 1 to Last</option>
                <option value="id_desc">ID: Last to 1</option>
              </select>
            </div>

            {/* Clear All Filters */}
            {(locationFilter || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setLocationFilter('');
                  setStatusFilter('all');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Skills Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input
                type="text"
                placeholder="Include Skills (comma-separated)..."
                className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
                value={includeSkillsFilter}
                onChange={(e) => setIncludeSkillsFilter(e.target.value)}
              />
              {includeSkillsFilter && (
                <button
                  onClick={() => setIncludeSkillsFilter('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input
                type="text"
                placeholder="Exclude Skills (comma-separated)..."
                className="flex-1 px-3 py-2 text-sm border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                value={excludeSkillsFilter}
                onChange={(e) => setExcludeSkillsFilter(e.target.value)}
              />
              {excludeSkillsFilter && (
                <button
                  onClick={() => setExcludeSkillsFilter('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Add Candidate Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Candidate
            </button>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <CandidateTable
            candidates={currentItems}
            loading={loading}
            onViewCandidate={handleViewCandidate}
            onEditCandidate={handleEditCandidate}
            onDeleteCandidate={handleDeleteCandidate}
            onStatusChange={handleCandidateStatusChange}
            statusOptions={candidateStatusOptions}
          />
          
          {/* Pagination */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{currentItems.length}</span> of{' '}
              <span className="font-semibold">{filteredCandidates.length}</span> candidates
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
        {showCreateModal && (
          <CreateCandidateModal
            onClose={() => setShowCreateModal(false)}
            onCandidateCreated={() => { 
              setShowCreateModal(false); 
              loadCandidates(); 
              showToast('Success', 'Candidate created successfully'); 
            }}
            showToast={showToast}
          />
        )}

        {showEditModal && selectedCandidate && (
          <EditCandidateModal
            candidate={selectedCandidate}
            onClose={() => setShowEditModal(false)}
            onCandidateUpdated={() => { 
              setShowEditModal(false); 
              loadCandidates(); 
              showToast('Success', 'Candidate updated successfully'); 
            }}
            showToast={showToast}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            title="Delete Candidate"
            message="Are you sure you want to delete this candidate? This action cannot be undone."
            onConfirm={confirmDeleteCandidate}
            onClose={() => {
              setShowDeleteModal(false);
              setCandidateToDelete(null);
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

export default CandidateManagement;