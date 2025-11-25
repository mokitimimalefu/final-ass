import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const JobPosting = ({ onJobCreated }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salaryRange: '',
    requirements: [],
    qualifications: {
      minimumGrade: '',
      requiredSubjects: [],
      workExperience: false
    }
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('qualifications.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        qualifications: {
          ...prev.qualifications,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddSubject = () => {
    if (newSubject.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: {
          ...prev.qualifications,
          requiredSubjects: [...prev.qualifications.requiredSubjects, newSubject.trim()]
        }
      }));
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: {
        ...prev.qualifications,
        requiredSubjects: prev.qualifications.requiredSubjects.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up empty fields
      const jobData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        salaryRange: formData.salaryRange,
        requirements: formData.requirements,
        qualifications: {
          ...(formData.qualifications.minimumGrade && { minimumGrade: formData.qualifications.minimumGrade }),
          ...(formData.qualifications.requiredSubjects.length > 0 && { requiredSubjects: formData.qualifications.requiredSubjects }),
          ...(formData.qualifications.workExperience && { workExperience: true })
        },
        companyId: currentUser?.uid || '',
        companyName: currentUser?.email || '',
        isActive: true,
        status: 'open',
        postedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'jobs'), jobData);
      alert('Job posted successfully! Qualified students will be notified.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        salaryRange: '',
        requirements: [],
        qualifications: {
          minimumGrade: '',
          requiredSubjects: [],
          workExperience: false
        }
      });

      if (onJobCreated) {
        onJobCreated();
      }
    } catch (error) {
      console.error('Error posting job:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to post job';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="mb-0">
          <i className="bi bi-briefcase-fill me-2"></i>
          Post New Job Opportunity
        </h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Job Title *</label>
            <input
              type="text"
              className="form-control"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Job Description *</label>
            <textarea
              className="form-control"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Maseru, Lesotho"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Salary Range</label>
              <input
                type="text"
                className="form-control"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleInputChange}
                placeholder="e.g., M8,000 - M12,000"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Requirements</label>
            <div className="input-group mb-2">
              <input
                type="text"
                className="form-control"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Add a requirement"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleAddRequirement}
              >
                <i className="bi bi-plus"></i> Add
              </button>
            </div>
            {formData.requirements.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {formData.requirements.map((req, index) => (
                  <span key={index} className="badge bg-primary d-flex align-items-center gap-2">
                    {req}
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      style={{ fontSize: '0.7rem' }}
                      onClick={() => handleRemoveRequirement(index)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Qualifications & Requirements</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Minimum Grade (Optional)</label>
                <input
                  type="number"
                  className="form-control"
                  name="qualifications.minimumGrade"
                  value={formData.qualifications.minimumGrade}
                  onChange={handleInputChange}
                  placeholder="e.g., 3.0"
                  step="0.1"
                  min="0"
                  max="5"
                />
                <small className="text-muted">Leave empty if no minimum grade required</small>
              </div>

              <div className="mb-3">
                <label className="form-label">Required Subjects</label>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g., Mathematics, English"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleAddSubject}
                  >
                    <i className="bi bi-plus"></i> Add
                  </button>
                </div>
                {formData.qualifications.requiredSubjects.length > 0 && (
                  <div className="d-flex flex-wrap gap-2">
                    {formData.qualifications.requiredSubjects.map((subject, index) => (
                      <span key={index} className="badge bg-secondary d-flex align-items-center gap-2">
                        {subject}
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          style={{ fontSize: '0.7rem' }}
                          onClick={() => handleRemoveSubject(index)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="workExperience"
                  checked={formData.qualifications.workExperience}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      qualifications: {
                        ...prev.qualifications,
                        workExperience: e.target.checked
                      }
                    }));
                  }}
                />
                <label className="form-check-label" htmlFor="workExperience">
                  Work Experience Required
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Posting...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Post Job
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobPosting;

