import { useState } from 'react';
import { candidateAPI } from '../../api/candidate';

const CreateCandidateModal = ({ onClose, onCandidateCreated, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'SCHEDULED',
    about: '',
    experience: '',
    noticePeriod: '',
    skills: '',
    currentCtc: '',
    expectedCtc: '',
    location: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [parsingStatus, setParsingStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[id]) {
      setFieldErrors(prev => ({
        ...prev,
        [id]: null
      }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeFileName(file.name);
      await parseResume(file);
    }
  };

  const parseResume = async (file) => {
    try {
      setParsingStatus('parsing');
      const parsedData = await candidateAPI.parseResume(file);

      setFormData(prev => ({
        ...prev,
        name: prev.name || parsedData.name || '',
        email: prev.email || parsedData.email || '',
        phone: prev.phone || parsedData.phone || '',
        skills: prev.skills || parsedData.skills || '',
        experience: prev.experience || parsedData.experience || '',
        about: prev.about || parsedData.about || '',
        currentCtc: prev.currentCtc || parsedData.currentCtc || '',
        expectedCtc: prev.expectedCtc || parsedData.expectedCtc || '',
        location: prev.location || parsedData.location || ''
      }));

      setParsingStatus('success');
      setTimeout(() => setParsingStatus(''), 3000);
    } catch (error) {
      setParsingStatus('error');
      console.error('Error parsing resume:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      showToast('Validation Error', 'Please fill all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      setFieldErrors({}); // Clear previous errors
      await candidateAPI.create(formData, resumeFile);
      onCandidateCreated();
    } catch (error) {
      // Check if it's a validation error with field information
      if (error.message && (error.message.includes('already exists') || error.message.includes('Email') || error.message.includes('Phone'))) {
        const field = error.message.includes('Email') ? 'email' : 'phone';
        setFieldErrors({ [field]: error.message });
        showToast('Validation Error', error.message, 'error');
      } else {
        showToast('Error', error.message || 'Failed to create candidate', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
     <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose} // ✅ clicking outside closes modal
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()} // ✅ prevents modal from closing when clicking inside
      >

      
   
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto border border-gray-200">
       
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              <i className="fas fa-user-plus mr-2 text-blue-500"></i>
              Add New Candidate
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
              )}
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="PLACED">Placed</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUBMITTED_BY_CLIENT">Submitted by Client</option>
                <option value="CLIENT_SHORTLIST">Client Shortlist</option>
                <option value="FIRST_INTERVIEW_SCHEDULED">1st Interview Scheduled</option>
                <option value="FIRST_INTERVIEW_FEEDBACK_PENDING">1st Interview Feedback Pending</option>
                <option value="FIRST_INTERVIEW_REJECT">1st Interview Reject</option>
                <option value="SECOND_INTERVIEW_SCHEDULED">2nd Interview Scheduled</option>
                <option value="SECOND_INTERVIEW_FEEDBACK_PENDING">2nd Interview Feedback Pending</option>
                <option value="SECOND_INTERVIEW_REJECT">2nd Interview Reject</option>
                <option value="THIRD_INTERVIEW_SCHEDULED">3rd Interview Scheduled</option>
                <option value="THIRD_INTERVIEW_FEEDBACK_PENDING">3rd Interview Feedback Pending</option>
                <option value="THIRD_INTERVIEW_REJECT">3rd Interview Reject</option>
                <option value="INTERNEL_REJECT">Internel Reject</option>
                <option value="CLIENT_REJECT">Client Reject</option>
                <option value="FINAL_SELECT">Final Select</option>
                <option value="JOINED">Joined</option>
                <option value="BACKEDOUT">Backed Out</option>
              </select>
            </div>
          </div>

          {/* About */}
          <div className="mb-4">
            <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
              About Candidate
            </label>
            <textarea
              id="about"
              value={formData.about}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          {/* Experience / Notice / Skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="text"
                id="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="noticePeriod" className="block text-sm font-medium text-gray-700 mb-1">
                Notice Period (Days)
              </label>
              <input
                type="text"
                id="noticePeriod"
                value={formData.noticePeriod}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <input
                type="text"
                id="skills"
                value={formData.skills}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* CTC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="currentCtc" className="block text-sm font-medium text-gray-700 mb-1">
                Current CTC (LPA)
              </label>
              <input
                type="text"
                id="currentCtc"
                value={formData.currentCtc}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="expectedCtc" className="block text-sm font-medium text-gray-700 mb-1">
                Expected CTC (LPA)
              </label>
              <input
                type="text"
                id="expectedCtc"
                value={formData.expectedCtc}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Resume Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF)</label>
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                id="resume"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="resume" className="cursor-pointer text-blue-600 hover:text-blue-800">
                <i className="fas fa-cloud-upload-alt text-2xl mb-2"></i>
                <p>{resumeFileName || 'Choose Resume File'}</p>
              </label>
            </div>

            {parsingStatus === 'parsing' && (
              <div className="mt-2 text-blue-600">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                <span>Parsing resume...</span>
              </div>
            )}
            {parsingStatus === 'success' && (
              <div className="mt-2 text-green-600">
                <i className="fas fa-check-circle mr-2"></i>
                <span>Resume parsed successfully</span>
              </div>
            )}
            {parsingStatus === 'error' && (
              <div className="mt-2 text-red-600">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                <span>Error parsing resume</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-save mr-2"></i>
              )}
              Save Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
    
    
  );
};

export default CreateCandidateModal;
