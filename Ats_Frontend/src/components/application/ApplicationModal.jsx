import React, { useState, useEffect, useMemo, useRef } from 'react';
import { applicationAPI } from "../../api/api"; 

const ApplicationModal = ({ application, candidates, jobs, onSave, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    candidateId: "",
    jobId: "",
    status: "SCHEDULED",
    resumeFile: null,
    useMasterResume: true,
  });

  const [fileName, setFileName] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [candidateDropdownIndex, setCandidateDropdownIndex] = useState(-1);
  const [jobDropdownIndex, setJobDropdownIndex] = useState(-1);
  const candidateSearchRef = useRef(null);
  const jobSearchRef = useRef(null);
  const candidateDropdownRef = useRef(null);
  const jobDropdownRef = useRef(null);

  useEffect(() => {
    console.log("ApplicationModal useEffect - application:", application); // Debug log
    
    if (application) {
      const newFormData = {
        candidateId: application.candidate?.id || '',
        jobId: application.job?.id || '',
        status: application.status || 'PENDING',
        resumeFile: null,
        useMasterResume: !application.applicationResumePath, // if applicationResumePath exists, assume uploaded
      };
      console.log("Setting formData for edit:", newFormData); // Debug log
      setFormData(newFormData);
      setFileName(application.applicationResumePath ? 'Resume attached' : 'Using candidate master resume');
      
      if (application.candidate?.name) {
        setCandidateSearch(`${application.candidate.id} - ${application.candidate.name}`);
      }
      if (application.job?.jobName || application.job?.title) {
        const jobName = application.job.jobName || application.job.title;
        setJobSearch(`${application.job.id} - ${jobName}`);
      }
    } else {
      // Ensure formData is properly initialized for new applications
      const newFormData = {
        candidateId: "",
        jobId: "",
        status: "SCHEDULED",
        resumeFile: null,
        useMasterResume: true,
      };
      console.log("Setting formData for create:", newFormData); // Debug log
      setFormData(newFormData);
      setCandidateSearch('');
      setJobSearch('');
      setFileName('Using candidate master resume');
    }
  }, [application]);

  const filteredCandidates = useMemo(() => {
    if (!candidateSearch) return candidates;
    const searchTerm = candidateSearch.toLowerCase();
    return candidates.filter(candidate => {
      const candidateId = String(candidate.id).toLowerCase();
      const candidateName = candidate.name.toLowerCase();
      return (
        candidateId.includes(searchTerm) ||
        candidateName.includes(searchTerm) ||
        `${candidateId} - ${candidateName}`.includes(searchTerm)
      );
    });
  }, [candidates, candidateSearch]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobs;
    const searchTerm = jobSearch.toLowerCase();
    return jobs.filter(job => {
      const jobId = String(job.id).toLowerCase();
      const jobName = (job.jobName || job.title || '').toLowerCase();
      return (
        jobId.includes(searchTerm) ||
        jobName.includes(searchTerm) ||
        `${jobId} - ${jobName}`.includes(searchTerm)
      );
    });
  }, [jobs, jobSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCandidateSelect = (candidateId, candidateName) => {
    setFormData(prev => ({ ...prev, candidateId }));
    setCandidateSearch(`${candidateId} - ${candidateName}`);
    setShowCandidateDropdown(false);
    setCandidateDropdownIndex(-1);
  };

  const handleJobSelect = (jobId, jobName) => {
    setFormData(prev => ({ ...prev, jobId }));
    setJobSearch(`${jobId} - ${jobName}`);
    setShowJobDropdown(false);
    setJobDropdownIndex(-1);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Error', 'Please select a PDF file', 'error');
        return;
      }
      setFormData(prev => ({ ...prev, resumeFile: file, useMasterResume: false }));
      setFileName(file.name);
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, useMasterResume: checked, resumeFile: null }));
    setFileName(checked ? 'Using candidate master resume' : 'No file selected');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("FormData in handleSubmit:", formData); // Debug log
      
      if (!formData) {
        console.error("FormData is undefined in handleSubmit");
        showToast("Error", "Form data is not properly initialized", "error");
        return;
      }
      
      // Let the parent component handle the API calls
      onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting application:", error);
      showToast("Failed to submit application", "error");
    }
  };

  const handleCandidateKeyDown = (e) => {
    if (!showCandidateDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(candidateDropdownIndex + 1, filteredCandidates.length - 1);
      setCandidateDropdownIndex(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = Math.max(candidateDropdownIndex - 1, 0);
      setCandidateDropdownIndex(nextIndex);
    } else if (e.key === 'Enter' && candidateDropdownIndex >= 0) {
      e.preventDefault();
      const candidate = filteredCandidates[candidateDropdownIndex];
      handleCandidateSelect(candidate.id, candidate.name);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setShowCandidateDropdown(false);
      setCandidateDropdownIndex(-1);
    }
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
      const jobName = job.jobName || job.title;
      handleJobSelect(job.id, jobName);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setShowJobDropdown(false);
      setJobDropdownIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (candidateSearchRef.current && !candidateSearchRef.current.contains(e.target) &&
          candidateDropdownRef.current && !candidateDropdownRef.current.contains(e.target)) {
        setShowCandidateDropdown(false);
        setCandidateDropdownIndex(-1);
      }
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
    if (candidateDropdownIndex >= 0 && candidateDropdownRef.current) {
      const items = candidateDropdownRef.current.querySelectorAll('div[role="option"]');
      if (items[candidateDropdownIndex]) {
        items[candidateDropdownIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [candidateDropdownIndex]);

  useEffect(() => {
    if (jobDropdownIndex >= 0 && jobDropdownRef.current) {
      const items = jobDropdownRef.current.querySelectorAll('div[role="option"]');
      if (items[jobDropdownIndex]) {
        items[jobDropdownIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [jobDropdownIndex]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {application ? 'Edit Job Application' : 'New Job Application'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Candidate Search */}
          <div className="relative" ref={candidateSearchRef}>
            <label className="block font-medium text-gray-700 mb-1">Candidate</label>
            <input
              type="text"
              placeholder="Search by ID or name..."
              value={candidateSearch}
              onChange={(e) => { setCandidateSearch(e.target.value); setShowCandidateDropdown(true); setCandidateDropdownIndex(-1); }}
              onFocus={() => setShowCandidateDropdown(true)}
              onKeyDown={handleCandidateKeyDown}
              readOnly={!!application}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${application ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {showCandidateDropdown && !application && (
              <div ref={candidateDropdownRef} className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      role="option"
                      aria-selected={index === candidateDropdownIndex}
                      className={`p-2 cursor-pointer ${index === candidateDropdownIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      onClick={() => handleCandidateSelect(candidate.id, candidate.name)}
                    >
                      <div className="font-semibold">{candidate.name}</div>
                      <div className="text-xs text-gray-500">ID: {candidate.id}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500">No candidates found</div>
                )}
              </div>
            )}
            <input type="hidden" name="candidateId" value={formData.candidateId} required />
          </div>

          {/* Job Search */}
          <div className="relative" ref={jobSearchRef}>
            <label className="block font-medium text-gray-700 mb-1">Job</label>
            <input
              type="text"
              placeholder="Search by ID or job name..."
              value={jobSearch}
              onChange={(e) => { setJobSearch(e.target.value); setShowJobDropdown(true); setJobDropdownIndex(-1); }}
              onFocus={() => setShowJobDropdown(true)}
              onKeyDown={handleJobKeyDown}
              readOnly={!!application}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${application ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {showJobDropdown && !application && (
              <div ref={jobDropdownRef} className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job, index) => {
                    const jobName = job.jobName || job.title;
                    return (
                      <div
                        key={job.id}
                        role="option"
                        aria-selected={index === jobDropdownIndex}
                        className={`p-2 cursor-pointer ${index === jobDropdownIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        onClick={() => handleJobSelect(job.id, jobName)}
                      >
                        <div className="font-semibold">{jobName}</div>
                        <div className="text-xs text-gray-500">ID: {job.id}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-2 text-gray-500">No jobs found</div>
                )}
              </div>
            )}
            <input type="hidden" name="jobId" value={formData.jobId} required />
          </div>

          {/* Status */}
          <div>
            <label className="block font-medium text-gray-700 mb-1" htmlFor="statusSelect">Status</label>
            <select
              id="statusSelect"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="INTERVIEWED">Interviewed</option>
              <option value="PLACED">Placed</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUBMITTED_BY_CLIENT">Submitted by Client</option>
              <option value="CLIENT_SHORTLIST">Client Shortlist</option>
              <option value="FIRST_INTERVIEW_SCHEDULED">First Interview Scheduled</option>
              <option value="FIRST_INTERVIEW_FEEDBACK_PENDING">First Interview Feedback Pending</option>
              <option value="FIRST_INTERVIEW_REJECT">First Interview Reject</option>
              <option value="SECOND_INTERVIEW_SCHEDULED">Second Interview Scheduled</option>
              <option value="SECOND_INTERVIEW_FEEDBACK_PENDING">Second Interview Feedback Pending</option>
              <option value="SECOND_INTERVIEW_REJECT">Second Interview Reject</option>
              <option value="THIRD_INTERVIEW_SCHEDULED">Third Interview Scheduled</option>
              <option value="THIRD_INTERVIEW_FEEDBACK_PENDING">Third Interview Feedback Pending</option>
              <option value="THIRD_INTERVIEW_REJECT">Third Interview Reject</option>
              <option value="INTERNAL_REJECT">Internal Reject</option>
              <option value="CLIENT_REJECT">Client Reject</option>
              <option value="FINAL_SELECT">Final Select</option>
              <option value="JOINED">Joined</option>
              <option value="BACKEDOUT">Backed Out</option>
            </select>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Resume (PDF)</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useMasterResume"
                checked={formData.useMasterResume}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="useMasterResume" className="text-gray-700">Use Candidate Master Resume</label>
            </div>
            {!formData.useMasterResume && (
              <div className="mt-2">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">{fileName}</p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;
