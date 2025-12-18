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
  const [searchByResume, setSearchByResume] = useState(false);
  const [resumeSearchLoading, setResumeSearchLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedKeywords, setAdvancedKeywords] = useState('');
  const [booleanSearch, setBooleanSearch] = useState(false);
  const [minExperience, setMinExperience] = useState('');
  const [maxExperience, setMaxExperience] = useState('');
  const [advancedLocation, setAdvancedLocation] = useState('');
  const [includeRelocate, setIncludeRelocate] = useState(true);
  const [searchInResume, setSearchInResume] = useState(true);
  const [candidateIdSearch, setCandidateIdSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentUserName, setCurrentUserName] = useState(localStorage.getItem("username") || "");
  const [showMyCandidates, setShowMyCandidates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [resumeSearchCount, setResumeSearchCount] = useState(null);
  const [resumeSearchKeywords, setResumeSearchKeywords] = useState('');
  const [totalCandidateCount, setTotalCandidateCount] = useState(0);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
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
    loadTotalCount();
  }, []);

  const loadTotalCount = async () => {
    try {
      const count = await candidateAPI.getCount();
      setTotalCandidateCount(count);
    } catch (error) {
      console.error('Error loading candidate count:', error);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [nameSearch, emailSearch, phoneSearch, locationSearch, skillsSearch, jobSearch, candidateIdSearch, statusFilter, locationFilter, sortBy, showMyCandidates, searchByResume]);

  // Handle resume-based search
  useEffect(() => {
    if (searchByResume && skillsSearch.trim()) {
      performResumeSearch(skillsSearch);
    } else if (!searchByResume && skillsSearch) {
      // If resume search is disabled but skills search exists, reload all candidates
      // This will allow normal filtering to work
      loadCandidates();
    }
  }, [searchByResume]); // Only depend on searchByResume to avoid infinite loops

  // Handle skills search change when resume search is enabled
  useEffect(() => {
    if (searchByResume && skillsSearch.trim()) {
      const timeoutId = setTimeout(() => {
        performResumeSearch(skillsSearch);
      }, 500); // Debounce search by 500ms
      return () => clearTimeout(timeoutId);
    }
  }, [skillsSearch, searchByResume]);

  const performResumeSearch = async (keywords) => {
    if (!keywords || !keywords.trim()) {
      loadCandidates();
      setResumeSearchCount(null);
      setResumeSearchKeywords('');
      return;
    }

    try {
      setResumeSearchLoading(true);
      setResumeSearchKeywords(keywords);
      
      // Fetch count and results in parallel
      const [results, countData] = await Promise.all([
        candidateAPI.searchByResumeContent(keywords),
        candidateAPI.getResumeSearchCount(keywords)
      ]);
      
      setCandidates(results);
      setResumeSearchCount(countData.count || results.length);
    } catch (error) {
      console.error('Error searching resumes:', error);
      showToast('Error', 'Failed to search resumes. Please try again.', 'error');
      loadCandidates(); // Fallback to loading all candidates
      setResumeSearchCount(null);
      setResumeSearchKeywords('');
    } finally {
      setResumeSearchLoading(false);
    }
  };

  const handleAdvancedSearch = async () => {
    if (!advancedKeywords || !advancedKeywords.trim()) {
      showToast('Info', 'Please enter keywords to search', 'info');
      return;
    }

    try {
      setResumeSearchLoading(true);
      let filtered = [];
      
      // If search in resume is enabled, use resume search
      if (searchInResume) {
        setResumeSearchKeywords(advancedKeywords);
        // Fetch count and results in parallel
        const [results, countData] = await Promise.all([
          candidateAPI.searchByResumeContent(advancedKeywords),
          candidateAPI.getResumeSearchCount(advancedKeywords)
        ]);
        filtered = results;
        setResumeSearchCount(countData.count || results.length);
      } else {
        setResumeSearchCount(null);
        setResumeSearchKeywords('');
        // Regular search in skills field
        filtered = [...candidates];
        
        // Filter by keywords in skills
        const keywords = advancedKeywords.toLowerCase().split(/\s+(and|or)\s+/i).filter(k => k !== 'and' && k !== 'or');
        filtered = filtered.filter(c => {
          const skills = (c.skills || '').toLowerCase();
          // Simple keyword matching (can be enhanced for boolean logic)
          return keywords.some(keyword => skills.includes(keyword));
        });
      }
      
      // Apply experience filter
      if (minExperience || maxExperience) {
        filtered = filtered.filter(c => {
          const exp = parseFloat(c.experience) || 0;
          const min = parseFloat(minExperience) || 0;
          const max = parseFloat(maxExperience) || Infinity;
          return exp >= min && exp <= max;
        });
      }
      
      // Apply location filter
      if (advancedLocation) {
        const locationTerm = advancedLocation.toLowerCase();
        filtered = filtered.filter(c => {
          const location = (c.location || '').toLowerCase();
          return location.includes(locationTerm);
        });
      }
      
      setCandidates(filtered);
      
      // Debug: Log search results
      console.log('=== RESUME SEARCH DEBUG ===');
      console.log('Search Keywords:', advancedKeywords);
      console.log('Search in Resume:', searchInResume);
      console.log('Found Candidates:', filtered.length);
      console.log('Total Matching Count:', resumeSearchCount);
      console.log('Candidates:', filtered.map(c => ({ id: c.id, name: c.name, hasResume: !!c.resumePath })));
      console.log('=== END DEBUG ===');
      
      const countMessage = searchInResume && resumeSearchCount !== null 
        ? `Found ${filtered.length} candidates (${resumeSearchCount} total matching skills)`
        : `Found ${filtered.length} candidates`;
      showToast('Success', countMessage, 'success');
    } catch (error) {
      console.error('Error in advanced search:', error);
      showToast('Error', 'Failed to search candidates. Please try again.', 'error');
    } finally {
      setResumeSearchLoading(false);
    }
  };

  // Backfill resume text for existing candidates
  const handleBackfillResumeText = async () => {
    const confirmed = window.confirm(
      'This will process all existing resumes and extract their text for fast searching.\n\n' +
      'This may take several minutes depending on the number of resumes.\n\n' +
      'Do you want to continue?'
    );
    
    if (!confirmed) return;
    
    setBackfillLoading(true);
    setBackfillResult(null);
    
    try {
      showToast('Info', 'Starting resume text backfill... This may take a few minutes.', 'info');
      
      const result = await candidateAPI.backfillResumeText(50);
      setBackfillResult(result);
      
      const message = `Backfill completed!\n` +
        `Total: ${result.totalCandidates}\n` +
        `Success: ${result.totalSuccess}\n` +
        `Failed: ${result.totalFailed}\n` +
        `Time: ${result.durationSeconds}s`;
      
      showToast('Success', message, 'success');
      
      // Reload candidates to refresh data
      await loadCandidates();
      await loadTotalCount();
      
    } catch (error) {
      console.error('Error during backfill:', error);
      showToast('Error', 'Failed to backfill resume text: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setBackfillLoading(false);
    }
  };

  // Test function to view extracted resume text (for debugging)
  const testResumeExtraction = async (candidateId) => {
    try {
      const result = await candidateAPI.getResumeText(candidateId);
      console.log('=== RESUME TEXT EXTRACTION TEST ===');
      console.log('Candidate ID:', result.candidateId);
      console.log('Candidate Name:', result.candidateName);
      console.log('Resume Path:', result.resumePath);
      console.log('Text Length:', result.textLength);
      console.log('Preview (first 500 chars):', result.preview);
      console.log('Full Text:', result.resumeText);
      console.log('=== END TEST ===');
      
      // Show in alert for easy viewing
      alert(`Resume Text for ${result.candidateName}:\n\nLength: ${result.textLength} characters\n\nPreview:\n${result.preview}\n\nCheck console for full text.`);
    } catch (error) {
      console.error('Error testing resume extraction:', error);
      showToast('Error', 'Failed to extract resume text: ' + error.message, 'error');
    }
  };

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
    sortBy,
    showMyCandidates,
    currentUserName
  ]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setResumeSearchCount(null);
      setResumeSearchKeywords('');
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
      
      // Update total count
      await loadTotalCount();
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
    
    // Skills search is now handled in advanced search panel
    
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
    <>
      {/* Main content */}
      <main className="flex-1 p-6" style={{ position: 'relative' }}>
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Total Candidates:</span>
                    <span className="text-lg font-semibold text-gray-900">{totalCandidateCount > 0 ? totalCandidateCount : displayedCandidateCount}</span>
                    {totalCandidateCount > 0 && displayedCandidateCount !== totalCandidateCount && (
                      <span className="text-sm text-gray-500">(Showing {displayedCandidateCount})</span>
                    )}
                  </div>
                  {resumeSearchCount !== null && resumeSearchKeywords && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg shadow-sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold">Matching Skills:</span>
                      <span className="text-base font-bold">{resumeSearchCount.toLocaleString()}</span>
                      <span className="text-xs text-blue-100">({resumeSearchKeywords})</span>
                    </div>
                  )}
                </div>
            <div className="flex items-center gap-3">
              {/* My Candidates Button */}
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
              
              {/* Backfill Resume Text Button */}
              <button
                type="button"
                onClick={handleBackfillResumeText}
                disabled={backfillLoading}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  backfillLoading
                    ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "border-green-500 bg-green-50 text-green-700 hover:border-green-600 hover:bg-green-100"
                }`}
                title="Extract and store resume text for all existing candidates to enable fast search"
              >
                {backfillLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Backfill Resume Text
                  </>
                )}
              </button>
              
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
          
          {/* Backfill Result Display */}
          {backfillResult && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Backfill Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Candidates:</span>
                      <span className="ml-2 font-semibold text-gray-900">{backfillResult.totalCandidates}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Success:</span>
                      <span className="ml-2 font-semibold text-green-700">{backfillResult.totalSuccess}</span>
                    </div>
                    <div>
                      <span className="text-red-600">Failed:</span>
                      <span className="ml-2 font-semibold text-red-700">{backfillResult.totalFailed}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-semibold text-gray-900">{backfillResult.durationSeconds}s</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBackfillResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
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
            {(nameSearch || emailSearch || phoneSearch || locationSearch || jobSearch || candidateIdSearch) && (
              <button
                onClick={() => {
                  setNameSearch('');
                  setEmailSearch('');
                  setPhoneSearch('');
                  setLocationSearch('');
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

            {/* Advanced Search Button */}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium shadow-sm text-sm ${
                showAdvancedSearch
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {showAdvancedSearch ? 'Hide Search' : 'Advanced Search'}
            </button>

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
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Candidates</h3>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Keywords Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Keywords</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={booleanSearch}
                        onChange={(e) => setBooleanSearch(e.target.checked)}
                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>Boolean</span>
                    </label>
                    {advancedKeywords && (
                      <button
                        onClick={() => setAdvancedKeywords('')}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={booleanSearch ? "e.g., python and Django and (React or Next)" : "Enter keywords (e.g., Java, Spring Boot)"}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={advancedKeywords}
                  onChange={(e) => setAdvancedKeywords(e.target.value)}
                />
                <div className="mt-2">
                  <select
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={searchInResume ? 'resume' : 'skills'}
                    onChange={(e) => setSearchInResume(e.target.value === 'resume')}
                  >
                    <option value="resume">Search keyword in Entire resume</option>
                    <option value="skills">Search keyword in Skills field</option>
                  </select>
                </div>
              </div>

              {/* Experience Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Min experience"
                    className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Max experience"
                    className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={maxExperience}
                    onChange={(e) => setMaxExperience(e.target.value)}
                  />
                  <span className="text-gray-500">Years</span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current location of candidate</label>
                <input
                  type="text"
                  placeholder="Add location"
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={advancedLocation}
                  onChange={(e) => setAdvancedLocation(e.target.value)}
                />
                <div className="mt-2 space-y-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRelocate}
                      onChange={(e) => setIncludeRelocate(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>Include candidates who prefer to relocate to above locations</span>
                  </label>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleAdvancedSearch}
                  disabled={resumeSearchLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {resumeSearchLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search candidates
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
      <div className="flex min-h-screen bg-gray-50 mt-2">
        {/* Sidebar-style Navbar */}
        <Navbar />
      </div>
    </>
  );
};

export default CandidateManagement;