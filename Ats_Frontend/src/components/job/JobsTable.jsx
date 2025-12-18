import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const statusStyles = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-red-100 text-red-800",
  NOT_SELECTED: "bg-yellow-100 text-yellow-800",
};

const JobsTable = ({ jobs, loading, onSelectJob, onEditJob, onDeleteJob, currentPage = 1 }) => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading job listings...</p>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Jobs Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">Try adjusting your search criteria or add a new job posting to get started.</p>
        <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
          Add New Job
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Job Details
              </th>
              <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Submitted
              </th>
              <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job, index) => {
              const isLastRow = index === jobs.length - 1;
              return (
              <React.Fragment key={job.id}>
                <tr className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-800 font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Save current page before navigating
                            localStorage.setItem("jobsCurrentPage", currentPage.toString());
                            navigate(`/jobs/${job.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none text-left underline hover:no-underline transition-all duration-200"
                        >
                          {job.jobName}
                        </button>
                        <p className="text-sm text-gray-500 mt-1">ID: {job.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900 font-medium">{job.client?.clientName || "No Client"}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      {job.jobLocation || "Remote"}
                    </div>
                  </td>
                 <td className="py-4 px-4">
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      statusStyles[job.status] || "bg-gray-100 text-gray-800"
    }`}
  >
    {job.status || "No Status"}
  </span>
</td>

                  <td className="py-4 px-4">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === job.id ? null : job.id);
                        }}
                        className="text-gray-600 hover:text-gray-800 p-1 rounded-md hover:bg-gray-100 transition-colors"
                        title="Actions"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === job.id && (
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
                                  // Save current page before navigating
                                  localStorage.setItem("jobsCurrentPage", currentPage.toString());
                                  // Navigate to job detail page with edit mode
                                  navigate(`/jobs/${job.id}?edit=true`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Edit
                              </button>
                              {job.hasApplications ? (
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
                                    onDeleteJob(job.id);
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
              </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsTable;