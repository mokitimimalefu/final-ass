import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const ApplicationManagement = ({ instituteId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, [instituteId]);

  const loadApplications = async () => {
    try {
      const q = query(collection(db, 'applications'), where('instituteId', '==', instituteId));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status,
        updatedAt: serverTimestamp()
      });
      alert(`Application ${status} successfully`);
      loadApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      const errorMessage = error.message || 'Failed to update application status';
      alert(`Error: ${errorMessage}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-warning',
      admitted: 'bg-success',
      rejected: 'bg-danger'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Student Applications</h3>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="admitted">Admitted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-file-earmark-text-fill text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">
            {filter === 'all' ? 'No applications received yet' : `No ${filter} applications`}
          </h5>
          <p className="text-muted">
            {filter === 'all' ? 'Applications will appear here once students apply to your courses' : `No applications with ${filter} status`}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Application ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map(application => (
                <tr key={application.id}>
                  <td>{application.id.slice(-8)}</td>
                  <td>{application.studentName || application.student?.name || 'N/A'}</td>
                  <td>{application.studentEmail || application.student?.email || 'N/A'}</td>
                  <td>{application.courseName || 'N/A'}</td>
                  <td>{application.appliedDate?.toDate ? application.appliedDate.toDate().toLocaleDateString() : (application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A')}</td>
                  <td>
                    <span className={getStatusBadge(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {application.status === 'pending' ? (
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusUpdate(application.id, 'admitted')}
                          title="Admit"
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          title="Reject"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">No actions available</span>
                    )}
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

export default ApplicationManagement;
