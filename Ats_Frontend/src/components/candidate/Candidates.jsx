import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import CandidateTable from './CandidateTable';
import CreateCandidateModal from './CreateCandidateModal';
import EditCandidateModal from './EditCandidateModal';
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
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
  }, [searchTerm, candidateIdSearch, statusFilter, locationFilter, includeSkillsFilter, excludeSkillsFilter, sortBy, showMyCandidates]);

  useEffect(() => {
    filterCandidates();
  }, [
    candidates,
    searchTerm,
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
      
      // Ensure applications array exists
      setCandidates(candidatesData.map(c => ({ 
        ...c, 
        applications: Array.isArray(c.applications) ? c.applications : [] 
      })));
    } catch (error) {
      showToast('Error', error.message || 'Failed to load candidates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let result = [...candidates];
    
    // Filter by search term (general search)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.location && c.location.toLowerCase().includes(term)) ||
        (c.skills && c.skills.toLowerCase().includes(term)) ||
        (c.applications && c.applications.some(a => a.job?.jobName?.toLowerCase().includes(term)))
      );
    }
    
    // Filter by candidate ID (dedicated search)
    if (candidateIdSearch) {
      const idTerm = candidateIdSearch.toLowerCase();
      result = result.filter(c => c.id && c.id.toString().includes(idTerm));
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

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      await candidateAPI.delete(id);
      showToast('Success', 'Candidate deleted successfully');
      loadCandidates();
      if (selectedCandidate?.id === id) setShowCandidateDetails(false);
    } catch (error) {
      // Show specific error message for candidates with applications
      if (error.message && error.message.includes('applications')) {
        showToast('Cannot Delete', 'This candidate has job applications. Please delete applications first.', 'error');
      } else {
        showToast('Error', error.message || 'Failed to delete candidate', 'error');
      }
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
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                userRole === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
              }`}>
                {userRole}
              </span>
              <div className="flex items-center text-sm bg-white rounded-lg shadow-sm px-3 py-2 border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-700">{localStorage.getItem("username") || "User"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 mb-1">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">
                    {showMyCandidates
                      ? `My Candidates (${recruiterDisplayName})`
                      : "Total Candidates"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {showMyCandidates
                      ? `Showing candidates added by ${recruiterDisplayName}.`
                      : "Across all recruiters"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMyCandidates((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showMyCandidates
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:text-green-600"
                }`}
              >
                <i className="fas fa-user-check"></i>
                {showMyCandidates ? "Show All Candidates" : "My Candidates"}
              </button>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-semibold text-gray-900">
                {displayedCandidateCount}
              </p>
              {currentUserName && (
                <p className="text-xs text-gray-500 mt-1">
                  {showMyCandidates
                    ? `${recruiterDisplayName
                        .charAt(0)
                        .toUpperCase()}${recruiterDisplayName.slice(1)} has ${recruiterCandidatesCount} candidate${
                        recruiterCandidatesCount === 1 ? "" : "s"
                      } in total.`
                    : `You have added ${recruiterCandidatesCount} candidate${
                        recruiterCandidatesCount === 1 ? "" : "s"
                      }.`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Candidates</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, phone, location, or skills..."
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ID"
                  className="pl-8 w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={candidateIdSearch}
                  onChange={(e) => setCandidateIdSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 19l-4.95-5.05a7 7 0 010-9.9zM10 11a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter location (e.g., Chennai)"
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <option value="INTERNEL_REJECT">Internel Reject</option>
                <option value="CLIENT_REJECT">Client Reject</option>
                <option value="FINAL_SELECT">Final Select</option>
                <option value="JOINED">Joined</option>
                <option value="BACKEDOUT">Backed Out</option>
                <option value="NOT_RELEVANT">Not Relevant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          </div>
          
          {/* Skills Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include Skills <span className="text-gray-500 font-normal text-xs">(comma-separated)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Java, Python, React"
                  className="pl-10 w-full p-2.5 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
                  value={includeSkillsFilter}
                  onChange={(e) => setIncludeSkillsFilter(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Candidates MUST have all these skills</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclude Skills <span className="text-gray-500 font-normal text-xs">(comma-separated)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Spring Boot, Angular"
                  className="pl-10 w-full p-2.5 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  value={excludeSkillsFilter}
                  onChange={(e) => setExcludeSkillsFilter(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Candidates MUST NOT have any of these skills</p>
            </div>
          </div>

          {/* Add Candidate Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Candidate
              </button>
            </div>
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