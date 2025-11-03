import { useState } from 'react';
import { candidateAPI } from '../../api/api';

const CreateCandidateModal = ({ onClose, onCandidateCreated, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'NEW_CANDIDATE',
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
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                <i className="fas fa-user-plus text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Add New Candidate</h2>
                <p className="text-blue-100 text-sm">Fill in the candidate details below</p>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-lg p-2 mr-3">
                  <i className="fas fa-user text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter candidate name"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                        fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="candidate@email.com"
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                        fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+91 1234567890"
                      required
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-tasks absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all"
                      required
                    >
                      <option value="NEW_CANDIDATE">New Candidate</option>
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
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>
              </div>
              
              <div className="mt-5">
                <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
                  About Candidate
                </label>
                <textarea
                  id="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Brief description about the candidate..."
                ></textarea>
              </div>
            </div>

            {/* Professional Details Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 rounded-lg p-2 mr-3">
                  <i className="fas fa-briefcase text-green-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Professional Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (Years)
                  </label>
                  <div className="relative">
                    <i className="fas fa-calendar-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="noticePeriod" className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Period (Days)
                  </label>
                  <div className="relative">
                    <i className="fas fa-clock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="noticePeriod"
                      value={formData.noticePeriod}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <div className="relative">
                    <i className="fas fa-tools absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., React, Node.js, Python"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div>
                  <label htmlFor="currentCtc" className="block text-sm font-medium text-gray-700 mb-2">
                    Current CTC (LPA)
                  </label>
                  <div className="relative">
                    <i className="fas fa-rupee-sign absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="currentCtc"
                      value={formData.currentCtc}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., 8.5"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="expectedCtc" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected CTC (LPA)
                  </label>
                  <div className="relative">
                    <i className="fas fa-rupee-sign absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      id="expectedCtc"
                      value={formData.expectedCtc}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., 12.0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-5">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <i className="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Chennai, Tamil Nadu"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 rounded-lg p-2 mr-3">
                  <i className="fas fa-file-pdf text-purple-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Resume Upload</h3>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all bg-gray-50 hover:bg-blue-50">
                <input
                  type="file"
                  id="resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="resume" className="cursor-pointer block">
                  <div className="mb-4">
                    <i className="fas fa-cloud-upload-alt text-4xl text-blue-500 mb-2"></i>
                    <p className="text-gray-700 font-medium">
                      {resumeFileName || 'Click to upload resume (PDF)'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {resumeFileName ? 'Click to change file' : 'Drag and drop or click to browse'}
                    </p>
                  </div>
                  {resumeFileName && (
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                      <i className="fas fa-file-pdf mr-2"></i>
                      <span className="text-sm font-medium">{resumeFileName}</span>
                    </div>
                  )}
                </label>
              </div>

              {parsingStatus === 'parsing' && (
                <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <i className="fas fa-spinner fa-spin text-blue-600 mr-3"></i>
                  <span className="text-blue-700 font-medium">Parsing resume data...</span>
                </div>
              )}
              {parsingStatus === 'success' && (
                <div className="mt-4 flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <i className="fas fa-check-circle text-green-600 mr-3"></i>
                  <span className="text-green-700 font-medium">Resume parsed successfully! Fields auto-filled.</span>
                </div>
              )}
              {parsingStatus === 'error' && (
                <div className="mt-4 flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <i className="fas fa-exclamation-triangle text-red-600 mr-3"></i>
                  <span className="text-red-700 font-medium">Error parsing resume. Please fill manually.</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer with Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
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
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Candidate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCandidateModal;
