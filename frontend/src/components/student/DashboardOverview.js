import React from 'react';

const DashboardOverview = ({ 
  applications, 
  jobs, 
  profile, 
  transcripts, 
  certificates, 
  getStatusBadge, 
  setActiveTab 
}) => {
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const admittedApplications = applications.filter(app => app.status === 'admitted').length;
  const recentApplications = applications.slice(0, 3);
  const recentJobs = jobs.slice(0, 3);

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center border-primary">
            <div className="card-body">
              <i className="bi bi-file-earmark-text text-primary fs-1 mb-3"></i>
              <h3 className="text-primary">{applications.length}</h3>
              <p className="mb-0 text-primary">Total Applications</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-warning">
            <div className="card-body">
              <i className="bi bi-clock text-warning fs-1 mb-3"></i>
              <h3 className="text-warning">{pendingApplications}</h3>
              <p className="mb-0 text-warning">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-success">
            <div className="card-body">
              <i className="bi bi-check-circle text-success fs-1 mb-3"></i>
              <h3 className="text-success">{admittedApplications}</h3>
              <p className="mb-0 text-success">Admitted</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-info">
            <div className="card-body">
              <i className="bi bi-briefcase text-info fs-1 mb-3"></i>
              <h3 className="text-info">{jobs.length}</h3>
              <p className="mb-0 text-info">Available Jobs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Applications */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Applications</h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setActiveTab('applications')}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {recentApplications.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-file-earmark-text text-muted fs-1 mb-3"></i>
                  <p className="text-muted">No applications yet</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('institutions')}
                  >
                    Browse Institutions
                  </button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentApplications.map(application => (
                    <div key={application.id} className="list-group-item recent-application-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 text-primary">{application.courseName}</h6>
                        <small className="text-primary">{application.instituteName}</small>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Job Opportunities */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Job Opportunities</h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setActiveTab('jobs')}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {recentJobs.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-briefcase text-muted fs-1 mb-3"></i>
                  <p className="text-muted">No job opportunities available</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentJobs.map(job => (
                    <div key={job.id} className="list-group-item">
                      <h6 className="mb-1">{job.title}</h6>
                      <small className="text-muted">{job.companyName}</small>
                      <div className="mt-2">
                        {job.type && <span className="badge bg-secondary me-1 job-badge">{job.type}</span>}
                        {job.location && <span className="badge bg-light text-dark job-badge">{job.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-primary w-100 h-100 py-3"
                    onClick={() => setActiveTab('institutions')}
                  >
                    <i className="bi bi-building fs-1 d-block mb-2"></i>
                    Browse Institutions
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-success w-100 h-100 py-3"
                    onClick={() => setActiveTab('jobs')}
                  >
                    <i className="bi bi-briefcase fs-1 d-block mb-2"></i>
                    Find Jobs
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-info w-100 h-100 py-3"
                    onClick={() => setActiveTab('profile')}
                  >
                    <i className="bi bi-person fs-1 d-block mb-2"></i>
                    Update Profile
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-warning w-100 h-100 py-3"
                    onClick={() => setActiveTab('documents')}
                  >
                    <i className="bi bi-folder fs-1 d-block mb-2"></i>
                    Upload Documents
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;