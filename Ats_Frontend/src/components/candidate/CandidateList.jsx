import React, { useState, useEffect } from 'react';
import { candidateAPI } from '../../api/candidate';
import CandidateCard from './CandidateCard';
import CandidateFilters from './CandidateFilters';

const CandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, statusFilter]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await candidateAPI.getAll();
      setCandidates(data || []);
    } catch (error) {
      console.error('Error loading candidates:', error);
      showToast('Error', 'Failed to load candidates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let result = [...candidates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(candidate =>
        (candidate.name && candidate.name.toLowerCase().includes(term)) ||
        (candidate.email && candidate.email.toLowerCase().includes(term)) ||
        (candidate.phone && candidate.phone.includes(term)) ||
        (candidate.skills && candidate.skills.toLowerCase().includes(term)) ||
        (candidate.id && candidate.id.toString().includes(term))
      );
    }

    if (statusFilter) {
      result = result.filter(candidate => candidate.status === statusFilter);
    }

    setFilteredCandidates(result);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Candidate Management</h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
          <i className="fas fa-plus mr-2"></i> Add Candidate
        </button>
      </div>

      <CandidateFilters 
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map(candidate => (
          <CandidateCard 
            key={candidate.id} 
            candidate={candidate} 
            onEdit={() => handleEdit(candidate)}
            onDelete={() => handleDelete(candidate.id)}
          />
        ))}
      </div>

      {filteredCandidates.length === 0 && !loading && (
        <div className="text-center py-12">
          <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-500">No candidates found</h3>
          <p className="text-gray-400">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
};

export default CandidateList;