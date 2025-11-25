import React, { useState } from 'react';
import { Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { authAPI } from '../services/api';

const StudentRegistration = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    highSchool: '',
    graduationYear: ''
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
      const studentData = {
        email: formData.email,
        password: formData.password,
        userType: 'student',
        profileData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          highSchool: formData.highSchool,
          graduationYear: formData.graduationYear
        }
      };

      const response = await authAPI.register(studentData);
      alert('Registration successful! You can now login.');
      
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
      <h2 className="h3 fw-bold mb-4 text-center text-white">Student Registration</h2>
      
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

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Date of Birth</Form.Label>
              <Form.Control
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
              <Form.Text className="text-muted">dd/mm/yyyy</Form.Text>
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

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">High School</Form.Label>
              <Form.Control
                type="text"
                name="highSchool"
                value={formData.highSchool}
                onChange={handleChange}
                required
                className="form-control-beautiful"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-light">Graduation Year</Form.Label>
              <Form.Control
                type="number"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                required
                min="2000"
                max="2030"
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
                'Register as Student'
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default StudentRegistration;