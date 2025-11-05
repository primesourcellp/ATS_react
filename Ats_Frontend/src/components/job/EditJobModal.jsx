import { useState } from 'react';
import { jobAPI } from '../../api/api';
import RichTextEditor from './RichTextEditor';

const EditJobModal = ({ job, onClose, onJobUpdated, showToast }) => {
  const [formData, setFormData] = useState({
    jobName: job.jobName || '',
    jobLocation: job.jobLocation || '',
    skillsname: job.skillsName || '',
    jobDiscription: job.jobDescription || '',
    rolesAndResponsibilities: job.rolesAndResponsibilities || '',
    jobExperience: job.jobExperience || '',
    jobSalaryRange: job.jobSalaryRange || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.jobName || !formData.jobLocation || !formData.skillsname || !formData.jobDiscription) {
      showToast('Validation Error', 'Please fill all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      await jobAPI.update(job.id, formData);
      onJobUpdated();
    } catch (error) {
      showToast('Error', error.message, 'error');
    } finally {
      setLoading(false);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 border-b border-green-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                <i className="fas fa-edit text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Job</h2>
                <p className="text-green-100 text-sm">Update job details below</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" value={job.id} />

            {/* Basic Information Section */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 rounded-lg p-2 mr-3">
                  <i className="fas fa-briefcase text-green-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobName" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-briefcase absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="jobName"
                      value={formData.jobName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="e.g., Senior Software Developer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="jobLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="jobLocation"
                      value={formData.jobLocation}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="e.g., Chennai, Tamil Nadu"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="jobExperience" className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <div className="relative">
                    <i className="fas fa-calendar-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="jobExperience"
                      value={formData.jobExperience}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="e.g., 5-8 years"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="jobSalaryRange" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range
                  </label>
                  <div className="relative">
                    <i className="fas fa-rupee-sign absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="jobSalaryRange"
                      value={formData.jobSalaryRange}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="e.g., 10-15 LPA"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-lg p-2 mr-3">
                  <i className="fas fa-tools text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Required Skills</h3>
              </div>

              <div>
                <label htmlFor="skillsname" className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs font-normal ml-2">(Enter skills separated by commas)</span>
                </label>
                <textarea
                  id="skillsname"
                  rows="4"
                  value={formData.skillsname}
                  onChange={handleChange}
                  placeholder="e.g., React, JavaScript, TypeScript, Node.js, Express, MongoDB, PostgreSQL"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-y"
                  style={{ minHeight: '100px' }}
                  required
                ></textarea>
              </div>
            </div>

            {/* Job Description Section */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 rounded-lg p-2 mr-3">
                  <i className="fas fa-file-alt text-purple-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Job Description</h3>
              </div>

              <div>
                <label htmlFor="jobDiscription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="jobDiscription"
                  rows="4"
                  value={formData.jobDiscription}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  placeholder="Enter detailed job description..."
                  required
                ></textarea>
              </div>
            </div>

            {/* Roles & Responsibilities Section */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 rounded-lg p-2 mr-3">
                  <i className="fas fa-tasks text-orange-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Roles & Responsibilities</h3>
              </div>

              <div>
                <label htmlFor="rolesAndResponsibilities" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Roles & Responsibilities <span className="text-gray-500 text-sm font-normal">(Supports formatting: bold, italic, lists, etc.)</span>
                </label>
                <RichTextEditor
                  value={formData.rolesAndResponsibilities}
                  onChange={(html) => setFormData({ ...formData, rolesAndResponsibilities: html })}
                  placeholder="Enter detailed roles and responsibilities... You can use formatting like bold, italic, lists, etc."
                  minHeight="200px"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Use the toolbar to format text with <strong>bold</strong>, <em>italic</em>, lists, and more.
                </p>
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 -mx-6 -mb-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 shadow-sm"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJobModal;
