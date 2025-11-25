import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const AdmissionsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishFormData, setPublishFormData] = useState({
    instituteId: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    requirements: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appsSnap, admSnap, instSnap] = await Promise.all([
        getDocs(collection(db, 'applications')).catch(err => {
          console.error('Error loading applications:', err);
          return { docs: [] };
        }),
        getDocs(collection(db, 'admissions')).catch(err => {
          console.error('Error loading admissions:', err);
          return { docs: [] };
        }),
        getDocs(collection(db, 'institutions')).catch(err => {
          console.error('Error loading institutions:', err);
          return { docs: [] };
        })
      ]);

      const appsData = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const admData = admSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const instData = instSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setApplications(appsData);
      setAdmissions(admData);
      // Filter to show only active institutions with names
      const activeInstitutions = instData.filter(
        inst => inst.isActive !== false && inst.name
      );
      setInstitutions(activeInstitutions);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays on error
      setApplications([]);
      setAdmissions([]);
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'admissions'), {
        ...publishFormData,
        publishedAt: new Date(),
        isActive: true
      });
      alert('Admissions published successfully');
      setShowPublishModal(false);
      setPublishFormData({
        instituteId: '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        requirements: ''
      });
      loadData();
    } catch (error) {
      alert(error.message || 'Failed to publish admissions');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning',
      admitted: 'bg-success',
      rejected: 'bg-danger',
      confirmed: 'bg-info'
    };
    return badges[status] || 'bg-secondary';
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Admissions Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowPublishModal(true)}
        >
          + Publish Admissions
        </button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            Applications ({applications.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'admissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('admissions')}
          >
            Published Admissions ({admissions.length})
          </button>
        </li>
      </ul>

      {activeTab === 'applications' && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student Email</th>
                <th>Institution</th>
                <th>Course</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No applications found</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.studentName || 'Unknown'}</td>
                    <td>{app.studentEmail || 'Unknown'}</td>
                    <td>{app.instituteName || 'Unknown'}</td>
                    <td>{app.courseName || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(app.status)}`}>
                        {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td>{app.appliedDate && app.appliedDate.seconds ? new Date(app.appliedDate.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'admissions' && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Title</th>
                <th>Institution</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Published Date</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No admissions published</td>
                </tr>
              ) : (
                admissions.map((admission) => (
                  <tr key={admission.id}>
                    <td>{admission.title || 'N/A'}</td>
                    <td>{admission.instituteName || 'Unknown'}</td>
                    <td>{admission.startDate ? new Date(admission.startDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{admission.endDate ? new Date(admission.endDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{admission.publishedAt && admission.publishedAt.seconds ? new Date(admission.publishedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showPublishModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Publish Admissions</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPublishModal(false)}
                ></button>
              </div>
              <form onSubmit={handlePublishSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Institution *</label>
                    <select
                      className="form-select"
                      value={publishFormData.instituteId}
                      onChange={(e) => setPublishFormData({ ...publishFormData, instituteId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Institution --</option>
                      {institutions
                        .filter(inst => inst.isActive !== false && inst.name)
                        .map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name || `Institution ${inst.id}`}
                        </option>
                      ))}
                    </select>
                    {institutions.length === 0 && (
                      <small className="text-muted">No institutions available. Please add institutions first.</small>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={publishFormData.title}
                      onChange={(e) => setPublishFormData({ ...publishFormData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={publishFormData.description}
                      onChange={(e) => setPublishFormData({ ...publishFormData, description: e.target.value })}
                      rows="3"
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={publishFormData.startDate}
                        onChange={(e) => setPublishFormData({ ...publishFormData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={publishFormData.endDate}
                        onChange={(e) => setPublishFormData({ ...publishFormData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Requirements</label>
                    <textarea
                      className="form-control"
                      value={publishFormData.requirements}
                      onChange={(e) => setPublishFormData({ ...publishFormData, requirements: e.target.value })}
                      rows="2"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPublishModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Publish
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionsManagement;
