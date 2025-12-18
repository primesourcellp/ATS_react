import React, { useState } from 'react';
import { candidateAPI } from '../../api/api';

const CandidateFormModal = ({ candidate, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: candidate?.name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    status: candidate?.status || 'PENDING',
    skills: candidate?.skills || '',
    experience: candidate?.experience || '',
    noticePeriod: candidate?.noticePeriod || '',
    currentCtc: candidate?.currentCtc || '',
    expectedCtc: candidate?.expectedCtc || '',
    location: candidate?.location || '',
    about: candidate?.about || ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[id]) {
      setFieldErrors(prev => ({
        ...prev,
        [id]: null
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        alert('Please select a PDF, DOC, or DOCX file');
        e.target.value = ''; // Clear the input
        return;
      }

      // File size validation removed - accepting any size

      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setFieldErrors({}); // Clear previous errors
      const formDataToSend = new FormData();
      formDataToSend.append('candidate', JSON.stringify(formData));
      if (resumeFile) formDataToSend.append('resumeFile', resumeFile);

      let response;
      if (candidate) {
        response = await candidateAPI.update(candidate.id, formDataToSend);
      } else {
        response = await candidateAPI.create(formDataToSend);
      }

      onSave(response);
    } catch (error) {
      console.error('Error saving candidate:', error);
      
      // Check if it's a validation error with field information
      if (error.message && (error.message.includes('already exists') || error.message.includes('Email') || error.message.includes('Phone'))) {
        const field = error.message.includes('Email') ? 'email' : 'phone';
        setFieldErrors({ [field]: error.message });
      }
      
      alert(error.message || 'Failed to save candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onCancel} // click outside closes modal
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[70vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {candidate ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="NEW_CANDIDATE">New Candidate</option>
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="PLACED">Placed</option>
                <option value="REJECTED">Rejected</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="HOLD">Hold</option>
                <option value="HIGH_CTC">High CTC</option>
                <option value="DROPPED_BY_CLIENT">Dropped by Client</option>
              </select>
            </div>
          </div>

          {/* About */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About Candidate</label>
            <textarea
              id="about"
              value={formData.about}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Experience / Notice / Skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
              <input
                type="text"
                id="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period (Days)</label>
              <input
                type="text"
                id="noticePeriod"
                value={formData.noticePeriod}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <input
                type="text"
                id="skills"
                value={formData.skills}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CTC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current CTC (LPA)</label>
              <input
                type="text"
                id="currentCtc"
                value={formData.currentCtc}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected CTC (LPA)</label>
              <input
                type="text"
                id="expectedCtc"
                value={formData.expectedCtc}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF, DOC, DOCX) - Optional</label>
            <input
              type="file"
              id="resume"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateFormModal;
