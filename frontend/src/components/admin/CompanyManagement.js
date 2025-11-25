import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const snap = await getDocs(collection(db, 'companies'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
      alert('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyId) => {
    try {
      await updateDoc(doc(db, 'companies', companyId), { status: 'approved' });
      alert('Company approved successfully');
      loadCompanies();
    } catch (error) {
      alert(error.message || 'Failed to approve company');
    }
  };

  const handleSuspend = async (companyId) => {
    if (!window.confirm('Are you sure you want to suspend this company?')) {
      return;
    }
    try {
      await updateDoc(doc(db, 'companies', companyId), { status: 'suspended' });
      alert('Company suspended successfully');
      loadCompanies();
    } catch (error) {
      alert(error.message || 'Failed to suspend company');
    }
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'companies', companyId));
      alert('Company deleted successfully');
      loadCompanies();
    } catch (error) {
      alert(error.message || 'Failed to delete company');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning',
      approved: 'bg-success',
      suspended: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  if (loading) {
    return <div className="text-center p-4">Loading companies...</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Manage Companies</h2>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Email</th>
              <th>Industry</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No companies found</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name || 'N/A'}</td>
                  <td>{company.contact?.email || company.email || 'N/A'}</td>
                  <td>{company.industry || 'N/A'}</td>
                  <td>{company.contact?.phone || company.phone || 'N/A'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(company.status)}`}>
                      {company.status ? company.status.charAt(0).toUpperCase() + company.status.slice(1) : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {company.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleApprove(company.id)}
                      >
                        Approve
                      </button>
                    )}
                    {company.status === 'approved' && (
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleSuspend(company.id)}
                      >
                        Suspend
                      </button>
                    )}
                    {company.status === 'suspended' && (
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleApprove(company.id)}
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(company.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyManagement;
