import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const FacultyManagement = ({ instituteId }) => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadFaculties();
  }, [instituteId]);

  const loadFaculties = async () => {
    try {
      // Try top-level faculties with instituteId
      const q = query(collection(db, 'faculties'), where('institutionId', '==', instituteId));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Fallback nested subcollection
      if (data.length === 0) {
        const nestedSnap = await getDocs(collection(db, 'institutions', instituteId, 'faculties'));
        data = nestedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      setFaculties(data || []);
    } catch (error) {
      console.error('Error loading faculties:', error);
      alert('Failed to load faculties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await updateDoc(doc(db, 'faculties', editingFaculty.id), {
          ...formData,
          institutionId: instituteId
        });
        // best-effort nested
        try {
          await updateDoc(doc(db, 'institutions', instituteId, 'faculties', editingFaculty.id), {
            ...formData,
            institutionId: instituteId
          });
        } catch {}
        alert('Faculty updated successfully');
      } else {
        const created = await addDoc(collection(db, 'faculties'), {
          ...formData,
          institutionId: instituteId,
          isActive: true,
          createdAt: new Date()
        });
        // mirror nested
        try {
          await updateDoc(doc(db, 'institutions', instituteId, 'faculties', created.id), {
            ...formData,
            institutionId: instituteId,
            isActive: true,
            createdAt: new Date()
          });
        } catch {}
        alert('Faculty added successfully');
      }
      setShowModal(false);
      setEditingFaculty(null);
      resetForm();
      loadFaculties();
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert(error.message || 'Failed to save faculty');
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name || '',
      description: faculty.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (facultyId) => {
    if (window.confirm('Are you sure you want to delete this faculty? This will also delete all courses under it.')) {
      try {
        await deleteDoc(doc(db, 'faculties', facultyId));
        try {
          await deleteDoc(doc(db, 'institutions', instituteId, 'faculties', facultyId));
        } catch {}
        alert('Faculty deleted successfully');
        loadFaculties();
      } catch (error) {
        console.error('Error deleting faculty:', error);
        alert(error.message || 'Failed to delete faculty');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  const openAddModal = () => {
    setEditingFaculty(null);
    resetForm();
    setShowModal(true);
  };

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
        <h3>Faculty Management</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Faculty
        </button>
      </div>

      {faculties.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-building text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No faculties added yet</h5>
          <p className="text-muted">Click "Add Faculty" to create a new faculty/department</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map(faculty => (
                <tr key={faculty.id}>
                  <td>{faculty.name}</td>
                  <td>{faculty.description || '-'}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleEdit(faculty)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(faculty.id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingFaculty ? 'Edit Faculty' : 'Add Faculty'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                    setEditingFaculty(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Faculty Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="e.g., Faculty of Information & Communication Technology"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      placeholder="Brief description of the faculty"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                      setEditingFaculty(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
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

export default FacultyManagement;
