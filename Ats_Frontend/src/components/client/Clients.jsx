// components/ClientManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import ClientTable from './ClientTable';
import ClientModal from './ClientModal';
import ClientJobsModal from './ClientJobsModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import JobDetailsModal from '../job/JobDetailsModal';
import CandidateListModal from '../job/CandidateListModal';
import { clientAPI, jobAPI } from '../../api/api';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showJobDeleteModal, setShowJobDeleteModal] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobCandidates, setShowJobCandidates] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientIdSearch, setClientIdSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentJobId, setCurrentJobId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, clientIdSearch]);

  // Load all clients
  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientAPI.getAll();
      setClients(data || []);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter clients dynamically for all fields
  const filterClients = () => {
    if (!clients || clients.length === 0) {
      setFilteredClients([]);
      return;
    }

    let result = [...clients];

    // Filter by client ID (dedicated search - exact match)
    if (clientIdSearch) {
      const idToSearch = clientIdSearch.trim();
      result = result.filter(client => {
        if (client.id) {
          return client.id.toString() === idToSearch;
        }
        return false;
      });
    }

    // Filter by search term (general search - excludes ID)
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(client =>
        client &&
        (
          (client.clientName && client.clientName.toLowerCase().includes(term)) ||
          (client.client_name && client.client_name.toLowerCase().includes(term)) ||
          (client.contactPerson && client.contactPerson.toLowerCase().includes(term)) ||
          (client.email && client.email.toLowerCase().includes(term)) ||
          (client.phone && client.phone.toLowerCase().includes(term)) ||
          (client.address && client.address.toLowerCase().includes(term)) ||
          (client.jobs && Array.isArray(client.jobs) && client.jobs.some(job =>
            job.jobName && job.jobName.toLowerCase().includes(term)
          ))
        )
      );
    }

    setFilteredClients(result);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setShowClientModal(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleViewJobs = (client) => {
    setSelectedClient(client);
    setShowJobsModal(true);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const handleDeleteJob = (jobId) => {
    setCurrentJobId(jobId);
    setShowJobDeleteModal(true);
  };

  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleViewJobCandidates = (job) => {
    setSelectedJob(job);
    setShowJobDetails(false);
    setShowJobCandidates(true);
  };

  const handleViewCandidateDetails = (candidate) => {
    setShowJobCandidates(false);
    if (candidate?.id) {
      navigate(`/candidates/${candidate.id}`);
    }
  };

  const confirmDeleteClient = async () => {
    try {
      await clientAPI.delete(selectedClient.id);
      showToast('Success', 'Client deleted successfully', 'success');
      setShowDeleteModal(false);
      loadClients();
    } catch (error) {
      let message = error?.message || 'Failed to delete client';
      if (message.toLowerCase().includes('existing jobs')) {
        message = 'This client still has jobs assigned. Please move or delete their jobs before removing the client.';
      }
      showToast('Heads up', message, 'warning');
    }
  };

  const confirmDeleteJob = async () => {
    try {
      await jobAPI.delete(currentJobId);
      showToast('Success', 'Job deleted successfully', 'success');
      setShowJobDeleteModal(false);
      
      if (selectedClient) {
        const updatedClient = await clientAPI.getById(selectedClient.id);
        setSelectedClient(updatedClient);
      }
    } catch (error) {
      showToast('Error', error.message || 'Failed to delete job', 'error');
    }
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (selectedClient) {
        await clientAPI.update(selectedClient.id, clientData);
        showToast('Success', 'Client updated successfully', 'success');
      } else {
        await clientAPI.create(clientData);
        showToast('Success', 'Client created successfully', 'success');
      }
      setShowClientModal(false);
      loadClients();
    } catch (error) {
      showToast('Error', error.message || 'Failed to save client', 'error');
    }
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
              <p className="text-gray-600 mt-1">Manage and track all clients</p>
            </div>
          </div>
        </div>

        {/* Real-time ATS Search Bar */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-4 mb-6 border border-purple-100">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* Client Count - Inline */}
            <div className="flex items-center gap-2 px-3 py-3.5 bg-white rounded-lg border-2 border-purple-200 shadow-sm">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium text-purple-700 whitespace-nowrap">Clients:</span>
              <span className="text-lg font-bold text-purple-900">{filteredClients.length}</span>
            </div>
            {/* General Search - Large and Prominent */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search clients by name, contact person, email, phone, address, or job..."
                  className="w-full pl-12 pr-12 py-3.5 text-base border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-purple-50 rounded-r-lg transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ID Search - Compact */}
            <div className="w-full lg:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Client ID..."
                  className="w-full pl-10 pr-10 py-3.5 text-base border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                  value={clientIdSearch}
                  onChange={(e) => setClientIdSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      filterClients();
                    }
                  }}
                />
                {clientIdSearch && (
                  <button
                    onClick={() => {
                      setClientIdSearch('');
                      filterClients();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
                    title="Clear ID search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Clear Button - Only show when search is active */}
            {(searchTerm || clientIdSearch) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setClientIdSearch('');
                  loadClients();
                }}
                className="px-4 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm"
              >
                Clear All
              </button>
            )}

            {/* Add Client Button - Inline */}
            <button
              onClick={handleAddClient}
              className="px-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 font-medium whitespace-nowrap shadow-sm"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Client
            </button>
          </div>
          
          {/* Real-time Results Count */}
          {(searchTerm || clientIdSearch) && (
            <div className="mt-3 flex items-center text-sm text-purple-700">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found</span>
              {(searchTerm || clientIdSearch) && (
                <span className="ml-2 text-purple-600">
                  {searchTerm && `• "${searchTerm}"`}
                  {clientIdSearch && ` • ID: ${clientIdSearch}`}
                </span>
              )}
            </div>
          )}
        </div>


        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <ClientTable
            clients={filteredClients}
            loading={loading}
            onEditClient={handleEditClient}
            onViewJobDetails={handleViewJobDetails}
            onDeleteClient={handleDeleteClient}
            searchTerm={searchTerm}
          />
        </div>

        {/* Modals */}
        {showClientModal && (
          <ClientModal
            client={selectedClient}
            onSave={handleSaveClient}
            onClose={() => {
              setShowClientModal(false);
              setSelectedClient(null);
            }}
          />
        )}

        {showJobsModal && selectedClient && (
          <ClientJobsModal
            client={selectedClient}
            onClose={() => {
              setShowJobsModal(false);
              setSelectedClient(null);
            }}
            onDeleteJob={handleDeleteJob}
            onJobAssigned={() => {
              loadClients(); // Reload clients to refresh job list
            }}
          />
        )}

        {showDeleteModal && selectedClient && (
          <DeleteConfirmationModal
            title="Delete Client"
            message={`Are you sure you want to delete client "${selectedClient.clientName || selectedClient.client_name}"? This action cannot be undone.`}
            onConfirm={confirmDeleteClient}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedClient(null);
            }}
          />
        )}

        {showJobDeleteModal && (
          <DeleteConfirmationModal
            title="Delete Job"
            message="Are you sure you want to delete this job? This action cannot be undone."
            onConfirm={confirmDeleteJob}
            onClose={() => setShowJobDeleteModal(false)}
          />
        )}

        {showJobDetails && selectedJob && (
          <JobDetailsModal
            job={selectedJob}
            onClose={() => {
              setShowJobDetails(false);
              setSelectedJob(null);
            }}
            onViewCandidates={handleViewJobCandidates}
          />
        )}

        {showJobCandidates && selectedJob && (
          <CandidateListModal
            job={selectedJob}
            onClose={() => {
              setShowJobCandidates(false);
            }}
            onViewCandidate={handleViewCandidateDetails}
          />
        )}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Loading clients...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientManagement;
