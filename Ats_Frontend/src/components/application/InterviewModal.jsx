import React, { useState, useEffect } from 'react';

const InterviewModal = ({ application, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    interviewDate: '',
    interviewTime: '',
    endTime: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = new Date(nextHour.getTime() + 60 * 60 * 1000);

    setFormData({
      interviewDate: now.toISOString().split('T')[0],
      interviewTime: nextHour.toTimeString().substring(0, 5),
      endTime: endTime.toTimeString().substring(0, 5)
    });
  }, []);

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
    if (validateForm()) onSubmit(formData);
  };

  const candidateName = application?.candidateName || application?.candidate?.name || 'Unknown';
  const jobName = application?.job?.jobName || application?.job?.title || 'Unknown';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose} // close modal when clicking outside
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 border"
        onClick={(e) => e.stopPropagation()} // stop closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Schedule Interview: {candidateName} - {jobName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1" htmlFor="interviewDate">Interview Date</label>
            <input
              type="date"
              id="interviewDate"
              name="interviewDate"
              value={formData.interviewDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.interviewDate ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.interviewDate && <p className="text-red-500 text-sm mt-1">{errors.interviewDate}</p>}
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1" htmlFor="interviewTime">Start Time</label>
            <input
              type="time"
              id="interviewTime"
              name="interviewTime"
              value={formData.interviewTime}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.interviewTime ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.interviewTime && <p className="text-red-500 text-sm mt-1">{errors.interviewTime}</p>}
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1" htmlFor="endTime">End Time</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Schedule Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewModal;
