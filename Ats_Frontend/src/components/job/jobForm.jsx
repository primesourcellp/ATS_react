import { useState } from 'react';
import { jobAPI } from '../../api/api';

const JobForm = ({ clients, onJobAdded, showToast }) => {
  const [formData, setFormData] = useState({
    jobName: '',
    jobLocation: '',
    skillsname: '',
    jobDiscription: '',
    rolesAndResponsibilities: '',
    clientId: '',
    jobType: '',    // REMOTE / ONSITE / HYBRID
    status: '',     // ACTIVE / INACTIVE / NOT_SELECTED
    jobSalaryRange: '',
    jobExperience: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.jobName ||
      !formData.jobLocation ||
      !formData.skillsname ||
      !formData.jobDiscription ||
      !formData.clientId ||
      !formData.jobType ||
      !formData.status ||
      !formData.jobSalaryRange ||
      !formData.jobExperience
    ) {
      showToast('Validation Error', 'Please fill all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      await jobAPI.create(formData, formData.clientId);
      showToast('Success', 'Job added successfully');
      setFormData({
        jobName: '',
        jobLocation: '',
        skillsname: '',
        jobDiscription: '',
        rolesAndResponsibilities: '',
        clientId: '',
        jobType: '',
        status: '',
        jobSalaryRange: '',
        jobExperience: ''
      });
      onJobAdded();
    } catch (error) {
      showToast('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name || e.target.id]: e.target.value
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-6 py-4 border-b border-green-700">
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
            <i className="fas fa-briefcase text-white text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Job</h2>
            <p className="text-green-100 text-sm">Fill in the job details below</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-gray-50 space-y-5">
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
                  placeholder="e.g., Senior Software Developer"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
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
                  placeholder="e.g., Chennai, Tamil Nadu"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="jobExperience" className="block text-sm font-medium text-gray-700 mb-2">
                Experience Required <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-calendar-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  id="jobExperience"
                  value={formData.jobExperience}
                  onChange={handleChange}
                  placeholder="e.g., 5-8 years"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="jobSalaryRange" className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-rupee-sign absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  id="jobSalaryRange"
                  value={formData.jobSalaryRange}
                  onChange={handleChange}
                  placeholder="e.g., 10-15 LPA"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Client & Job Settings Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-teal-100 rounded-lg p-2 mr-3">
              <i className="fas fa-building text-teal-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Client & Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-users absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none cursor-pointer transition-all"
                  required
                >
                  <option value="">-- Select a client --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.clientName || client.client_name}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {['REMOTE', 'ONSITE', 'HYBRID'].map(type => (
                  <label
                    key={type}
                    className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.jobType === type
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="jobType"
                      value={type}
                      checked={formData.jobType === type}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />
                    <i className={`fas fa-${type === 'REMOTE' ? 'home' : type === 'ONSITE' ? 'building' : 'sync-alt'} mr-2`}></i>
                    <span className="font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {[
                { value: 'ACTIVE', icon: 'check-circle', colorClass: 'border-green-500 bg-green-50 text-green-700' },
                { value: 'INACTIVE', icon: 'times-circle', colorClass: 'border-red-500 bg-red-50 text-red-700' },
                { value: 'NOT_SELECTED', icon: 'clock', colorClass: 'border-yellow-500 bg-yellow-50 text-yellow-700' }
              ].map(status => (
                <label
                  key={status.value}
                  className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.status === status.value
                      ? status.colorClass
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <i className={`fas fa-${status.icon} mr-2`}></i>
                  <span className="font-medium">{status.value.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-lg p-2 mr-3">
              <i className="fas fa-tools text-purple-600"></i>
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
            <div className="bg-indigo-100 rounded-lg p-2 mr-3">
              <i className="fas fa-file-alt text-indigo-600"></i>
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
              placeholder="Enter detailed job description..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
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
              Detailed Roles & Responsibilities <span className="text-gray-500 text-sm font-normal">(Supports 2000+ words)</span>
            </label>
            <textarea
              id="rolesAndResponsibilities"
              rows="8"
              value={formData.rolesAndResponsibilities}
              onChange={handleChange}
              placeholder="Enter detailed roles and responsibilities... (Supports 2000+ words)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-y"
              style={{ minHeight: '200px' }}
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              Word count: {formData.rolesAndResponsibilities ? formData.rolesAndResponsibilities.split(/\s+/).filter(word => word.length > 0).length : 0}
            </p>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() =>
              setFormData({
                jobName: '',
                jobLocation: '',
                skillsname: '',
                jobDiscription: '',
                rolesAndResponsibilities: '',
                clientId: '',
                jobType: '',
                status: '',
                jobSalaryRange: '',
                jobExperience: ''
              })
            }
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 shadow-sm"
          >
            <i className="fas fa-undo mr-2"></i>
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-lg hover:from-green-700 hover:to-teal-600 font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Job
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
