import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const ProfileManagement = ({ instituteId, instituteData, onUpdate }) => {
  const [loading, setLoading] = useState(false);
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
    established: '',
    accreditation: ''
  });

  useEffect(() => {
    if (instituteData) {
      setFormData({
        name: instituteData.name || '',
        location: instituteData.location || '',
        contact: {
          email: instituteData.contact?.email || '',
          phone: instituteData.contact?.phone || '',
          address: instituteData.contact?.address || ''
        },
        description: instituteData.description || '',
        website: instituteData.website || '',
        established: instituteData.established || '',
        accreditation: instituteData.accreditation || ''
      });
    }
  }, [instituteData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const instituteRef = doc(db, 'institutions', instituteId);
      await updateDoc(instituteRef, {
        ...formData,
        updatedAt: new Date()
      });
      alert('Profile updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  return (
    <div>
      <h3>Institution Profile</h3>
      <p className="text-muted mb-4">Update your institution's information and contact details</p>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Basic Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Institution Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://www.example.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Established Year</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g., 1995"
                    value={formData.established}
                    onChange={(e) => handleInputChange('established', e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Accreditation</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., UGC, AICTE"
                    value={formData.accreditation}
                    onChange={(e) => handleInputChange('accreditation', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Contact Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.contact.email}
                    onChange={(e) => handleInputChange('contact.email', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.contact.phone}
                    onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Address *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.contact.address}
                    onChange={(e) => handleInputChange('contact.address', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Description</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Institution Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Describe your institution, its mission, vision, and unique features..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Update Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileManagement;
