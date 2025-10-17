import { useState } from 'react';
import { jobAPI } from '../../api/jobApi';

const EditJobModal = ({ job, onClose, onJobUpdated, showToast }) => {
  const [formData, setFormData] = useState({
    jobName: job.jobName || '',
    jobLocation: job.jobLocation || '',
    skillsname: job.skillsName || '',
    jobDiscription: job.jobDescription || '',
    jobExperience: job.jobExperience || '',
    jobSalaryRange: job.jobSalaryRange || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.jobName || !formData.jobLocation || !formData.skillsname || !formData.jobDiscription) {
      showToast('Validation Error', 'Please fill all required fields', 'error');
      return;
    }

    try {
      await jobAPI.update(job.id, formData);
      onJobUpdated();
    } catch (error) {
      showToast('Error', error.message, 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose} // click outside closes modal
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <i className="fas fa-edit text-green-600"></i> Edit Job
          </h3>
          <button
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <input type="hidden" value={job.id} />

          <div className="flex flex-col">
            <label htmlFor="jobName" className="mb-1 font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              id="jobName"
              value={formData.jobName}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="jobLocation" className="mb-1 font-medium text-gray-700">Location</label>
            <input
              type="text"
              id="jobLocation"
              value={formData.jobLocation}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="skillsname" className="mb-1 font-medium text-gray-700">Required Skills (comma separated)</label>
            <input
              type="text"
              id="skillsname"
              value={formData.skillsname}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="skillsname" className="mb-1 font-medium text-gray-700">jobExperience</label>
            <input
              type="text"
              id="jobExperience"
              value={formData.jobExperience}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="skillsname" className="mb-1 font-medium text-gray-700">jobSalaryRange</label>
            <input
              type="text"
              id="jobSalaryRange"
              value={formData.jobSalaryRange}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="jobDiscription" className="mb-1 font-medium text-gray-700">Job Description</label>
            <textarea
              id="jobDiscription"
              rows="4"
              value={formData.jobDiscription}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
            >
              <i className="fas fa-save"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal;
