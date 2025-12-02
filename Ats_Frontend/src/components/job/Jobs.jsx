import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI, jobAPI } from '../../api/api';
import Navbar from "../../layout/navbar";
import Toast from '../toast/Toast';
import CandidateListModal from './CandidateListModal';
import EditJobModal from './EditJobModal';
import JobDetailsModal from './JobDetailsModal';
import JobsTable from './JobsTable';
import JobForm from './jobForm';
import DeleteConfirmationModal from '../client/DeleteConfirmationModal';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showCandidateList, setShowCandidateList] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [idSearchTerm, setIdSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadJobs();
    loadClients();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, idSearchTerm, locationFilter, dateFilter, statusFilter, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await jobAPI.getAll();
      setJobs(jobsData || []);
    } catch (error) {
      showToast('Error', 'Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await clientAPI.getAll();
      setClients(clientsData || []);
    } catch (error) {
      showToast('Error', 'Failed to load clients', 'error');
    }
  };

  const filterJobs = () => {
    let result = [...jobs];

    // Filter by ID search (exact match)
    if (idSearchTerm) {
      const idToSearch = idSearchTerm.trim();
      result = result.filter(job => {
        if (job.id) {
          return job.id.toString() === idToSearch;
        }
        return false;
      });
    }

    // Search filter (job name, skills, client - NOT ID)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job =>
        (job.jobName && job.jobName.toLowerCase().includes(term)) ||
        (job.skillsName && job.skillsName.toLowerCase().includes(term)) ||
        (job.client?.clientName && job.client.clientName.toLowerCase().includes(term))
      );
    }

    // Location filter
    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      result = result.filter(job =>
        job.jobLocation && job.jobLocation.toLowerCase().includes(location)
      );
    }

    // Date filter
    if (dateFilter) {
      result = result.filter(job => {
        if (!job.createdAt) return false;
        const jobDate = new Date(job.createdAt).toISOString().split('T')[0];
        return jobDate === dateFilter;
      });
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(job => job.status === statusFilter);
    }

    // Sort jobs
    switch(sortBy) {
      case 'newest':
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Newest first (descending)
        });
        break;
      case 'oldest':
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB; // Oldest first (ascending)
        });
        break;
      case 'name':
        result.sort((a, b) => (a.jobName || '').localeCompare(b.jobName || ''));
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
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Newest first (descending)
        });
        break;
    }

    setFilteredJobs(result);
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setShowEditModal(true);
  };

  const handleDeleteJob = (jobId) => {
    setJobToDelete(jobId);
    setShowDeleteModal(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      const response = await jobAPI.delete(jobToDelete);

      if (response.success) {
        showToast("Success", "Job deleted successfully!", "success");
        setShowDeleteModal(false);
        setJobToDelete(null);
        loadJobs();
      } else {
        showToast("Warning", response.message || "Job cannot be deleted", "warning");
        setShowDeleteModal(false);
        setJobToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      // Show specific error message for jobs with applications
      if (error.message && (error.message.includes('applications') || error.message.includes('candidates'))) {
        showToast('Cannot Delete', 'This job has applications. Please delete applications first.', 'error');
      } else {
        showToast(
          "Error",
          error.message || "Failed to delete job. It may have candidates linked through applications.",
          "error"
        );
      }
      setShowDeleteModal(false);
      setJobToDelete(null);
    }
  };

  const handleViewCandidates = (job) => {
    setSelectedJob(job);
    setShowCandidateList(true);
    setShowJobDetails(false);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get status counts for stats
  const getStatusCounts = () => {
    const statusCounts = {
      'ACTIVE': 0,
      'INACTIVE': 0,
      'NOT_SELECTED': 0
    };
    
    jobs.forEach(job => {
      if (job.status && statusCounts.hasOwnProperty(job.status)) {
        statusCounts[job.status]++;
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
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
              <p className="text-gray-600 mt-1">Manage and review all job postings</p>
            </div>
          </div>
        </div>

        {/* Simple Stats Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-1">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total Jobs:</span>
              <span className="text-lg font-semibold text-gray-900">{jobs.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Active Jobs:</span>
              <span className="text-lg font-semibold text-green-600">{statusCounts.ACTIVE}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Inactive Jobs:</span>
              <span className="text-lg font-semibold text-red-600">{statusCounts.INACTIVE}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Default Status:</span>
              <span className="text-lg font-semibold text-yellow-600">{statusCounts.NOT_SELECTED}</span>
            </div>
          </div>
        </div>

        {/* Real-time ATS Search Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-4 mb-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* General Search - Large and Prominent */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search jobs by title, skills, or client name..."
                  className="w-full pl-12 pr-12 py-3.5 text-base border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Job ID..."
                  className="w-full pl-10 pr-10 py-3.5 text-base border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all duration-200"
                  value={idSearchTerm}
                  onChange={(e) => setIdSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      filterJobs();
                    }
                  }}
                />
                {idSearchTerm && (
                  <button
                    onClick={() => {
                      setIdSearchTerm('');
                      filterJobs();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-indigo-50 rounded-r-lg transition-colors"
                    title="Clear ID search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Clear Button - Only show when search is active */}
            {(searchTerm || idSearchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIdSearchTerm('');
                  loadJobs();
                }}
                className="px-4 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Real-time Results Count */}
          {(searchTerm || idSearchTerm) && (
            <div className="mt-3 flex items-center text-sm text-blue-700">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</span>
              {(searchTerm || idSearchTerm) && (
                <span className="ml-2 text-blue-600">
                  {searchTerm && `• "${searchTerm}"`}
                  {idSearchTerm && ` • ID: ${idSearchTerm}`}
                </span>
              )}
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
                className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="NOT_SELECTED">Default</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2 ml-auto">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            {(locationFilter || dateFilter || statusFilter) && (
              <button
                onClick={() => {
                  setLocationFilter('');
                  setDateFilter('');
                  setStatusFilter('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Job Listings
          </h2>
          <button
            onClick={() => setShowJobForm(!showJobForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showJobForm ? 'Close Form' : 'New Job'}
          </button>
        </div>

        {/* Job Form - Inline */}
        {showJobForm && (
          <div className="mb-6">
            <JobForm
              clients={clients}
              onJobAdded={() => {
                setShowJobForm(false);
                loadJobs();
                showToast('Success', 'Job added successfully');
              }}
              showToast={showToast}
            />
          </div>
        )}

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <JobsTable
            jobs={currentItems}
            loading={loading}
            onSelectJob={handleJobSelect}
            onEditJob={(job) => {
              setShowJobDetails(false);
              handleEditJob(job);
            }}
            onDeleteJob={handleDeleteJob}
          />
          
          {/* Pagination */}
          {filteredJobs.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredJobs.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredJobs.length}</span> jobs
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
        {showJobDetails && selectedJob && (
          <JobDetailsModal
            job={selectedJob}
            onClose={() => setShowJobDetails(false)}
            onViewCandidates={handleViewCandidates}
            onEditJob={(job) => {
              setShowJobDetails(false);
              handleEditJob(job);
            }}
          />
        )}

        {showCandidateList && selectedJob && (
          <CandidateListModal
            job={selectedJob}
            onClose={() => setShowCandidateList(false)}
            onViewCandidate={(candidate) => {
              setShowCandidateList(false);
              if (candidate?.id) {
                navigate(`/candidates/${candidate.id}`);
              }
            }}
          />
        )}

        {showEditModal && selectedJob && (
          <EditJobModal
            job={selectedJob}
            onClose={() => setShowEditModal(false)}
            onJobUpdated={() => {
              setShowEditModal(false);
              loadJobs();
              showToast('Success', 'Job updated successfully');
            }}
            showToast={showToast}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            title="Delete Job"
            message="Are you sure you want to delete this job? This action cannot be undone."
            onConfirm={confirmDeleteJob}
            onClose={() => {
              setShowDeleteModal(false);
              setJobToDelete(null);
            }}
          />
        )}

        {/* Toast notifications */}
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

export default JobManagement;