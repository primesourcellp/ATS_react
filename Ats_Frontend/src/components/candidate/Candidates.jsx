import React, { useState, useEffect } from 'react';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import CandidateTable from './CandidateTable';
import CandidateDetailsModal from './CandidateDetail';
import CreateCandidateModal from './CreateCandidateModal';
import EditCandidateModal from './EditCandidateModal';
import { candidateAPI } from '../../api/api';

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, candidateIdSearch, statusFilter, locationFilter, includeSkillsFilter, excludeSkillsFilter, sortBy]);

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

  const handleViewCandidate = async (candidate) => {
    try {
      setLoading(true);
      const candidateDetails = await candidateAPI.getById(candidate.id);
      setSelectedCandidate(candidateDetails);
      setShowCandidateDetails(true);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load candidate details', 'error');
    } finally {
      setLoading(false);
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
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get status counts for stats
  const getStatusCounts = () => {
    const statusCounts = {
      'NEW_CANDIDATE': 0,
      'PENDING': 0,
      'SCHEDULED': 0,
      'INTERVIEWED': 0,
      'PLACED': 0,
      'REJECTED': 0
    };
    
    candidates.forEach(candidate => {
      if (candidate.status && statusCounts.hasOwnProperty(candidate.status)) {
        statusCounts[candidate.status]++;
      }
    });
    
    return statusCounts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar-style Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6 py-10">
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Total Candidates</h3>
                <p className="text-2xl font-semibold text-gray-900">{candidates.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-emerald-100 p-3">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">New Candidate</h3>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.NEW_CANDIDATE}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-yellow-100 p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Pending</h3>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.PENDING}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Scheduled</h3>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.SCHEDULED}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Interviewed</h3>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.INTERVIEWED}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Placed</h3>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.PLACED}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
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

            <div className="md:col-span-1">
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
                <option value="SUBMITTED_BY_CLIENT">Submitted by Client</option>
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
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Location</label>
              <input
                type="text"
                placeholder="Enter location (e.g., Chennai, Bangalore, Pune...)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
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
          />
          
          {/* Pagination */}
          {filteredCandidates.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredCandidates.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredCandidates.length}</span> candidates
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === number
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCandidateDetails && selectedCandidate && (
          <CandidateDetailsModal
            candidate={selectedCandidate}
            onClose={() => setShowCandidateDetails(false)}
            onEdit={() => handleEditCandidate(selectedCandidate)}
            onDelete={() => handleDeleteCandidate(selectedCandidate.id)}
          />
        )}

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