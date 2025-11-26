import React from 'react';

const ApplicationsManagement = ({ applications, getStatusBadge, loading }) => {
  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading applications...</p>
      </div>
    );
  }

  const getApplicationCounts = () => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const admitted = applications.filter(app => app.status === 'admitted').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    return { pending, admitted, rejected };
  };

  const counts = getApplicationCounts();

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Applications</h2>
        <span className="badge bg-primary fs-6">
          {applications.length} Application{applications.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Application Statistics */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center border-warning">
            <div className="card-body">
              <h3 className="text-warning">{counts.pending}</h3>
              <p className="mb-0">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center border-success">
            <div className="card-body">
              <h3 className="text-success">{counts.admitted}</h3>
              <p className="mb-0">Admitted</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center border-danger">
            <div className="card-body">
              <h3 className="text-danger">{counts.rejected}</h3>
              <p className="mb-0">Not Admitted</p>
            </div>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-file-earmark-text text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No Applications Yet</h5>
          <p className="text-muted">You haven't applied to any courses yet.</p>
          <button className="btn btn-primary">
            Browse Institutions
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Course & Institution</th>
                <th>Faculty</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <div>
                      <strong className="d-block">{application.courseName}</strong>
                      <small className="text-muted">{application.instituteName}</small>
                      {application.courseCode && (
                        <div className="text-muted small">Code: {application.courseCode}</div>
                      )}
                    </div>
                  </td>
                  <td>{application.facultyName}</td>
                  <td>
                    {application.appliedDate?.toDate?.() 
                      ? new Date(application.appliedDate.toDate()).toLocaleDateString()
                      : new Date(application.appliedDate).toLocaleDateString()
                    }
                  </td>
                  <td>{getStatusBadge(application.status)}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      data-bs-toggle="modal"
                      data-bs-target={`#applicationModal-${application.id}`}
                    >
                      View Details
                    </button>
                    
                    {/* Application Details Modal */}
                    <div className="modal fade" id={`applicationModal-${application.id}`} tabIndex="-1">
                      <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Application Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                          </div>
                          <div className="modal-body">
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="text-dark">Course Information</h6>
                                <p><strong className="text-white">Course:</strong> {application.courseName}</p>
                                <p><strong className="text-white">Institution:</strong> {application.instituteName}</p>
                                <p><strong className="text-white">Faculty:</strong> {application.facultyName}</p>
                              </div>
                              <div className="col-md-6">
                                <h6>Application Details</h6>
                                <p><strong>Status:</strong> {getStatusBadge(application.status)}</p>
                                <p><strong>Applied Date:</strong> {
                                  application.appliedDate?.toDate?.() 
                                    ? new Date(application.appliedDate.toDate()).toLocaleDateString()
                                    : new Date(application.appliedDate).toLocaleDateString()
                                }</p>
                                <p><strong>Last Updated:</strong> {
                                  application.updatedAt?.toDate?.() 
                                    ? new Date(application.updatedAt.toDate()).toLocaleDateString()
                                    : application.updatedAt 
                                      ? new Date(application.updatedAt).toLocaleDateString()
                                      : 'N/A'
                                }</p>
                              </div>
                            </div>
                            {application.personalStatement && (
                              <div className="mt-3">
                                <h6>Personal Statement</h6>
                                <p className="border p-3 rounded bg-light">
                                  {application.personalStatement}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManagement;