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
  }, [applications, searchTerm, selectedJobFilter, statusFilter, sortBy]);

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

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app => 
        (app.id && app.id.toString().includes(term)) ||
        (app.applierName && app.applierName.toLowerCase().includes(term)) ||
        (app.email && app.email.toLowerCase().includes(term)) ||
        (app.phoneNumber && app.phoneNumber.includes(term)) ||
        (app.currentLocation && app.currentLocation.toLowerCase().includes(term)) ||
        (app.skills && app.skills.toLowerCase().includes(term))
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
        <div className="mb-6 py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Website Applications</h1>
              <p className="text-gray-600 mt-1">Manage and review all job applications</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Total Applications</h3>
                <p className="text-2xl font-semibold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Contacted</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {applications.filter(app => app.status === 'CONTACTED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Interviews</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {applications.filter(app => app.status === 'INTERVIEW').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-lg bg-red-100 p-3">
               <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
    d="M9 12l2 2l4-4M7 21h10a2 2 0 002-2V7a2 2 0 00-.586-1.414l-4-4A2 2 0 0013 1H7a2 2 0 00-2 2v16a2 2 0 002 2z" />
</svg>

              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">Reviewed</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {applications.filter(app => app.status === 'REVIEWED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Applications</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, skills..."
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Job</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.jobName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="NOTVIEWED">Not Reviewed</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERVIEW">Interview</option>
               
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
              </select>
            </div>
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
                              <div className="text-xs text-gray-400">
                                ID: {application.id}
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