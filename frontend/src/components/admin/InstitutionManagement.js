import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const InstitutionManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact: {
      email: '',
      phone: '',
      address: ''
    },
    description: '',
    website: '',
    isActive: true
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const snap = await getDocs(collection(db, 'institutions'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInstitutions(data);
    } catch (error) {
      console.error('Error loading institutions:', error);
      alert('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        contact: {
          ...formData.contact,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInstitution) {
        await updateDoc(doc(db, 'institutions', editingInstitution.id), formData);
        alert('Institution updated successfully');
      } else {
        await addDoc(collection(db, 'institutions'), formData);
        alert('Institution added successfully');
      }
      setShowModal(false);
      resetForm();
      loadInstitutions();
    } catch (error) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleEdit = (institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name || '',
      location: institution.location || '',
      contact: institution.contact || { email: '', phone: '', address: '' },
      description: institution.description || '',
      website: institution.website || '',
      isActive: institution.isActive !== undefined ? institution.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = async (institutionId) => {
    if (!window.confirm('Are you sure you want to delete this institution?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'institutions', institutionId));
      alert('Institution deleted successfully');
      loadInstitutions();
    } catch (error) {
      alert(error.message || 'Failed to delete institution');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      contact: { email: '', phone: '', address: '' },
      description: '',
      website: '',
      isActive: true
    });
    setEditingInstitution(null);
  };

  if (loading) {
    return <div className="text-center p-4">Loading institutions...</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Manage Institutions</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Institution
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Contact Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No institutions found</td>
              </tr>
            ) : (
              institutions.map((institution) => (
                <tr key={institution.id}>
                  <td>{institution.name}</td>
                  <td>{institution.location}</td>
                  <td>{institution.contact?.email || 'N/A'}</td>
                  <td>{institution.contact?.phone || 'N/A'}</td>
                  <td>
                    <span className={`badge ${institution.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {institution.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => handleEdit(institution)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(institution.id)}
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

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingInstitution ? 'Edit Institution' : 'Add Institution'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Institution Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Location *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contact Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="contact.email"
                      value={formData.contact.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="contact.phone"
                      value={formData.contact.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      name="contact.address"
                      value={formData.contact.address}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-control"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <label className="form-check-label">Active</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingInstitution ? 'Update' : 'Add'} Institution
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

export default InstitutionManagement;


