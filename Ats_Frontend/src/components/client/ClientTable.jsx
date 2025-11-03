// components/ClientTable.jsx
import { useState } from 'react';

const ClientTable = ({ clients, loading, onEditClient, onViewJobDetails, onDeleteClient, searchTerm }) => {
  const [expandedClient, setExpandedClient] = useState(null);
  
  // Function to highlight search term in text
  const highlightSearchTerm = (text, term) => {
    if (!term || !text) return text;
    
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    
    // Exact match
    if (lowerText === lowerTerm) {
      return `<span class="bg-yellow-200 font-semibold px-1 rounded">${text}</span>`;
    }
    
    // Starts with match
    if (lowerText.startsWith(lowerTerm)) {
      const matchedPart = text.substr(0, term.length);
      const remainingPart = text.substr(term.length);
      return `<span class="bg-yellow-100 font-medium px-1 rounded">${matchedPart}</span>${remainingPart}`;
    }
    
    // Partial match
    const index = lowerText.indexOf(lowerTerm);
    if (index !== -1) {
      const before = text.substr(0, index);
      const matched = text.substr(index, term.length);
      const after = text.substr(index + term.length);
      return `${before}<span class="bg-yellow-50 px-1 rounded">${matched}</span>${after}`;
    }
    
    return text;
  };

  const toggleExpand = (clientId) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm">
        <div className="mx-auto w-24 h-24 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
        <p className="text-gray-500">Try adjusting your search or add a new client.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Address
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jobs
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <>
                <tr 
                  key={client.id} 
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => toggleExpand(client.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-700">
                          {client.clientName ? client.clientName.charAt(0).toUpperCase() : 'C'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          <span dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(client.clientName, searchTerm) 
                          }} />
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {client.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {client.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {client.clientNumber || client.client_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 font-medium mr-2">
                        {client.jobs ? client.jobs.length : 0}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Jobs
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClient(client);
                        }}
                        className="text-yellow-600 hover:text-yellow-900 p-2 rounded-full hover:bg-yellow-50 transition-colors"
                        title="Edit Client"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClient(client);
                        }}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete Client"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedClient === client.id && (
                  <tr className="bg-blue-50">
                    <td colSpan="5" className="px-6 py-4">
                      <div className="space-y-6">
                        {/* Action Buttons Section */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Actions</h4>
                          <div className="flex flex-wrap gap-3">
                            {client.jobs && client.jobs.length > 0 ? (
                              client.jobs.map((job, index) => (
                                <button
                                  key={job.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewJobDetails(job);
                                  }}
                                  className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                  title={`View Details for ${job.jobName}`}
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                  </svg>
                                  {job.jobName}
                                </button>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No jobs available</span>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditClient(client);
                              }}
                              className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                              title="Edit Client"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Client
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClient(client);
                              }}
                              className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                              title="Delete Client"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Client
                            </button>
                          </div>
                        </div>

                        {/* Information Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Client Details</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">ID:</span> {client.id}</p>
                              <p><span className="font-medium">Name:</span> {client.clientName || client.client_name}</p>
                              <p><span className="font-medium">Address:</span> {client.address || 'N/A'}</p>
                              <p><span className="font-medium">Contact:</span> {client.clientNumber || client.client_number || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Jobs Summary</h4>
                            <div className="text-sm text-gray-600">
                              <p><span className="font-medium">Total Jobs:</span> {client.jobs ? client.jobs.length : 0}</p>
                              {client.jobs && client.jobs.length > 0 && (
                                <div className="mt-2">
                                  <p className="font-medium text-gray-700 mb-1">Job List:</p>
                                  <div className="space-y-1">
                                    {client.jobs.map((job, index) => (
                                      <div key={job.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                        {index + 1}. {job.jobName} - {job.jobLocation || 'Location not specified'}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;