// components/ClientManagement.jsx
import { useState, useEffect } from 'react';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import ClientTable from './ClientTable';
import ClientModal from './ClientModal';
import ClientJobsModal from './ClientJobsModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import JobDetailsModal from '../job/JobDetailsModal';
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
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentJobId, setCurrentJobId] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm]);

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

    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      setFilteredClients(clients);
      return;
    }

    const result = clients.filter(client =>
      Object.values(client).some(value =>
        value && value.toString().toLowerCase().includes(term)
      )
    );

    setFilteredClients(result);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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

  const confirmDeleteClient = async () => {
    try {
      await clientAPI.delete(selectedClient.id);
      showToast('Success', 'Client deleted successfully', 'success');
      setShowDeleteModal(false);
      loadClients();
    } catch (error) {
      showToast('Error', error.message || 'Failed to delete client', 'error');
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
      <main className="flex-1 p-4">
        {/* Role badge */}
        <div className="mb-3">
          <span className={`inline-block px-3 py-4 rounded-full text-xs font-semibold ${
            userRole === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
          }`}>{userRole}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-user-tie mr-2 text-blue-500"></i>
            Client Management
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Welcome, {localStorage.getItem("username") || "User"}
            </span>
          </div>
        </div>

        {/* Filters / Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by any field..."
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleAddClient}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
          >
            <i className="fas fa-plus mr-1"></i> Add New Client
          </button>
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
            onViewCandidates={() => {
              // Optional: Add candidate viewing functionality if needed
              console.log('View candidates for job:', selectedJob.id);
            }}
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
