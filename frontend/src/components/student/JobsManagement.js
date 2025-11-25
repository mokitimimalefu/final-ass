import React, { useState } from 'react';

const JobsManagement = ({ jobs, applyForJob, profile, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [typeFilter, setTypeFilter] = useState('All Types');

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading job opportunities...</p>
      </div>
    );
  }

  // Get unique categories and types
  const categories = ['All Categories', ...new Set(jobs.map(job => job.category).filter(Boolean))];
  const types = ['All Types', ...new Set(jobs.map(job => job.type).filter(Boolean))];

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All Categories' || job.category === categoryFilter;
    const matchesType = typeFilter === 'All Types' || job.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const canApplyForJob = (job) => {
    if (!profile.completedStudies) {
      return { canApply: false, reason: 'You need to complete your studies and upload transcripts to apply for jobs.' };
    }
    
    if (!profile.resumeUrl) {
      return { canApply: false, reason: 'Please upload your resume in your profile to apply for jobs.' };
    }
    
    return { canApply: true };
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Job Opportunities</h2>
        <span className="badge bg-primary fs-6">
          {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''} Available
        </span>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search jobs, companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select 
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select 
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button 
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All Categories');
              setTypeFilter('All Types');
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {!profile.completedStudies && (
        <div className="alert alert-warning mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Note:</strong> Complete your profile and upload academic transcripts to apply for jobs.
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-briefcase text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No Job Opportunities</h5>
          <p className="text-muted">
            {jobs.length === 0 
              ? 'No job postings available at the moment.' 
              : 'No jobs match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredJobs.map(job => {
            const { canApply, reason } = canApplyForJob(job);
            
            return (
              <div key={job.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h6 className="mb-1">{job.title}</h6>
                    <small>{job.companyName}</small>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {job.category && (
                          <span className="badge bg-primary">{job.category}</span>
                        )}
                        {job.type && (
                          <span className="badge bg-secondary">{job.type}</span>
                        )}
                        {job.salary && (
                          <span className="badge bg-success">{job.salary}</span>
                        )}
                      </div>
                      
                      {job.location && (
                        <p className="small mb-1">
                          <i className="bi bi-geo-alt me-1"></i>
                          {job.location}
                        </p>
                      )}
                      
                      {job.deadline && (
                        <p className="small mb-2">
                          <i className="bi bi-clock me-1"></i>
                          Apply by: {new Date(job.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {job.description && (
                      <p className="small text-muted mb-3">
                        {job.description.length > 120 
                          ? `${job.description.substring(0, 120)}...` 
                          : job.description
                        }
                      </p>
                    )}

                    {job.requirements && (
                      <div className="mb-3">
                        <small className="fw-bold">Requirements:</small>
                        <p className="small text-muted mb-0">
                          {job.requirements.length > 100 
                            ? `${job.requirements.substring(0, 100)}...` 
                            : job.requirements
                          }
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="card-footer bg-transparent">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        data-bs-toggle="modal"
                        data-bs-target={`#jobModal-${job.id}`}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => applyForJob(job)}
                        className="btn btn-sm btn-success flex-fill"
                        disabled={!canApply}
                        title={!canApply ? reason : 'Apply for this job'}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Job Details Modal */}
                <div className="modal fade" id={`jobModal-${job.id}`} tabIndex="-1">
                  <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">{job.title}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div className="modal-body">
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <p><strong>Company:</strong> {job.companyName}</p>
                            <p><strong>Location:</strong> {job.location || 'Not specified'}</p>
                            <p><strong>Type:</strong> {job.type || 'Not specified'}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>Category:</strong> {job.category || 'Not specified'}</p>
                            <p><strong>Salary:</strong> {job.salary || 'Not specified'}</p>
                            <p><strong>Deadline:</strong> {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not specified'}</p>
                          </div>
                        </div>
                        
                        {job.description && (
                          <div className="mb-3">
                            <h6>Job Description</h6>
                            <p className="border p-3 rounded bg-light">{job.description}</p>
                          </div>
                        )}
                        
                        {job.requirements && (
                          <div className="mb-3">
                            <h6>Requirements</h6>
                            <p className="border p-3 rounded bg-light">{job.requirements}</p>
                          </div>
                        )}
                        
                        {job.responsibilities && (
                          <div className="mb-3">
                            <h6>Responsibilities</h6>
                            <p className="border p-3 rounded bg-light">{job.responsibilities}</p>
                          </div>
                        )}
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button
                          onClick={() => {
                            applyForJob(job);
                            const modal = document.getElementById(`jobModal-${job.id}`);
                            const bsModal = bootstrap.Modal.getInstance(modal);
                            bsModal.hide();
                          }}
                          className="btn btn-success"
                          disabled={!canApply}
                        >
                          Apply for this Job
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobsManagement;