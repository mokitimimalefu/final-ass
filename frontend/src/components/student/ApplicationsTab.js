import React from 'react';

const ApplicationsTab = ({ applications, getStatusBadge }) => {
  // Sort by applied date (newest first)
  const sortedApplications = [...(Array.isArray(applications) ? applications : [])]
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0">My Applications</h2>
        <div className="d-flex gap-2">
          <div className="input-group" style={{ width: '300px' }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search applications..."
            />
          </div>
        </div>
      </div>

      {sortedApplications.length === 0 ? (
        <div className="card text-center p-5">
          <i className="bi bi-file-earmark-text text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No applications submitted yet</h5>
          <p className="text-muted">Start by browsing institutions and courses</p>
          <button className="btn btn-primary mx-auto mt-3">
            <i className="bi bi-building me-2"></i>
            Browse Institutions
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {sortedApplications.map(application => (
            <div key={application.id} className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h5 className="card-title mb-1">{application.courseName || 'Unknown Course'}</h5>
                    <p className="text-muted mb-2">{application.instituteName || 'Unknown Institution'}</p>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      <span>
                        <i className="bi bi-calendar me-1"></i>
                        Applied: {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'N/A'}
                      </span>
                      <span>
                        <i className="bi bi-hash me-1"></i>
                        App ID: {application.id?.substring(0, 8) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2">
                    {getStatusBadge(application.status)}
                    {application.status === 'admitted' && (
                      <button className="btn btn-sm btn-success">
                        <i className="bi bi-download me-1"></i>
                        Download Offer Letter
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-eye me-1"></i>
                      View Details
                    </button>
                  </div>
                </div>
                
                {/* Admission Results Section */}
                {application.status === 'admitted' && (
                  <div className="mt-3 p-3 bg-success bg-opacity-10 rounded">
                    <h6 className="text-success">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Congratulations! You've been admitted
                    </h6>
                    <p className="mb-0 text-muted small">
                      Your application has been approved. Please check your email for next steps.
                    </p>
                    <button className="btn btn-sm btn-success mt-2">
                      <i className="bi bi-check2-circle me-1"></i>
                      Confirm Admission
                    </button>
                  </div>
                )}
                
                {application.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-danger bg-opacity-10 rounded">
                    <h6 className="text-danger">
                      <i className="bi bi-x-circle-fill me-2"></i>
                      Application Not Successful
                    </h6>
                    <p className="mb-0 text-muted small">
                      Thank you for your application. We encourage you to apply for other programs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsTab;