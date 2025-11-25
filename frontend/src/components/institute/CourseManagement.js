import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';

const CourseManagement = ({ instituteId }) => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');
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
    loadFaculties();
  }, [instituteId]);

  useEffect(() => {
    if (selectedFaculty) {
      loadCourses();
    }
  }, [selectedFaculty]);

  const loadFaculties = async () => {
    try {
      // Try top-level
      const q = query(collection(db, 'faculties'), where('institutionId', '==', instituteId));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Fallback nested
      if (data.length === 0) {
        const nestedSnap = await getDocs(collection(db, 'institutions', instituteId, 'faculties'));
        data = nestedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      setFaculties(data);
      if (data.length > 0) {
        setSelectedFaculty(data[0].id);
      }
    } catch (error) {
      console.error('Error loading faculties:', error);
      alert('Failed to load faculties');
    }
  };

  const loadCourses = async () => {
    if (!selectedFaculty) return;
    try {
      // Try top-level
      const q = query(collection(db, 'courses'), where('facultyId', '==', selectedFaculty));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Fallback nested
      if (data.length === 0) {
        const nestedSnap = await getDocs(collection(db, 'institutions', instituteId, 'faculties', selectedFaculty, 'courses'));
        data = nestedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          ...formData,
          institutionId: instituteId,
          facultyId: selectedFaculty
        });
        try {
          await updateDoc(doc(db, 'institutions', instituteId, 'faculties', selectedFaculty, 'courses', editingCourse.id), {
            ...formData,
            institutionId: instituteId,
            facultyId: selectedFaculty
          });
        } catch {}
        alert('Course updated successfully');
      } else {
        const created = await addDoc(collection(db, 'courses'), {
          ...formData,
          institutionId: instituteId,
          facultyId: selectedFaculty,
          isActive: true,
          createdAt: new Date()
        });
        try {
          await setDoc(doc(db, 'institutions', instituteId, 'faculties', selectedFaculty, 'courses', created.id), {
            ...formData,
            institutionId: instituteId,
            facultyId: selectedFaculty,
            isActive: true,
            createdAt: new Date()
          });
        } catch {}
        alert('Course added successfully');
      }
      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
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
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        try {
          await deleteDoc(doc(db, 'institutions', instituteId, 'faculties', selectedFaculty, 'courses', courseId));
        } catch {}
        alert('Course deleted successfully');
        loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course');
      }
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
  };

  const openAddModal = () => {
    setEditingCourse(null);
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
        <h3>Course Management</h3>
        <button className="btn btn-success" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Course
        </button>
      </div>

      {/* Faculty Selector */}
      {faculties.length > 0 && (
        <div className="mb-4">
          <label className="form-label">Select Faculty</label>
          <select
            className="form-select"
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
          >
            {faculties.map(faculty => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-book-fill text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No courses added yet</h5>
          <p className="text-muted">Click "Add Course" to get started</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Duration</th>
                <th>Fees</th>
                <th>Department</th>
                <th>Level</th>
                <th>Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>{course.name}</td>
                  <td>{course.code}</td>
                  <td>{course.duration}</td>
                  <td>${course.fees}</td>
                  <td>{course.department}</td>
                  <td>{course.level}</td>
                  <td>{course.seats}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <button
                        className="btn btn-outline-success btn-sm"
                        onClick={() => handleEdit(course)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(course.id)}
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
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCourse ? 'Edit Course' : 'Add Course'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Course Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Course Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Duration *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., 4 years"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fees *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 50000"
                        value={formData.fees}
                        onChange={(e) => setFormData({...formData, fees: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Level *</label>
                      <select
                        className="form-select"
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        required
                      >
                        <option value="undergraduate">Undergraduate</option>
                        <option value="postgraduate">Postgraduate</option>
                        <option value="diploma">Diploma</option>
                        <option value="certificate">Certificate</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Available Seats *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.seats}
                        onChange={(e) => setFormData({...formData, seats: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Requirements</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., 12th pass, entrance exam"
                        value={formData.requirements}
                        onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    {editingCourse ? 'Update Course' : 'Add Course'}
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
