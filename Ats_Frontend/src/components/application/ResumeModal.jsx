import React, { useState, useEffect } from 'react';
import { applicationAPI } from '../../api/api';

const ResumeModal = ({ application, onClose, showToast }) => {
  const [resumeUrl, setResumeUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const resumeUrl = await applicationAPI.viewResume(application.id);
        setResumeUrl(resumeUrl);
      } catch (error) {
        showToast('Error', error.message || 'Failed to load resume', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (application) {
      fetchResume();
    }
  }, [application, onClose, showToast]);

  const handleDownload = async () => {
    try {
      const blob = await applicationAPI.downloadResume(application.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${application.candidate?.name || 'candidate'}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Error', error.message || 'Failed to download resume', 'error');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6">
          <p>Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Resume: {application.candidate?.name || 'Candidate'}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center"
            >
              <i className="fas fa-download mr-1"></i> Download
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 p-4">
          {resumeUrl ? (
            <iframe
              src={resumeUrl}
              className="w-full h-full border rounded-lg"
              title="Resume"
              style={{ minHeight: '500px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No resume available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;