// components/ClientModal.jsx
import { useState, useEffect } from 'react';

const ClientModal = ({ client, onSave, onClose }) => {
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setClientName(client.client_name || '');
      setClientAddress(client.address || '');
      setClientNumber(client.client_number || '');
    } else {
      setClientName('');
      setClientAddress('');
      setClientNumber('');
    }
    setErrors({});
  }, [client]);

  const validateForm = () => {
    const newErrors = {};
    if (!clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!clientNumber.trim()) newErrors.clientNumber = 'Contact number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const clientData = {
      client_name: clientName,
      address: clientAddress,
      client_number: clientNumber,
    };

    if (client) clientData.id = client.id;
    onSave(clientData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose} // ✅ close modal when clicking outside
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-gray-200"
        onClick={(e) => e.stopPropagation()} // ✅ stop closing when clicking inside
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {client ? 'Edit Client' : 'Add New Client'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Client Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.clientName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter client name"
            />
            {errors.clientName && (
              <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>
            )}
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Enter client address"
            />
          </div>

          {/* Contact Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="text"
              value={clientNumber}
              onChange={(e) => setClientNumber(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.clientNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter contact number"
            />
            {errors.clientNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.clientNumber}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {client ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
