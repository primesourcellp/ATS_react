import React, { useState, useEffect } from 'react';

const InterviewModal = ({ interview, onSave, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    interviewDate: '',
    interviewTime: '',
    endTime: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (interview) {
      setFormData({
        interviewDate: interview.interviewDate || '',
        interviewTime: interview.interviewTime || '',
        endTime: interview.endTime || '',
        description: interview.description || ''
      });
    }
  }, [interview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.interviewDate) newErrors.interviewDate = 'Interview date is required';
    if (!formData.interviewTime) newErrors.interviewTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    if (formData.interviewTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.interviewTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (end <= start) newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSave(formData);
  };

  const candidateName = interview?.candidateName || interview?.application?.candidate?.name || 'Unknown';
  const jobTitle = interview?.jobTitle || interview?.application?.job?.title || 'Unknown';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4"
      onClick={onClose} // ✅ Click outside closes modal
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-fadeIn border"
        onClick={(e) => e.stopPropagation()} // ✅ Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Edit Interview: <span className="text-blue-600">{candidateName}</span> - <span className="text-green-600">{jobTitle}</span>
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="interviewDate" className="text-gray-700 font-medium mb-1">Interview Date</label>
            <input
              type="date"
              id="interviewDate"
              name="interviewDate"
              value={formData.interviewDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.interviewDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.interviewDate && <span className="text-red-500 text-sm mt-1">{errors.interviewDate}</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="interviewTime" className="text-gray-700 font-medium mb-1">Start Time</label>
            <input
              type="time"
              id="interviewTime"
              name="interviewTime"
              value={formData.interviewTime}
              onChange={handleChange}
              className={`p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.interviewTime ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.interviewTime && <span className="text-red-500 text-sm mt-1">{errors.interviewTime}</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="endTime" className="text-gray-700 font-medium mb-1">End Time</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.endTime ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.endTime && <span className="text-red-500 text-sm mt-1">{errors.endTime}</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="description" className="text-gray-700 font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter interview description, notes, or agenda..."
              className={`p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description}</span>}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewModal;
