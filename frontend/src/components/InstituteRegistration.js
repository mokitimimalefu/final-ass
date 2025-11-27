import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const InstituteRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    location: '',
    contactEmail: '',
    phone: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        userType: 'institute',
        profileData: {
          name: formData.name,
          location: formData.location,
          contact: {
            email: formData.contactEmail,
            phone: formData.phone,
            address: formData.address
          }
        },
        createdAt: new Date(),
        isActive: true
      });

      // Store institute-specific data
      await setDoc(doc(db, 'institutions', user.uid), {
        name: formData.name,
        location: formData.location,
        contact: {
          email: formData.contactEmail,
          phone: formData.phone,
          address: formData.address
        },
        isActive: true,
        createdAt: new Date(),
        isEmailVerified: false
      });

      alert('Registration successful! Please check your email for verification.');
      setVerificationSent(true);
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form">
      <h2 className="h3 fw-bold mb-4 text-center text-white">Institute Registration</h2>
      
      <Form onSubmit={handleSubmit}>
        <Row className="g-3">
          <Col md={12}>
            <Form.Group>
              <Form.Label className="text-light">Institute Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Location</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Admin Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Contact Email</Form.Label>
              <Form.Control
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Phone</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group>
              <Form.Label className="text-light">Address</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          {error && (
            <Col md={12}>
              <div className="alert alert-danger mt-3">
                {error}
              </div>
            </Col>
          )}

          <Col md={12}>
            <Button
              type="submit"
              disabled={loading}
              className="btn-cta w-100 mt-3"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Registering...
                </>
              ) : (
                'Register Institute'
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default InstituteRegistration;
