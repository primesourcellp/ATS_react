import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../layout/navbar';
import { resumeMatchingAPI } from '../../api/api';
import Toast from '../toast/Toast';

const ResumeJobMatching = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        showToast('Invalid File Type', 'Please upload a PDF, DOC, or DOCX file.', 'error');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        showToast('File Too Large', 'File size must be less than 10MB.', 'error');
        return;
      }

      setResumeFile(file);
      setError('');
    }
  };

  const handleMatch = async () => {
    if (!resumeFile) {
      showToast('No File Selected', 'Please select a resume file to analyze.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setMatches([]);

    try {
      const results = await resumeMatchingAPI.matchResume(resumeFile);
      setMatches(results || []);
      if (results && results.length > 0) {
        showToast('Success', `Found ${results.length} job matches!`, 'success');
      } else {
        showToast('No Matches', 'No matching jobs found for this resume.', 'warning');
      }
    } catch (err) {
      let errorMessage = err.message || 'Failed to match resume with jobs. Please try again.';
      
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

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
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
    <div className="flex">
      <Navbar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Job Matching</h1>
          <p className="text-gray-600 mt-2">Upload a resume and let AI find the best matching jobs for the candidate</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Resume (PDF, DOC, or DOCX)
              </label>
              <div className="flex items-center gap-4">
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
              </div>
            </div>

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
              disabled={!resumeFile || loading}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Matching Jobs
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

        {/* Results Section */}
        {matches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Matching Jobs ({matches.length})</h2>
              <p className="text-sm text-gray-600">Sorted by match score</p>
            </div>

            <div className="grid gap-4">
              {matches.map((match) => (
                <div
                  key={match.jobId}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{match.jobName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getMatchColor(match.matchScore)}`}>
                          {getMatchLabel(match.matchScore)} ({match.matchScore.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {match.jobLocation || 'Location not specified'}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {match.experience || 'Experience not specified'}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {match.salaryRange || 'Salary not specified'}
                        </div>
                        {match.clientName && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {match.clientName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {match.skills && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {match.skills.split(',').map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-semibold text-green-800 mb-1">Strengths</p>
                      <p className="text-sm text-green-700">{match.strengths || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">Skill Gaps</p>
                      <p className="text-sm text-yellow-700">{match.gaps || 'None identified'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Match Reason</p>
                    <p className="text-sm text-blue-700">{match.matchReason || 'Analysis pending'}</p>
                  </div>

                  <button
                    onClick={() => handleViewJob(match.jobId)}
                    className="w-full px-4 py-2 bg-[#3A9188] text-white rounded-lg hover:bg-[#2E7D6E] transition-colors font-medium"
                  >
                    View Job Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {matches.length === 0 && !loading && resumeFile && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">Click "Find Matching Jobs" to analyze the resume</p>
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

export default ResumeJobMatching;

