import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../layout/navbar';
import { resumeMatchingAPI, jobAPI } from '../../api/api';
import Toast from '../toast/Toast';

const JobSpecificMatching = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get('jobId');

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobSearch, setJobSearch] = useState('');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    loadJobs();
    // If jobId is in URL, load that job
    if (jobIdFromUrl) {
      loadJobById(jobIdFromUrl);
    }
  }, [jobIdFromUrl]);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const data = await jobAPI.getAll();
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      showToast('Error', 'Failed to load jobs', 'error');
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadJobById = async (id) => {
    try {
      setLoadingJobs(true);
      const job = await jobAPI.getById(id);
      setSelectedJob(job);
      setJobSearch(job.jobName || '');
    } catch (err) {
      console.error('Failed to load job:', err);
      showToast('Error', 'Failed to load job', 'error');
    } finally {
      setLoadingJobs(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobs.slice(0, 10); // Show first 10 when no search
    const term = jobSearch.toLowerCase();
    return jobs.filter(job =>
      (job.jobName && job.jobName.toLowerCase().includes(term)) ||
      (job.id && String(job.id).includes(term)) ||
      (job.jobLocation && job.jobLocation.toLowerCase().includes(term)) ||
      (job.client?.clientName && job.client.clientName.toLowerCase().includes(term))
    ).slice(0, 10);
  }, [jobs, jobSearch]);

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setJobSearch(job.jobName || '');
    setShowJobDropdown(false);
    setMatchResult(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        showToast('Invalid File Type', 'Please upload a PDF, DOC, or DOCX file.', 'error');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showToast('File Too Large', 'File size must be less than 10MB.', 'error');
        return;
      }

      setResumeFile(file);
      setError('');
      setMatchResult(null);
    }
  };

  const handleMatch = async () => {
    if (!selectedJob) {
      showToast('No Job Selected', 'Please select a job first.', 'error');
      return;
    }

    if (!resumeFile) {
      showToast('No File Selected', 'Please select a resume file to analyze.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setMatchResult(null);

    try {
      const result = await resumeMatchingAPI.matchResumeWithJob(resumeFile, selectedJob.id);
      setMatchResult(result);
      showToast('Success', 'Resume analysis completed!', 'success');
    } catch (err) {
      let errorMessage = err.message || 'Failed to analyze resume. Please try again.';
      
      // Check for rate limit errors
      if (errorMessage.includes('Rate Limit') || errorMessage.includes('rate limit') || 
          errorMessage.includes('TPM') || errorMessage.includes('tokens per min')) {
        errorMessage = '⚠️ Rate Limit Exceeded\n\n' +
          'OpenAI API rate limit has been reached. Please wait 2-3 minutes before trying again.\n\n' +
          'To avoid this:\n' +
          '• Wait longer between requests\n' +
          '• Upgrade your OpenAI plan for higher rate limits\n' +
          '• Try again in a few minutes';
      }
      
      setError(errorMessage);
      showToast('Rate Limit Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMatchLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  return (
    <div className="flex ">
      <Navbar />
      <main className="flex-1 p-6 mt-10">
        {/* Header */}
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900">Job-Specific Resume Matching</h1>
          <p className="text-gray-600 mt-2">Select a job and upload a resume to get AI-powered matching analysis</p>
        </div>

        {/* Job Selection Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Job *
          </label>
          <div className="relative">
            <input
              type="text"
              value={jobSearch}
              onChange={(e) => {
                setJobSearch(e.target.value);
                setShowJobDropdown(true);
              }}
              onFocus={() => setShowJobDropdown(true)}
              placeholder="Search jobs by name, ID, location, or client..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A9188] focus:border-[#3A9188]"
            />
            {loadingJobs && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {showJobDropdown && filteredJobs.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-semibold text-gray-900">{job.jobName}</div>
                    <div className="text-xs text-gray-500">
                      ID: {job.id} | {job.jobLocation || 'Location N/A'} | {job.client?.clientName || 'Client N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedJob && (
            <div className="mt-4 p-4 bg-[#3A9188]/10 border border-[#3A9188]/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedJob.jobName}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div>Location: {selectedJob.jobLocation || 'N/A'}</div>
                    <div>Experience: {selectedJob.jobExperience || 'N/A'}</div>
                    <div>Skills: {selectedJob.skillsname || 'N/A'}</div>
                    {selectedJob.client && (
                      <div>Client: {selectedJob.client.clientName}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setJobSearch('');
                    setMatchResult(null);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resume Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Resume (PDF, DOC, or DOCX) *
          </label>
          <div className="space-y-4">
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3A9188] transition-colors">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {resumeFile ? resumeFile.name : 'Click to select resume file'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Max file size: 10MB</span>
                </div>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {resumeFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-[#3A9188]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                    <p className="text-xs text-gray-500">{(resumeFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => setResumeFile(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={handleMatch}
              disabled={!selectedJob || !resumeFile || loading}
              className="w-full px-6 py-3 bg-[#3A9188] text-white rounded-lg hover:bg-[#2E7D6E] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Analyze Match
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Match Results Section */}
        {matchResult && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Match Analysis</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getMatchColor(matchResult.matchScore)}`}>
                {getMatchLabel(matchResult.matchScore)} ({matchResult.matchScore.toFixed(1)}%)
              </span>
            </div>

            <div className="space-y-6">
              {/* Match Score Visualization */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Match Score</span>
                  <span className="text-lg font-bold text-gray-900">{matchResult.matchScore.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      matchResult.matchScore >= 80 ? 'bg-green-500' :
                      matchResult.matchScore >= 60 ? 'bg-blue-500' :
                      matchResult.matchScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${matchResult.matchScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Match Reason */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-800 mb-2">Match Analysis</p>
                <p className="text-sm text-blue-700">{matchResult.matchReason || 'Analysis pending'}</p>
              </div>

              {/* Strengths and Gaps */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-800 mb-2">Candidate Strengths</p>
                  <p className="text-sm text-green-700">{matchResult.strengths || 'N/A'}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">Skill Gaps</p>
                  <p className="text-sm text-yellow-700">{matchResult.gaps || 'None identified'}</p>
                </div>
              </div>

              {/* Job Details */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-3">Job Details</p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Job Title:</span>
                    <span className="ml-2 font-medium text-gray-900">{matchResult.jobName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium text-gray-900">{matchResult.jobLocation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Experience:</span>
                    <span className="ml-2 font-medium text-gray-900">{matchResult.experience || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Salary Range:</span>
                    <span className="ml-2 font-medium text-gray-900">{matchResult.salaryRange || 'N/A'}</span>
                  </div>
                  {matchResult.skills && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Required Skills:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {matchResult.skills.split(',').map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-white text-gray-700 rounded text-xs border">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/jobs/${matchResult.jobId}`)}
                  className="flex-1 px-4 py-2 bg-[#3A9188] text-white rounded-lg hover:bg-[#2E7D6E] transition-colors font-medium"
                >
                  View Job Details
                </button>
                <button
                  onClick={() => {
                    setMatchResult(null);
                    setResumeFile(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  New Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </div>
  );
};

export default JobSpecificMatching;

