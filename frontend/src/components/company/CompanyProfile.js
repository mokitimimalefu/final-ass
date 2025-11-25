import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const CompanyProfile = ({ onUpdate }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    industry: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!currentUser?.uid) return;
      const companyRef = doc(db, 'companies', currentUser.uid);
      const snap = await getDoc(companyRef);
      if (snap.exists()) {
        const data = snap.data();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          website: data.website || '',
          description: data.description || '',
          industry: data.industry || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!currentUser?.uid) throw new Error('Not authenticated');
      const companyRef = doc(db, 'companies', currentUser.uid);
      const snap = await getDoc(companyRef);
      if (snap.exists()) {
        await updateDoc(companyRef, formData);
      } else {
        await setDoc(companyRef, { ...formData, status: 'approved' });
      }
      alert('Profile updated successfully!');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || 'Failed to update profile';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
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
    <div className="card">
      <div className="card-header">
        <h4 className="mb-0">
          <i className="bi bi-building me-2"></i>
          Company Profile
        </h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Industry</label>
              <input
                type="text"
                className="form-control"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="e.g., Technology, Finance, Healthcare"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              name="address"
              rows="2"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Website</label>
            <input
              type="url"
              className="form-control"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Company Description</label>
            <textarea
              className="form-control"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of your company..."
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Update Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyProfile;

