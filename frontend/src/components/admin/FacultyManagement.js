import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const FacultyManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      loadFaculties();
    } else {
      setFaculties([]);
    }
  }, [selectedInstitution]);

  const loadInstitutions = async () => {
    try {
      const snap = await getDocs(collection(db, 'institutions'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInstitutions(data);
      if (data.length > 0) {
        setSelectedInstitution(data[0].id);
      }
    } catch (error) {
      console.error('Error loading institutions:', error);
      alert('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const loadFaculties = async () => {
    if (!selectedInstitution) return;
    try {
      // Try top-level collection first
      const q = query(collection(db, 'faculties'), where('institutionId', '==', selectedInstitution));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fallback: nested subcollection under institution
      if (data.length === 0) {
        const nestedSnap = await getDocs(collection(db, 'institutions', selectedInstitution, 'faculties'));
        data = nestedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      setFaculties(data);
    } catch (error) {
      console.error('Error loading faculties:', error);
      alert('Failed to load faculties');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInstitution) {
      alert('Please select an institution first');
      return;
    }
    try {
      if (editingFaculty) {
        // Update top-level
        await updateDoc(doc(db, 'faculties', editingFaculty.id), {
          ...formData,
          institutionId: selectedInstitution
        });
        // Best-effort update nested subcollection (ignore if not present)
        try {
          await updateDoc(doc(db, 'institutions', selectedInstitution, 'faculties', editingFaculty.id), {
            ...formData,
            institutionId: selectedInstitution
          });
        } catch {}
        alert('Faculty updated successfully');
      } else {
        // Create in top-level
        const created = await addDoc(collection(db, 'faculties'), {
          ...formData,
          institutionId: selectedInstitution,
          isActive: true,
          createdAt: new Date()
        });
        // Mirror in nested subcollection
        try {
          await setDoc(doc(db, 'institutions', selectedInstitution, 'faculties', created.id), {
            ...formData,
            institutionId: selectedInstitution,
            isActive: true,
            createdAt: new Date()
          });
        } catch {}
        alert('Faculty added successfully');
      }
      setShowModal(false);
      resetForm();
      loadFaculties();
    } catch (error) {
      alert(error.message || 'Operation failed');
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
    if (!window.confirm('Are you sure you want to delete this faculty?')) {
      return;
    }
    try {
      // Delete from top-level
      await deleteDoc(doc(db, 'faculties', facultyId));
      // Best-effort delete from nested
      try {
        await deleteDoc(doc(db, 'institutions', selectedInstitution, 'faculties', facultyId));
      } catch {}
      alert('Faculty deleted successfully');
      loadFaculties();
    } catch (error) {
      alert(error.message || 'Failed to delete faculty');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingFaculty(null);
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Manage Faculties</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!selectedInstitution) {
              alert('Please select an institution first');
              return;
            }
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Faculty
        </button>
      </div>

      <div className="mb-3">
        <label className="form-label">Select Institution</label>
        <select
          className="form-select"
          value={selectedInstitution}
          onChange={(e) => setSelectedInstitution(e.target.value)}
        >
          <option value="">-- Select Institution --</option>
          {institutions.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
      </div>

      {selectedInstitution && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculties.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">No faculties found</td>
                </tr>
              ) : (
                faculties.map((faculty) => (
                  <tr key={faculty.id}>
                    <td>{faculty.name}</td>
                    <td>{faculty.description || 'N/A'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleEdit(faculty)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(faculty.id)}
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
      )}

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
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
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
                    {editingFaculty ? 'Update' : 'Add'} Faculty
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


