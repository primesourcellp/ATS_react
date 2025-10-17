import { useState } from 'react';
import { jobAPI } from '../../api/jobApi';

const JobForm = ({ clients, onJobAdded, showToast }) => {
  const [formData, setFormData] = useState({
    jobName: '',
    jobLocation: '',
    skillsname: '',
    jobDiscription: '',
    clientId: '',
    jobType: '',    // REMOTE / ONSITE / HYBRID
    status: '',     // ACTIVE / INACTIVE / NOT_SELECTED
    jobSalaryRange: '',
    jobExperience: ''
  });

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
      await jobAPI.create(formData, formData.clientId);
      showToast('Success', 'Job added successfully');
      setFormData({
        jobName: '',
        jobLocation: '',
        skillsname: '',
        jobDiscription: '',
        clientId: '',
        jobType: '',
        status: '',
        jobSalaryRange: '',
        jobExperience: ''
      });
      onJobAdded();
    } catch (error) {
      showToast('Error', error.message, 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name || e.target.id]: e.target.value
    });
  };

  return (
    <form id="jobForm" onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg shadow-md">
      {/* Job Name & Location */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label htmlFor="jobName" className="mb-1 font-semibold text-gray-700">Job Title</label>
          <input
            type="text"
            id="jobName"
            value={formData.jobName}
            onChange={handleChange}
            placeholder="e.g. Senior Software Engineer"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="jobLocation" className="mb-1 font-semibold text-gray-700">Location</label>
          <input
            type="text"
            id="jobLocation"
            value={formData.jobLocation}
            onChange={handleChange}
            placeholder="e.g. San Francisco, Remote"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-col mt-4">
        <label htmlFor="skillsname" className="mb-1 font-semibold text-gray-700">Required Skills</label>
        <input
          type="text"
          id="skillsname"
          value={formData.skillsname}
          onChange={handleChange}
          placeholder="e.g. Java, Spring Boot, SQL, AWS"
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Job Description */}
      <div className="flex flex-col mt-4">
        <label htmlFor="jobDiscription" className="mb-1 font-semibold text-gray-700">Job Description</label>
        <textarea
          id="jobDiscription"
          rows="4"
          value={formData.jobDiscription}
          onChange={handleChange}
          placeholder="Enter detailed job description..."
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Job Salary Range */}
      <div className="flex flex-col mt-4">
        <label htmlFor="jobSalaryRange" className="mb-1 font-semibold text-gray-700">Salary Range</label>
        <input
          type="text"
          id="jobSalaryRange"
          value={formData.jobSalaryRange}
          onChange={handleChange}
          placeholder="e.g. 5 LPA - 10 LPA"
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Job Experience */}
      <div className="flex flex-col mt-4">
        <label htmlFor="jobExperience" className="mb-1 font-semibold text-gray-700">Experience Required</label>
        <input
          type="text"
          id="jobExperience"
          value={formData.jobExperience}
          onChange={handleChange}
          placeholder="e.g. 3-5 years"
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Client Selection */}
      <div className="flex flex-col mt-4">
        <label htmlFor="clientId" className="mb-1 font-semibold text-gray-700">Assign to Client</label>
        <select
          id="clientId"
          value={formData.clientId}
          onChange={handleChange}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">-- Select a client --</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.clientName}
            </option>
          ))}
        </select>
      </div>

      {/* Job Type */}
      <div className="flex flex-col mt-4">
        <label className="mb-1 font-semibold text-gray-700">Job Type</label>
        <div className="flex gap-4">
          {['REMOTE', 'ONSITE', 'HYBRID'].map(type => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="radio"
                name="jobType"
                value={type}
                checked={formData.jobType === type}
                onChange={handleChange}
                required
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job Status */}
      <div className="flex flex-col mt-4">
        <label className="mb-1 font-semibold text-gray-700">Job Status</label>
        <div className="flex gap-4">
          {['ACTIVE', 'INACTIVE', 'NOT_SELECTED'].map(status => (
            <label key={status} className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value={status}
                checked={formData.status === status}
                onChange={handleChange}
                required
              />
              <span>{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          type="submit"
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
        >
          <i className="fas fa-save mr-2"></i> Save Job
        </button>

        <button
          type="button"
          onClick={() =>
            setFormData({
              jobName: '',
              jobLocation: '',
              skillsname: '',
              jobDiscription: '',
              clientId: '',
              jobType: '',
              status: '',
              jobSalaryRange: '',
              jobExperience: ''
            })
          }
          className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
        >
          <i className="fas fa-undo mr-2"></i> Reset
        </button>
      </div>
    </form>
  );
};

export default JobForm;
