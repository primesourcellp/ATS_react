import React, { useState } from 'react';

const CandidateTable = ({
  candidates,
  loading,
  onViewCandidate,
  onEditCandidate,
  onDeleteCandidate,
  onAssignJob,
  onCopyCandidate
}) => {
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (candidateId) => {
    setExpandedCandidateId(expandedCandidateId === candidateId ? null : candidateId);
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
      'FIRST_INTERVIEW_SCHEDULED': 'bg-blue-100 text-blue-800',
      'FIRST_INTERVIEW_FEEDBACK_PENDING': 'bg-orange-100 text-orange-800',
      'FIRST_INTERVIEW_REJECT': 'bg-red-100 text-red-800',
      'SECOND_INTERVIEW_SCHEDULED': 'bg-blue-100 text-blue-800',
      'SECOND_INTERVIEW_FEEDBACK_PENDING': 'bg-orange-100 text-orange-800',
      'SECOND_INTERVIEW_REJECT': 'bg-red-100 text-red-800',
      'THIRD_INTERVIEW_SCHEDULED': 'bg-blue-100 text-blue-800',
      'THIRD_INTERVIEW_FEEDBACK_PENDING': 'bg-orange-100 text-orange-800',
      'THIRD_INTERVIEW_REJECT': 'bg-red-100 text-red-800',
      'INTERNEL_REJECT': 'bg-red-100 text-red-800',
      'CLIENT_REJECT': 'bg-red-100 text-red-800',
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Filters */}
      
      <div className="overflow-x-auto">
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
                            className="text-gray-900 font-semibold hover:text-blue-700 focus:outline-none text-left"
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(candidate.status)}`}>
                        {candidate.status ? formatStatusText(candidate.status) : 'N/A'}
                      </span>
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewCandidate(candidate)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditCandidate(candidate)}
                          className="text-yellow-600 hover:text-yellow-800 p-1 rounded-md hover:bg-yellow-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        
                        
                        {/* Delete button - disabled if candidate has applications */}
                        {candidate.hasApplications ? (
                          <span 
                            className="text-gray-400 p-1 rounded-md cursor-not-allowed"
                            title="Cannot delete candidate with existing job applications"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </span>
                        ) : (
                          <button
                            onClick={() => onDeleteCandidate(candidate.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedCandidateId === candidate.id && jobCount > 0 && (
                    <tr className="bg-blue-50">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="mb-2 font-medium text-gray-700">Applied Jobs:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {candidate.appliedJobsWithClient && candidate.appliedJobsWithClient.map((jobInfo, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                              <div className="font-medium text-gray-900">{jobInfo.jobName}</div>
                              <div className="text-sm text-blue-600 mt-1">
                                Client: {jobInfo.clientName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Job #{idx + 1}
                              </div>
                            </div>
                          ))}
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