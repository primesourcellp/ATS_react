import React, { useState, useEffect } from 'react';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import { websiteApplicationAPI, jobAPI } from '../../api/api';
import ApplicationDetailCard from './ApplicationDetailCard';

const WebsiteApplication = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [applicationIdSearch, setApplicationIdSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedJobFilter, setSelectedJobFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadApplications();
    loadJobs();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, applicationIdSearch, selectedJobFilter, statusFilter, sortBy]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await websiteApplicationAPI.getAll();
      setApplications(data || []);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await jobAPI.getAll();
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
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
        (app.applierName && app.applierName.toLowerCase().includes(term)) ||
        (app.email && app.email.toLowerCase().includes(term)) ||
        (app.phoneNumber && app.phoneNumber.toLowerCase().includes(term)) ||
        (app.currentLocation && app.currentLocation.toLowerCase().includes(term)) ||
        (app.skills && app.skills.toLowerCase().includes(term)) ||
        (app.jobName && app.jobName.toLowerCase().includes(term)) ||
        (app.clientName && app.clientName.toLowerCase().includes(term))
      );
    }

    // Filter by job
    if (selectedJobFilter !== 'all') {
      result = result.filter(app => app.job && app.job.id === parseInt(selectedJobFilter));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter);
    }

    // Sort applications
    switch(sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
        break;
      case 'name':
        result.sort((a, b) => (a.applierName || '').localeCompare(b.applierName || ''));
        break;
      default:
        break;
    }

    setFilteredApplications(result);
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Display all filtered applications
  const currentItems = filteredApplications;

  const getStatusBadge = (status) => {
    const statusConfig = {
      'REVIEWED': { color: 'bg-blue-100 text-blue-800', label: 'Reviewed' },
      'CONTACTED': { color: 'bg-purple-100 text-purple-800', label: 'Contacted' },
      'INTERVIEW': { color: 'bg-indigo-100 text-indigo-800', label: 'Interview' }
        };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Website Applications</h1>
              <p className="text-gray-600 mt-1">Manage and review all job applications from website</p>
            </div>
          </div>
        </div>

        {/* Real-time ATS Search Bar */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-4 mb-6 border border-purple-100">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* Application Count - Inline */}
            <div className="flex items-center gap-2 px-3 py-3.5 bg-white rounded-lg border-2 border-purple-200 shadow-sm">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-purple-700 whitespace-nowrap">Applications:</span>
              <span className="text-lg font-bold text-purple-900">{filteredApplications.length}</span>
            </div>

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
                  placeholder="Search by name, email, phone, location, skills, job, or client..."
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
            {/* Job Filter */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white min-w-[180px]"
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.jobName}</option>
                ))}
              </select>
              {selectedJobFilter !== 'all' && (
                <button
                  onClick={() => setSelectedJobFilter('all')}
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
                <option value="NOTVIEWED">Not Reviewed</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERVIEW">Interview</option>
              </select>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
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
              </select>
            </div>

            {/* Clear All Filters */}
            {(selectedJobFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedJobFilter('all');
                  setStatusFilter('all');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No applications found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job & Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Applied</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(application)}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                          >
                            {application.id}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="font-medium text-blue-700">
                                {application.applierName ? application.applierName.charAt(0).toUpperCase() : 'A'}
                              </span>
                            </div>
                            <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                                <button
                                  onClick={() => handleViewDetails(application)}
                                  className="text-blue-600 hover:text-blue-700 focus:outline-none underline"
                                >
                                  {application.applierName || 'N/A'}
                                </button>
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.currentLocation || 'Location not specified'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-sm text-gray-900">{application.email}</div>
                          <div className="text-sm text-gray-500">{application.phoneNumber || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{application.jobName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{application.clientName || 'No client'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-500">{formatDate(application.appliedAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">

                          <select
                        value={application.status || "NOTVIEWED"}
                        onChange={async (e) => {
                          try {
                            const newStatus = e.target.value || "NOTVIEWED";
                            await websiteApplicationAPI.updateStatus(application.id, newStatus);

                            // update local state
                            setApplications((prev) =>
                              prev.map((app) =>
                                app.id === application.id ? { ...app, status: newStatus } : app
                              )
                            );

                            showToast("Success", `Status updated to ${newStatus}`, "success");
                          } catch (error) {
                            showToast("Error", error.message || "Failed to update status", "error");
                          }
                        }}
                        className={`p-2 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 transition
                          ${
                            application.status === "NOTVIEWED"
                              ? "bg-red-100 text-red-700 border border-red-300 focus:ring-gray-400"
                              : application.status === "REVIEWED"
                              ? "bg-blue-100 text-blue-700 border border-blue-300 focus:ring-blue-400"
                              : application.status === "CONTACTED"
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-300 focus:ring-yellow-400"
                              : application.status === "INTERVIEW"
                              ? "bg-green-100 text-green-700 border border-green-300 focus:ring-green-400"
                              : "bg-white border border-gray-300 text-gray-800"
                          }`}
                      >
                        <option value="NOTVIEWED" className="text-gray-700">
                           Not Viewed
                        </option>
                        <option value="REVIEWED" className="text-blue-700">
                           Reviewed
                        </option>
                        <option value="CONTACTED" className="text-yellow-700">
                           Contacted
                        </option>
                        <option value="INTERVIEW" className="text-green-700">
                           Interview
                        </option>
</select>

                   </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                    onClick={() => handleViewDetails(application)}
                     className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors duration-150"
                        >
                                              View Details
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                
                                
                              
                              </>
                            )}
                          </div>

        {/* Application Detail Modal */}
        {showDetailModal && selectedApplication && (
          <ApplicationDetailCard 
            application={selectedApplication} 
            onClose={() => setShowDetailModal(false)}
            formatDate={formatDate}
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

export default WebsiteApplication;