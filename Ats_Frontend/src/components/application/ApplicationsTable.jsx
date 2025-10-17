import React, { useState } from 'react';

const ApplicationsTable = ({
  applications,
  loading,
  onViewCandidate,
  onViewResume,
  onScheduleInterview,
  onEditApplication,
  onDeleteApplication
}) => {
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (appId) => {
    setExpandedAppId(expandedAppId === appId ? null : appId);
  };

  const getStatusClass = (status) => {
    const statusClassMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'INTERVIEWED': 'bg-purple-100 text-purple-800',
      'PLACED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'SUBMITTED_BY_CLIENT': 'bg-indigo-100 text-indigo-800',
      'CLIENT_SHORTLIST': 'bg-teal-100 text-teal-800',
      'FINAL_SELECT': 'bg-green-100 text-green-800',
      'JOINED': 'bg-green-100 text-green-800',
      'BACKEDOUT': 'bg-gray-100 text-gray-800'
    };
    return statusClassMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatusText = (status) => {
    return status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter applications based on status and search term
  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const candidateName = app.candidateName || app.candidate?.name || '';
    const jobName = app.job?.jobName || app.job?.title || '';
    
    const matchesSearch = searchTerm === '' || 
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading applications...</p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Applications Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">Try adjusting your search criteria or check back later for new applications.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Application
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Job Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Applied Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApplications.map((app, index) => {
              const candidateName = app.candidateName || app.candidate?.name || 'N/A';
              const candidateId = app.candidate?.id || '';
              const jobName = app.job?.jobName || app.job?.title || 'N/A';
              const appliedAt = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A';
              
              return (
                <React.Fragment key={app.id}>
                  <tr 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => toggleExpand(app.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-medium text-sm">
                            {candidateName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-gray-900 font-semibold">
                            {candidateName}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">ID: {app.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{jobName}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {app.job?.jobLocation || 'Location not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(app.status)}`}>
                        {app.status ? formatStatusText(app.status) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{appliedAt}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {expandedAppId === app.id ? 'Click to collapse' : 'Click to expand'}
                        </span>
                        <svg 
                          className={`w-5 h-5 transform transition-transform text-gray-400 ${expandedAppId === app.id ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </td>
                  </tr>
                  {expandedAppId === app.id && (
                    <tr className="bg-blue-50">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="space-y-6">
                          {/* Action Buttons Section */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Actions</h4>
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewCandidate(candidateId);
                                }}
                                className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                title="View Candidate"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                View Candidate
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewResume(app);
                                }}
                                className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                title="View Resume"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                View Resume
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onScheduleInterview(app);
                                }}
                                className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                title="Schedule Interview"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Schedule Interview
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditApplication(app);
                                }}
                                className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                                title="Edit Application"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Edit Application
                              </button>
                              
                              {/* Delete button - disabled if application has interviews */}
                              {app.hasInterviews ? (
                                <span 
                                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                                  title="Cannot delete application with existing interviews"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                  Delete (Has Interviews)
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteApplication(app.id);
                                  }}
                                  className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                  title="Delete Application"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                  Delete Application
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Information Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Candidate Information</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-600">Email:</div>
                                <div className="text-gray-900 font-medium">{app.candidate?.email || 'N/A'}</div>
                                
                                <div className="text-gray-600">Phone:</div>
                                <div className="text-gray-900 font-medium">{app.candidate?.phone || 'N/A'}</div>
                                
                                <div className="text-gray-600">Experience:</div>
                                <div className="text-gray-900 font-medium">{app.candidate?.experience || 'Not specified'}</div>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Application Details</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-600">Job ID:</div>
                                <div className="text-gray-900 font-medium">{app.job?.id || 'N/A'}</div>
                                
                                <div className="text-gray-600">Client:</div>
                                <div className="text-gray-900 font-medium">
                                  {app.job?.client?.clientName || 'Client not found'}
                                </div>

                                <div className="text-gray-600">Skills:</div>
                                <div className="text-gray-900 font-medium">
                                  {app.job?.skillsName ? app.job.skillsName.split(',').slice(0, 3).join(', ') : 'Not specified'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table footer with summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredApplications.length}</span> of <span className="font-medium">{applications.length}</span> applications
          </p>
          {statusFilter !== 'ALL' && (
            <button 
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setStatusFilter('ALL')}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsTable;