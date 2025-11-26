import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ApplicationsTable = ({
  applications,
  loading,
  highlightId,
  onClearHighlight,
  onViewCandidate,
  onViewApplication,
  onViewResume,
  onScheduleInterview,
  onEditApplication,
  onDeleteApplication,
  onStatusChange,
  statusOptions = [],
  currentUserName = ""
}) => {
  const navigate = useNavigate();
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedRow, setHighlightedRow] = useState(null);
  const rowRefs = useRef({});
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [statusDescriptionInputs, setStatusDescriptionInputs] = useState({});
  const [statusSelectValues, setStatusSelectValues] = useState({});

  const toggleExpand = (appId) => {
    setExpandedAppId(prev => (prev === appId ? null : appId));
    if (onClearHighlight) {
      onClearHighlight();
    }
  };

  const handleStatusChange = async (application, newStatus, originalStatus) => {
    if (!newStatus || newStatus === originalStatus || !onStatusChange) return;
    
    const description = statusDescriptionInputs[application.id] || '';
    
    setUpdatingStatusId(application.id);
    try {
      await onStatusChange(application, newStatus, description);
      // Clear the temporary select value and description input
      setStatusSelectValues(prev => {
        const updated = { ...prev };
        delete updated[application.id];
        return updated;
      });
      setStatusDescriptionInputs(prev => {
        const updated = { ...prev };
        delete updated[application.id];
        return updated;
      });
    } catch (error) {
      // On error, reset to original status
      setStatusSelectValues(prev => {
        const updated = { ...prev };
        updated[application.id] = originalStatus;
        return updated;
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getStatusClass = (status) => {
    const statusClassMap = {
      NEW_CANDIDATE: 'bg-emerald-100 text-emerald-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      INTERVIEWED: 'bg-purple-100 text-purple-800',
      PLACED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      NOT_INTERESTED: 'bg-gray-100 text-gray-800',
      HOLD: 'bg-amber-100 text-amber-800',
      HIGH_CTC: 'bg-rose-100 text-rose-800',
      DROPPED_BY_CLIENT: 'bg-red-100 text-red-800',
      SUBMITTED_TO_CLIENT: 'bg-indigo-100 text-indigo-800',
      NO_RESPONSE: 'bg-orange-100 text-orange-800',
      IMMEDIATE: 'bg-emerald-100 text-emerald-800',
      REJECTED_BY_CLIENT: 'bg-rose-100 text-rose-700',
      CLIENT_SHORTLIST: 'bg-teal-100 text-teal-800',
      FIRST_INTERVIEW_SCHEDULED: 'bg-blue-100 text-blue-800',
      FIRST_INTERVIEW_FEEDBACK_PENDING: 'bg-orange-100 text-orange-800',
      FIRST_INTERVIEW_REJECT: 'bg-red-100 text-red-800',
      SECOND_INTERVIEW_SCHEDULED: 'bg-blue-100 text-blue-800',
      SECOND_INTERVIEW_FEEDBACK_PENDING: 'bg-orange-100 text-orange-800',
      SECOND_INTERVIEW_REJECT: 'bg-red-100 text-red-800',
      THIRD_INTERVIEW_SCHEDULED: 'bg-blue-100 text-blue-800',
      THIRD_INTERVIEW_FEEDBACK_PENDING: 'bg-orange-100 text-orange-800',
      THIRD_INTERVIEW_REJECT: 'bg-red-100 text-red-800',
      INTERNEL_REJECT: 'bg-red-100 text-red-800',
      CLIENT_REJECT: 'bg-red-100 text-red-800',
      FINAL_SELECT: 'bg-green-100 text-green-800',
      JOINED: 'bg-green-100 text-green-800',
      BACKEDOUT: 'bg-gray-100 text-gray-800',
      NOT_RELEVANT: 'bg-gray-100 text-gray-800'
    };
    return statusClassMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatusText = (status) => {
    const customLabels = {
      SUBMITTED_TO_CLIENT: 'Submitted to Client',
      NO_RESPONSE: 'No Response',
      IMMEDIATE: 'Immediate',
      REJECTED_BY_CLIENT: 'Rejected by Client'
    };

    if (customLabels[status]) {
      return customLabels[status];
    }

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
    const ownerText = [
      app.candidate?.createdByUsername,
      app.candidate?.createdByEmail,
      app.createdByUsername,
      app.createdByEmail
    ]
      .filter(Boolean)
      .join(' ');
    
    const matchesSearch = searchTerm === '' || 
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerText.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    if (highlightId == null) {
      return undefined;
    }

    const targetId = Number(highlightId);
    const row = rowRefs.current[targetId];
    if (!row) {
      return undefined;
    }

    setExpandedAppId(targetId);
    setHighlightedRow(targetId);
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const timer = setTimeout(() => {
      setHighlightedRow(null);
      if (onClearHighlight) {
        onClearHighlight();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [highlightId, filteredApplications, onClearHighlight]);

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
                ID
              </th>
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
                Assigned By
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
              const candidateOwner = app.candidate?.createdByUsername || app.candidate?.createdByEmail || 'N/A';
              const candidateOwnerEmail = app.candidate?.createdByEmail || '';
              const applicationOwner = app.createdByUsername || app.createdByEmail || 'N/A';
              const applicationOwnerEmail = app.createdByEmail || '';
              const appliedAt = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A';
              const isHighlighted = highlightedRow === app.id;
              
              return (
                <React.Fragment key={app.id}>
                  <tr 
                    ref={(el) => {
                      if (el) {
                        rowRefs.current[app.id] = el;
                      } else {
                        delete rowRefs.current[app.id];
                      }
                    }}
                    className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${isHighlighted ? 'bg-emerald-50' : ''}`}
                    onClick={() => toggleExpand(app.id)}
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewApplication) {
                            onViewApplication(app.id);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                      >
                        {app.id}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-medium text-sm">
                            {candidateName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-gray-900 font-semibold">
                            {candidateName !== 'N/A' ? (
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onClearHighlight) {
                                    onClearHighlight();
                                  }
                                  if (onViewCandidate) {
                                    onViewCandidate(candidateId);
                                  }
                                }}
                              >
                            {candidateName}
                              </button>
                            ) : (
                              candidateName
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (app.job?.id) {
                            navigate(`/jobs/${app.job.id}`);
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline text-left"
                      >
                        {jobName}
                      </button>
                      <div className="text-sm text-gray-500 mt-1">
                        {app.job?.jobLocation || 'Location not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          // Check if current user is the one who assigned the job
                          const isAssignedByCurrentUser = app.createdByUsername && 
                            currentUserName && 
                            app.createdByUsername.trim().toLowerCase() === currentUserName.trim().toLowerCase();
                          const currentUserRole = (localStorage.getItem("role") || "").replace("ROLE_", "").toUpperCase();
                          const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "SECONDARY_ADMIN";
                          const canModify = isAssignedByCurrentUser || isAdmin;
                          
                          if (!canModify) {
                            // User is not the assigner - show read-only status badge
                            return (
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-2 rounded-full text-xs font-medium ${getStatusClass(app.status)}`}>
                                  {formatStatusText(app.status)}
                                </span>
                                <span className="text-xs text-gray-500" title="Only the user who assigned this job can change the status">
                                  <i className="fas fa-lock"></i>
                                </span>
                              </div>
                            );
                          }
                          
                          // User is the assigner - allow status change
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="relative inline-flex items-center">
                                  <select
                                    value={statusSelectValues[app.id] !== undefined ? statusSelectValues[app.id] : (app.status || '')}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      const originalStatus = app.status;
                                      if (!newStatus || newStatus === originalStatus) {
                                        // If same status, clear any pending description
                                        setStatusDescriptionInputs(prev => {
                                          const updated = { ...prev };
                                          delete updated[app.id];
                                          return updated;
                                        });
                                        setStatusSelectValues(prev => {
                                          const updated = { ...prev };
                                          delete updated[app.id];
                                          return updated;
                                        });
                                        return;
                                      }
                                      // Temporarily update the select value
                                      setStatusSelectValues(prev => ({ ...prev, [app.id]: newStatus }));
                                      // Initialize description input if not exists
                                      if (!statusDescriptionInputs[app.id]) {
                                        setStatusDescriptionInputs(prev => ({ ...prev, [app.id]: '' }));
                                      }
                                    }}
                                    className={`inline-flex items-center px-2.5 py-2 rounded-full text-xs font-medium cursor-pointer appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-offset-1 ${getStatusClass(statusSelectValues[app.id] !== undefined ? statusSelectValues[app.id] : app.status)}`}
                                    style={{ 
                                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                                      backgroundRepeat: 'no-repeat',
                                      backgroundPosition: 'right 0.25rem center',
                                      backgroundSize: '1em 1em',
                                      paddingRight: '1.75rem'
                                    }}
                                  >
                                    {statusOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {updatingStatusId === app.id && (
                                  <i className="fas fa-spinner fa-spin text-blue-500 text-xs"></i>
                                )}
                              </div>
                              {/* Inline description input */}
                              {statusSelectValues[app.id] !== undefined && statusSelectValues[app.id] !== app.status && (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    value={statusDescriptionInputs[app.id] || ''}
                                    onChange={(e) => {
                                      setStatusDescriptionInputs(prev => ({
                                        ...prev,
                                        [app.id]: e.target.value
                                      }));
                                    }}
                                    placeholder="Add a description or notes about this status change... (optional)"
                                    rows="2"
                                    className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const newStatus = statusSelectValues[app.id];
                                        const originalStatus = app.status;
                                        if (newStatus && newStatus !== originalStatus) {
                                          handleStatusChange(app, newStatus, originalStatus);
                                        }
                                      }}
                                      disabled={updatingStatusId === app.id}
                                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {updatingStatusId === app.id ? 'Saving...' : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setStatusSelectValues(prev => {
                                          const updated = { ...prev };
                                          delete updated[app.id];
                                          return updated;
                                        });
                                        setStatusDescriptionInputs(prev => {
                                          const updated = { ...prev };
                                          delete updated[app.id];
                                          return updated;
                                        });
                                      }}
                                      disabled={updatingStatusId === app.id}
                                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {applicationOwner}
                      </div>
                      {applicationOwnerEmail && (
                        <div className="text-xs text-gray-500">{applicationOwnerEmail}</div>
                      )}
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
                      <td colSpan="6" className="px-6 py-4">
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
                                  if (onClearHighlight) {
                                    onClearHighlight();
                                  }
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
                              
                              {(() => {
                                const isAssignedByCurrentUser = app.createdByUsername && 
                                  currentUserName && 
                                  app.createdByUsername.trim().toLowerCase() === currentUserName.trim().toLowerCase();
                                const currentUserRole = (localStorage.getItem("role") || "").replace("ROLE_", "").toUpperCase();
                                const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "SECONDARY_ADMIN";
                                const canModify = isAssignedByCurrentUser || isAdmin;
                                
                                if (!canModify) {
                                  return (
                                    <>
                                      <span 
                                        className="flex items-center px-3 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                                        title="Only the user who assigned this job can schedule interviews"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        Schedule Interview <i className="fas fa-lock ml-1 text-xs"></i>
                                      </span>
                                      
                                      <span 
                                        className="flex items-center px-3 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                                        title="Only the user who assigned this job can edit the application"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                        Edit Application <i className="fas fa-lock ml-1 text-xs"></i>
                                      </span>
                                      
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
                                        <span 
                                          className="flex items-center px-3 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                                          title="Only the user who assigned this job can delete the application"
                                        >
                                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                          </svg>
                                          Delete Application <i className="fas fa-lock ml-1 text-xs"></i>
                                        </span>
                                      )}
                                    </>
                                  );
                                }
                                
                                return (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onClearHighlight) {
                                          onClearHighlight();
                                        }
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
                                        if (onClearHighlight) {
                                          onClearHighlight();
                                        }
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
                                          if (onClearHighlight) {
                                            onClearHighlight();
                                          }
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
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Information Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Candidate Information</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-600">Email:</div>
                                <div className="text-gray-900 font-medium">{app.candidate?.email || 'N/A'}</div>
                                
                                <div className="text-gray-600">Phone:</div>
                                <div className="text-gray-900 font-medium">{app.candidate?.phone || 'N/A'}</div>
                                
                                <div className="text-gray-600">Experience:</div>
                                <div className="text-gray-900 font-medium">{app.candidate?.experience || 'Not specified'}</div>

                                <div className="text-gray-600">Candidate Added By:</div>
                                <div className="text-gray-900 font-medium">
                                  {candidateOwner}
                                  {candidateOwnerEmail && (
                                    <div className="text-xs text-gray-500">{candidateOwnerEmail}</div>
                                  )}
                                </div>
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

                                <div className="text-gray-600">Assigned By:</div>
                                <div className="text-gray-900 font-medium">
                                  {applicationOwner}
                                  {applicationOwnerEmail && (
                                    <div className="text-xs text-gray-500">{applicationOwnerEmail}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Interview Details Section */}
                          {app.interviews && app.interviews.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Interview Details</h4>
                              <div className="space-y-3">
                                {app.interviews.map((interview) => (
                                  <div key={interview.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div className="text-gray-600">Interview Date:</div>
                                      <div className="text-gray-900 font-medium">
                                        {interview.interviewDate ? new Date(interview.interviewDate).toLocaleDateString() : 'N/A'}
                                      </div>
                                      
                                      <div className="text-gray-600">Time:</div>
                                      <div className="text-gray-900 font-medium">
                                        {interview.interviewTime ? 
                                          `${interview.interviewTime}${interview.endTime ? ` - ${interview.endTime}` : ''}` : 
                                          'N/A'}
                                      </div>
                                      
                                      <div className="text-gray-600">Job:</div>
                                      <div className="text-gray-900 font-medium">{interview.jobTitle || 'N/A'}</div>
                                      
                                      <div className="text-gray-600">Client:</div>
                                      <div className="text-gray-900 font-medium">{interview.clientName || 'N/A'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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