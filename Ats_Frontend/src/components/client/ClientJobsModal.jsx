// components/ClientJobsModal.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jobAPI, clientAPI } from '../../api/api';

const ClientJobsModal = ({ client, onClose, onJobAssigned }) => {
  const [jobs, setJobs] = useState([]);
  const [showAssignJobModal, setShowAssignJobModal] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [jobDropdownIndex, setJobDropdownIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const jobSearchRef = useRef(null);
  const jobDropdownRef = useRef(null);

  useEffect(() => {
    if (showAssignJobModal) {
      loadAllJobs();
    }
  }, [showAssignJobModal]);

  const loadAllJobs = async () => {
    try {
      setLoading(true);
      const allJobs = await jobAPI.getAll();
      // Filter out jobs that are already assigned to this client
      const clientJobIds = client.jobs?.map(j => j.id) || [];
      const availableJobs = allJobs.filter(job => !clientJobIds.includes(job.id));
      setJobs(availableJobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobs;
    const searchTerm = jobSearch.toLowerCase();
    return jobs.filter(job => {
      const jobId = String(job.id).toLowerCase();
      const jobName = (job.jobName || job.title || '').toLowerCase();
      const clientName = (job.client?.clientName || job.client?.client_name || '').toLowerCase();
      return (
        jobId.includes(searchTerm) ||
        jobName.includes(searchTerm) ||
        clientName.includes(searchTerm) ||
        `${jobId} - ${jobName}`.includes(searchTerm) ||
        `${jobName} - ${clientName}`.includes(searchTerm)
      );
    });
  }, [jobs, jobSearch]);

  const handleAssignJob = async (job) => {
    try {
      setAssigning(true);
      // The backend expects the full job object, not just the ID
      await clientAPI.addJobToClient(client.id, job.id);
      setShowAssignJobModal(false);
      setJobSearch('');
      // Notify parent to reload client data
      if (onJobAssigned) {
        onJobAssigned();
      }
    } catch (error) {
      console.error('Failed to assign job:', error);
      alert(error.message || 'Failed to assign job to client');
    } finally {
      setAssigning(false);
    }
  };

  const handleJobSelect = (job) => {
    handleAssignJob(job);
    setShowJobDropdown(false);
    setJobDropdownIndex(-1);
  };

  const handleJobKeyDown = (e) => {
    if (!showJobDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(jobDropdownIndex + 1, filteredJobs.length - 1);
      setJobDropdownIndex(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = Math.max(jobDropdownIndex - 1, 0);
      setJobDropdownIndex(nextIndex);
    } else if (e.key === 'Enter' && jobDropdownIndex >= 0) {
      e.preventDefault();
      const job = filteredJobs[jobDropdownIndex];
      handleJobSelect(job);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setShowJobDropdown(false);
      setJobDropdownIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jobSearchRef.current && !jobSearchRef.current.contains(e.target) &&
          jobDropdownRef.current && !jobDropdownRef.current.contains(e.target)) {
        setShowJobDropdown(false);
        setJobDropdownIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (jobDropdownIndex >= 0 && jobDropdownRef.current) {
      const items = jobDropdownRef.current.querySelectorAll('div[role="option"]');
      if (items[jobDropdownIndex]) {
        items[jobDropdownIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [jobDropdownIndex]);

  if (!client) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose} // ✅ close modal when clicking outside
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()} // ✅ stop closing when clicking inside
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Jobs for {client.clientName || client.client_name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          {/* Jobs Table */}
          <div className="overflow-y-auto max-h-[60vh]">
            {client.jobs && client.jobs.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {client.jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {job.jobName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.jobLocation || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No jobs found for this client
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setShowAssignJobModal(true)}
              className="px-4 py-2 bg-[#3A9188] text-white rounded-lg hover:bg-[#2E7D6E] transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Assign Job
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Assign Job Modal */}
      {showAssignJobModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAssignJobModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Assign Job to {client.clientName || client.client_name}
                </h2>
                <button
                  onClick={() => setShowAssignJobModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Job Search */}
              <div className="relative mb-4" ref={jobSearchRef}>
                <label className="block font-medium text-gray-700 mb-2">Search Job</label>
                <input
                  type="text"
                  placeholder="Search by ID or job name..."
                  value={jobSearch}
                  onChange={(e) => {
                    setJobSearch(e.target.value);
                    setShowJobDropdown(true);
                    setJobDropdownIndex(-1);
                  }}
                  onFocus={() => setShowJobDropdown(true)}
                  onKeyDown={handleJobKeyDown}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A9188]"
                  disabled={loading || assigning}
                />
                {showJobDropdown && !loading && (
                  <div
                    ref={jobDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((job, index) => {
                        const jobName = job.jobName || job.title;
                        const jobClient = job.client?.clientName || job.client?.client_name || 'No Client';
                        return (
                          <div
                            key={job.id}
                            role="option"
                            aria-selected={index === jobDropdownIndex}
                            className={`p-3 cursor-pointer ${
                              index === jobDropdownIndex ? 'bg-[#3A9188]/10' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => handleJobSelect(job)}
                          >
                            <div className="font-semibold text-gray-900">{jobName}</div>
                            <div className="text-sm text-gray-600">Client: {jobClient}</div>
                            <div className="text-xs text-gray-500">ID: {job.id}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-gray-500 text-center">
                        {loading ? 'Loading jobs...' : 'No available jobs found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {loading && (
                <div className="text-center py-4 text-gray-500">Loading jobs...</div>
              )}

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAssignJobModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={assigning}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientJobsModal;
