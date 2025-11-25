import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';

const CourseManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    duration: '',
    fees: '',
    department: '',
    level: 'undergraduate',
    seats: '',
    requirements: ''
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      loadFaculties();
    } else {
      setFaculties([]);
      setSelectedFaculty('');
      setCourses([]);
    }
  }, [selectedInstitution]);

  useEffect(() => {
    if (selectedInstitution && selectedFaculty) {
      loadCourses();
    } else {
      setCourses([]);
    }
  }, [selectedInstitution, selectedFaculty]);

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
      // Try top-level first
      const q = query(collection(db, 'faculties'), where('institutionId', '==', selectedInstitution));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fallback to nested subcollection
      if (data.length === 0) {
        const nestedSnap = await getDocs(collection(db, 'institutions', selectedInstitution, 'faculties'));
        data = nestedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      setFaculties(data);
      if (data.length > 0) {
        setSelectedFaculty(data[0].id);
      } else {
        setSelectedFaculty('');
      }
    } catch (error) {
      console.error('Error loading faculties:', error);
      alert('Failed to load faculties');
    }
  };

  const loadCourses = async () => {
    if (!selectedInstitution || !selectedFaculty) return;
    try {
      // Try top-level first
      const q = query(collection(db, 'courses'), where('facultyId', '==', selectedFaculty));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fallback to nested under institution/faculty
      if (data.length === 0) {
        const nestedSnap = await getDocs(collection(db, 'institutions', selectedInstitution, 'faculties', selectedFaculty, 'courses'));
        data = nestedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Failed to load courses');
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
    if (!selectedInstitution || !selectedFaculty) {
      alert('Please select an institution and faculty first');
      return;
    }
    try {
      if (editingCourse) {
        // Update top-level
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          ...formData,
          institutionId: selectedInstitution,
          facultyId: selectedFaculty
        });
        // Best-effort update nested
        try {
          await updateDoc(doc(db, 'institutions', selectedInstitution, 'faculties', selectedFaculty, 'courses', editingCourse.id), {
            ...formData,
            institutionId: selectedInstitution,
            facultyId: selectedFaculty
          });
        } catch {}
        alert('Course updated successfully');
      } else {
        // Create in top-level
        const created = await addDoc(collection(db, 'courses'), {
          ...formData,
          institutionId: selectedInstitution,
          facultyId: selectedFaculty,
          isActive: true,
          createdAt: new Date()
        });
        // Mirror in nested collection
        try {
          await setDoc(doc(db, 'institutions', selectedInstitution, 'faculties', selectedFaculty, 'courses', created.id), {
            ...formData,
            institutionId: selectedInstitution,
            facultyId: selectedFaculty,
            isActive: true,
            createdAt: new Date()
          });
        } catch {}
        alert('Course added successfully');
      }
      setShowModal(false);
      resetForm();
      loadCourses();
    } catch (error) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      duration: course.duration || '',
      fees: course.fees || '',
      department: course.department || '',
      level: course.level || 'undergraduate',
      seats: course.seats || '',
      requirements: course.requirements || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }
    try {
      // Delete from top-level
      await deleteDoc(doc(db, 'courses', courseId));
      // Best-effort delete nested
      try {
        await deleteDoc(doc(db, 'institutions', selectedInstitution, 'faculties', selectedFaculty, 'courses', courseId));
      } catch {}
      alert('Course deleted successfully');
      loadCourses();
    } catch (error) {
      alert(error.message || 'Failed to delete course');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      duration: '',
      fees: '',
      department: '',
      level: 'undergraduate',
      seats: '',
      requirements: ''
    });
    setEditingCourse(null);
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Manage Courses</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!selectedInstitution || !selectedFaculty) {
              alert('Please select an institution and faculty first');
              return;
            }
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Course
        </button>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
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
        <div className="col-md-6">
          <label className="form-label">Select Faculty</label>
          <select
            className="form-select"
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            disabled={!selectedInstitution}
          >
            <option value="">-- Select Faculty --</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedInstitution && selectedFaculty && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Duration</th>
                <th>Level</th>
                <th>Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No courses found</td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.name}</td>
                    <td>{course.code || 'N/A'}</td>
                    <td>{course.duration || 'N/A'}</td>
                    <td>{course.level || 'N/A'}</td>
                    <td>{course.seats || 'N/A'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleEdit(course)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(course.id)}
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
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCourse ? 'Edit Course' : 'Add Course'}
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
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Course Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Course Code</label>
                      <input
                        type="text"
                        className="form-control"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                      />
                    </div>
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
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="e.g., 4 years"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Fees</label>
                      <input
                        type="text"
                        className="form-control"
                        name="fees"
                        value={formData.fees}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Level</label>
                      <select
                        className="form-select"
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                      >
                        <option value="undergraduate">Undergraduate</option>
                        <option value="graduate">Graduate</option>
                        <option value="postgraduate">Postgraduate</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Available Seats</label>
                      <input
                        type="number"
                        className="form-control"
                        name="seats"
                        value={formData.seats}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Requirements</label>
                    <textarea
                      className="form-control"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows="2"
                      placeholder="e.g., Minimum grade C, Mathematics required"
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
                    {editingCourse ? 'Update' : 'Add'} Course
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

export default CourseManagement;


