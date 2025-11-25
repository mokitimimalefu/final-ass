import React from 'react';

const JobsTab = ({ jobs }) => (
  <div>
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="h3 mb-0">Job Opportunities</h2>
      <div className="d-flex gap-2">
        <input
          type="text"
          placeholder="Search jobs..."
          className="form-control"
          style={{ width: '250px' }}
        />
        <select className="form-select" style={{ width: '150px' }}>
          <option>All Job Types</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Internship</option>
        </select>
      </div>
    </div>

    {jobs.length === 0 ? (
      <div className="text-center py-5">
        <i className="bi bi-briefcase text-muted fs-1 mb-3"></i>
        <h5 className="text-muted">No jobs available</h5>
        <p className="text-muted">Check back later for new job opportunities</p>
      </div>
    ) : (
      <div className="row g-4">
        {jobs.map(job => (
          <div key={job.id} className="col-lg-6">
            <div className="card h-100 border-start border-primary border-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{job.title}</h5>
                  <p className="text-muted mb-0 small">{job.company} • {job.location}</p>
                </div>
                {job.matchScore && (
                  <span className="badge bg-success">
                    {job.matchScore}% Match
                  </span>
                )}
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-3 text-muted small mb-3">
                  {job.type && <span><i className="bi bi-briefcase me-1"></i>{job.type}</span>}
                  {job.salary && <span><i className="bi bi-cash me-1"></i>{job.salary}</span>}
                  {job.postedDate && <span><i className="bi bi-calendar me-1"></i>Posted {typeof job.postedDate === 'string' ? job.postedDate : new Date(job.postedDate.seconds * 1000).toLocaleDateString()}</span>}
                </div>
                <p className="text-muted mb-3">
                  {job.description || 'We are looking for qualified candidates to join our team...'}
                </p>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1">
                    Apply Now
                  </button>
                  <button className="btn btn-outline-secondary">
                    <i className="bi bi-heart"></i>
                  </button>
                  <button className="btn btn-outline-secondary">
                    <i className="bi bi-bookmark"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default JobsTab;
