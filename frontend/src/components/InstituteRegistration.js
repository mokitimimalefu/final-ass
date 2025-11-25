import React, { useState } from 'react';
import { Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { authAPI } from '../services/api';

const InstituteRegistration = () => {
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
  const [verificationSent, setVerificationSent] = useState(false);

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
      const instituteData = {
        email: formData.email,
        password: formData.password,
        userType: 'institute',
        profileData: {
          name: formData.name,
          location: formData.location,
          contact: {
            email: formData.contactEmail,
            phone: formData.phone,
            address: formData.address
          }
        }
      };

      const response = await authAPI.register(instituteData);
      alert(response.data.message || 'Registration successful! Please check your email for verification.');
      setVerificationSent(true);
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
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
