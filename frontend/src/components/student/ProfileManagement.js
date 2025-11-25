import React, { useState } from 'react';

const ProfileManagement = ({ profile, updateProfile, loading }) => {
  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    idNumber: profile.idNumber || '',
    dateOfBirth: profile.dateOfBirth || '',
    nationality: profile.nationality || '',
    address: profile.address || '',
    educationLevel: profile.educationLevel || '',
    skills: profile.skills?.join(', ') || '',
    completedStudies: profile.completedStudies || false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const profileData = {
      ...formData,
      skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
    };
    updateProfile(profileData);
  };

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">My Profile</h4>
              <small>Update your personal information and academic details</small>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">ID Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Nationality</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Education Level</label>
                    <select
                      className="form-select"
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                    >
                      <option value="">Select Education Level</option>
                      <option value="high_school">High School</option>
                      <option value="diploma">Diploma</option>
                      <option value="bachelors">Bachelor's Degree</option>
                      <option value="masters">Master's Degree</option>
                      <option value="phd">PhD</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Skills (comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g., JavaScript, React, Node.js, Python"
                  />
                </div>
                
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="completedStudies"
                      checked={formData.completedStudies}
                      onChange={handleChange}
                      id="completedStudies"
                    />
                    <label className="form-check-label" htmlFor="completedStudies">
                      I have completed my studies
                    </label>
                  </div>
                  <small className="text-muted">
                    Check this box when you have completed your studies and are ready to apply for jobs.
                  </small>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;