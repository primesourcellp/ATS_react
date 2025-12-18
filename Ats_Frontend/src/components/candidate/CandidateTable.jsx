import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CandidateTable = ({
  candidates,
  loading,
  onViewCandidate,
  onEditCandidate,
  onDeleteCandidate,
  onAssignJob,
  onCopyCandidate,
  onStatusChange,
  statusOptions = []
}) => {
  const navigate = useNavigate();
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleExpand = (candidateId) => {
    setExpandedCandidateId(expandedCandidateId === candidateId ? null : candidateId);
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

  const statusLabelMap = {
    SUBMITTED_TO_CLIENT: 'Submitted to Client',
    NO_RESPONSE: 'No Response',
    IMMEDIATE: 'Immediate',
    REJECTED_BY_CLIENT: 'Rejected by Client'
  };

  const formatStatusText = (status) => {
    if (statusLabelMap[status]) {
      return statusLabelMap[status];
    }

    return status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter candidates based on status and search term
  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = statusFilter === 'ALL' || candidate.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.phone?.includes(searchTerm) ||
      (candidate.id && candidate.id.toString().includes(searchTerm));
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading candidate data...</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Candidates Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">Add new candidates or try adjusting your search filters</p>
        <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
          Add New Candidate
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible">
      {/* Filters */}
      
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Candidate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Added By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Job Count
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCandidates.map((candidate, index) => {
              const jobCount = candidate.jobCount || 0;
              const isLastRow = index === filteredCandidates.length - 1;

              return (
                <React.Fragment key={candidate.id}>
                  <tr className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-medium text-sm">
                            {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => onViewCandidate(candidate)}
                            className="text-blue-600 hover:text-blue-700 underline focus:outline-none text-left"
                          >
                            {candidate.name || 'N/A'}
                          </button>
                          <p className="text-sm text-gray-500 mt-1">ID: {candidate.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{candidate.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{candidate.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center">
                          <select
                            value={candidate.status || ''}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              if (!newStatus || newStatus === candidate.status) return;
                              if (!onStatusChange) return;
                              setUpdatingStatusId(candidate.id);
                              try {
                                await onStatusChange(candidate, newStatus);
                              } finally {
                                setUpdatingStatusId(null);
                              }
                            }}
                            className={`inline-flex items-center px-2.5 py-2 rounded-full text-xs font-medium cursor-pointer appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-offset-1 ${getStatusClass(candidate.status)}`}
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
                        {updatingStatusId === candidate.id && (
                          <i className="fas fa-spinner fa-spin text-blue-500 text-xs"></i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{candidate.createdByUsername || 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-gray-900 font-medium">{jobCount}</span>
                        {jobCount > 0 && (
                          <button 
                            className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => toggleExpand(candidate.id)}
                          >
                            {expandedCandidateId === candidate.id ? 'Hide' : 'View'} Jobs
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === candidate.id ? null : candidate.id);
                          }}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded-md hover:bg-gray-100 transition-colors"
                          title="Actions"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openMenuId === candidate.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            ></div>
                            <div className={`absolute right-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 ${isLastRow ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    onEditCandidate(candidate);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                  </svg>
                                  Edit
                                </button>
                                {candidate.hasApplications ? (
                                  <div className="px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Delete (Has Applications)
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      onDeleteCandidate(candidate.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedCandidateId === candidate.id && jobCount > 0 && (
                    <tr className="bg-blue-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="mb-2 font-medium text-gray-700">Applied Jobs:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {candidate.appliedJobsWithClient && candidate.appliedJobsWithClient.map((jobInfo, idx) => {
                            const assignedByName = jobInfo.assignedByUsername || '';
                            const assignedByEmail = jobInfo.assignedByEmail || '';
                            const assignedDisplay = assignedByName || assignedByEmail || 'Not Available';
                            const jobLabel = jobInfo.jobId ? `Job #${jobInfo.jobId}` : `Job ${idx + 1}`;

                            return (
                              <div key={jobInfo.applicationId || idx} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (jobInfo.jobId) {
                                      navigate(`/jobs/${jobInfo.jobId}`);
                                    }
                                  }}
                                  className="font-medium text-blue-600 hover:text-blue-700 underline text-left"
                                >
                                  {jobInfo.jobName || 'Unknown Job'}
                                </button>
                                <div className="text-sm text-blue-600 mt-1">
                                  Client: {jobInfo.clientName || 'Unknown Client'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {jobLabel}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  <span className="font-medium text-gray-700">Assigned By:</span>{' '}
                                  <span className="text-gray-700">{assignedDisplay}</span>
                                  {assignedByName && assignedByEmail && assignedByName !== assignedByEmail && (
                                    <div className="text-[11px] text-gray-400 mt-0.5">{assignedByEmail}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {candidate.appliedJobsWithClient && candidate.appliedJobsWithClient.length === 0 && (
                          <div className="text-gray-500 text-center py-4">
                            No applied jobs found
                          </div>
                        )}
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
            Showing <span className="font-medium">{filteredCandidates.length}</span> of <span className="font-medium">{candidates.length}</span> candidates
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

export default CandidateTable;