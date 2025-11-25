import React, { useState } from 'react';
import { Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { authAPI } from '../services/api';

const AdminRegistration = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);

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
      const adminData = {
        email: formData.email,
        password: formData.password,
        userType: 'admin',
        profileData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        }
      };

      const response = await authAPI.register(adminData);
      alert(response.data.message || 'Registration successful! Please check your email for verification.');
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form">
      <h2 className="h3 fw-bold mb-4 text-center text-white">Admin Registration</h2>
      
      <Form onSubmit={handleSubmit}>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group>
              <Form.Label className="text-light">Email</Form.Label>
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

          <Col md={12}>
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
                'Register as Admin'
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AdminRegistration;
