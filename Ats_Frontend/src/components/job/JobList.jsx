import React from 'react';

const JobList = ({ jobs, loading, onViewDetails, onEdit, onDelete, onViewCandidates }) => {
  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div id="emptyState" className="empty-state">
        <i className="fas fa-briefcase"></i>
        <h3>No Jobs Found</h3>
        <p>Try adjusting your search or add a new job</p>
      </div>
    );
  }

  return (
    <div id="jobsTableContainer">
      <table id="jobsTable">
        <thead>
          <tr>
            <th>Sno</th>
            <th>Job Title</th>
            <th>Location</th>
            <th>Job Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr key={job.id}>
              <td>{index + 1}</td>
              <td>
                <span 
                  className="job-title-link" 
                  onClick={() => onViewDetails(job.id)}
                >
                  {job.jobName || ''}
                </span>
              </td>
              <td>{job.jobLocation || ''}</td>
              <td>
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
              </td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="btn btn-warning btn-sm btn-icon"
                    onClick={() => onEdit(job)}
                    title="Edit Job"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-danger btn-sm btn-icon"
                    onClick={() => onDelete(job.id)}
                    title="Delete Job"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                  <button 
                    className="btn btn-info btn-sm btn-icon"
                    onClick={() => onViewCandidates(job.id, job.jobName)}
                    title="View Candidates"
                  >
                    <i className="fas fa-users"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobList;