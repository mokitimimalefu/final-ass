// pages/Home.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import gradImage from './grad.jpg';

const Home = () => {
  const [institutions, setInstitutions] = useState([]);
  const [stats, setStats] = useState({ institutions: 0, courses: 0, companies: 0, users: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHomeData();
    return () => {
      // Cleanup function
    };
  }, []);

  const fetchHomeData = async () => {
    try {
      setError('');

      // Add a small delay to ensure Firestore is properly initialized
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch all active institutions from Firebase
      const institutionsQuery = query(collection(db, 'institutions'), where('isactive', '==', true));
      const institutionsSnapshot = await getDocs(institutionsQuery);
      const institutionsData = institutionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstitutions(institutionsData);

      // Fetch statistics sequentially to avoid overwhelming Firestore
      let institutionsCount = 0;
      let coursesCount = 0;
      let companiesCount = 0;
      let usersCount = 0;

      try {
        const instSnapshot = await getDocs(collection(db, 'institutions'));
        institutionsCount = instSnapshot.size;
      } catch (err) {
        console.warn('Error fetching institutions count:', err);
      }

      try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        coursesCount = coursesSnapshot.size;
      } catch (err) {
        console.warn('Error fetching courses count:', err);
      }

      try {
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        companiesCount = companiesSnapshot.size;
      } catch (err) {
        console.warn('Error fetching companies count:', err);
      }

      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        usersCount = usersSnapshot.size;
      } catch (err) {
        console.warn('Error fetching users count:', err);
      }

      setStats({
        institutions: institutionsCount,
        courses: coursesCount,
        companies: companiesCount,
        users: usersCount
      });

    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('Failed to load data. Please try again later.');
      // Set fallback data
      setInstitutions([]);
      setStats({ institutions: 0, courses: 0, companies: 0, users: 0 });
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${gradImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.42)',
            zIndex: 1
          }}
        ></div>
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="align-items-center min-vh-100">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4 text-white">
                Your Pathway to Education and Career Success in Lesotho
              </h1>
              <p className="lead mb-4 text-white">
                Discover higher learning institutions, explore courses, and find employment opportunities 
                all in one platform designed for Basotho students and graduates.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/student/dashboard" className="btn btn-light btn-lg px-4">
                  Explore Institutions
                </Link>
                <Link to="/company/dashboard" className="btn btn-outline-light btn-lg px-4">
                  Find Jobs
                </Link>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="bg-light rounded p-4 shadow">
                <h5 className="text-primary">Join Our Platform</h5>
                <p className="text-muted">Select your role to get started</p>
                <div className="d-grid gap-2">
                  <Link to="/register?role=student" className="btn btn-primary">
                    I'm a Student
                  </Link>
                  <Link to="/register?role=institute" className="btn btn-outline-primary">
                    I'm an Institution
                  </Link>
                  <Link to="/register?role=company" className="btn btn-outline-primary">
                    I'm an Employer
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Search Section */}
      <SearchSection />

      {error && (
        <Container className="my-4">
          <Alert variant="danger">{error}</Alert>
        </Container>
      )}

      {/* Statistics Section */}
      <StatisticsSection stats={stats} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Institutions Section */}
      <InstitutionsSection institutions={institutions} />
    </div>
  );
};

// Search Section Component
const SearchSection = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('institutions');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Anywhere in Lesotho');
  const [type, setType] = useState(searchType === 'institutions' ? 'All Institutions' : 'All Job Types');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchType === 'institutions') {
      // Navigate to institutions page with search parameters
      navigate(`/student/dashboard?tab=institutions&search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}&type=${encodeURIComponent(type)}`);
    } else {
      // Navigate to jobs page with search parameters
      navigate(`/student/dashboard?tab=jobs&search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}&type=${encodeURIComponent(type)}`);
    }
  };

  return (
    <section className="search-section">
      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="d-flex mb-3">
                <Button
                  variant={searchType === 'institutions' ? 'primary' : 'outline-primary'}
                  className="me-2"
                  onClick={() => {
                    setSearchType('institutions');
                    setType('All Institutions');
                  }}
                >
                  Find Institutions
                </Button>
                <Button
                  variant={searchType === 'jobs' ? 'primary' : 'outline-primary'}
                  onClick={() => {
                    setSearchType('jobs');
                    setType('All Job Types');
                  }}
                >
                  Find Jobs
                </Button>
              </div>

              <Form onSubmit={handleSearch}>
                <Row className="g-2">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        {searchType === 'institutions' ? 'Institution or Course' : 'Job title, keywords...'}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={searchType === 'institutions' ? 'Search institutions or courses...' : 'Job title, keywords...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Location</Form.Label>
                      <Form.Select value={location} onChange={(e) => setLocation(e.target.value)}>
                        <option>Anywhere in Lesotho</option>
                        <option>Maseru</option>
                        <option>Leribe</option>
                        <option>Berea</option>
                        <option>Mafeteng</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Type</Form.Label>
                      <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                        {searchType === 'institutions' ? (
                          <>
                            <option>All Institutions</option>
                            <option>University</option>
                            <option>College</option>
                            <option>Technical School</option>
                          </>
                        ) : (
                          <>
                            <option>All Job Types</option>
                            <option>Full Time</option>
                            <option>Part Time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                          </>
                        )}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button variant="primary" className="w-100" type="submit">
                      Search
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

// Statistics Section Component
const StatisticsSection = ({ stats }) => {
  return (
    <section className="statistics-section">
      <Container>
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold mb-3">Platform Impact</h2>
            <p className="lead text-muted">
              Connecting students with educational opportunities and graduates with employment
            </p>
          </Col>
        </Row>
        <Row>
          <Col md={3} className="mb-4">
            <div className="stat-card bg-primary text-white">
              <h3 className="display-4 fw-bold">{stats.institutions}</h3>
              <p className="fs-5">Higher Learning Institutions</p>
            </div>
          </Col>
          <Col md={3} className="mb-4">
            <div className="stat-card bg-secondary text-white">
              <h3 className="display-4 fw-bold">{stats.courses}</h3>
              <p className="fs-5">Courses Available</p>
            </div>
          </Col>
          <Col md={3} className="mb-4">
            <div className="stat-card bg-success text-white">
              <h3 className="display-4 fw-bold">{stats.companies}</h3>
              <p className="fs-5">Partner Companies</p>
            </div>
          </Col>
          <Col md={3} className="mb-4">
            <div className="stat-card bg-warning text-dark">
              <h3 className="display-4 fw-bold">{stats.users}</h3>
              <p className="fs-5">Registered Users</p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Find Institutions",
      description: "Discover higher learning institutions across Lesotho and the courses they offer.",
      icon: "🏫",
      action: () => navigate('/student/dashboard?tab=institutions')
    },
    {
      title: "Apply Online",
      description: "Submit applications directly to institutions through our platform.",
      icon: "📝",
      action: () => navigate('/student/dashboard?tab=applications')
    },
    {
      title: "Career Guidance",
      description: "Get personalized recommendations based on your interests and skills.",
      icon: "🎯",
      action: () => navigate('/student/dashboard?tab=profile')
    },
    {
      title: "Upload Transcripts",
      description: "Graduates can securely upload academic records for employment applications.",
      icon: "📄",
      action: () => navigate('/student/dashboard?tab=documents')
    },
    {
      title: "Job Matching",
      description: "Connect with employers looking for your specific qualifications.",
      icon: "🤝",
      action: () => navigate('/student/dashboard?tab=jobs')
    },
    {
      title: "Career Resources",
      description: "Access articles, tips, and resources for career development.",
      icon: "📚",
      action: () => navigate('/student/dashboard?tab=resources')
    }
  ];

  return (
    <section className="features-section">
      <Container>
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold mb-3">How Our Platform Works</h2>
            <p className="lead text-muted">
              A comprehensive solution for students and graduates in Lesotho
            </p>
          </Col>
        </Row>
        <Row>
          {features.map((feature, index) => (
            <Col lg={4} md={6} className="mb-4" key={index}>
              <Card className="feature-card shadow-sm h-100" onClick={feature.action} style={{ cursor: 'pointer' }}>
                <Card.Body className="text-center p-4">
                  <div className="display-1 mb-3">{feature.icon}</div>
                  <Card.Title className="h4">{feature.title}</Card.Title>
                  <Card.Text className="text-muted">
                    {feature.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

// Institutions Section Component
const InstitutionsSection = ({ institutions }) => {
  return (
    <section className="institutions-section">
      <Container>
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold mb-3">Browse Institutions</h2>
            <p className="lead text-muted">
              Explore all active higher learning institutions in Lesotho
            </p>
          </Col>
        </Row>
        <Row>
          {institutions.length > 0 ? (
            institutions.map((institution) => (
              <Col lg={4} md={4} sm={4} className="mb-4" key={institution.id}>
                <Card className="institution-card shadow-sm h-100">
                  <Card.Img
                    variant="top"
                    src={institution.logo || institution.image || '/api/placeholder/300/200'}
                    alt={institution.name}
                    style={{ height: '250px', objectFit: 'cover' }}
                  />
                  <Card.Body>
                    <Card.Title>{institution.name}</Card.Title>
                    <Card.Text className="text-muted">
                      <small>{institution.location} • {institution.type}</small>
                    </Card.Text>
                    <Card.Text>
                      <strong>{institution.coursesCount || 0}+ Courses</strong>
                    </Card.Text>
                    <Button 
                      as={Link} 
                      to={`/institutions/${institution.id}`}
                      variant="primary" 
                      className="w-100"
                    >
                      View Details
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col className="text-center">
              <p className="text-muted">No institutions found.</p>
            </Col>
          )}
        </Row>
        <Row className="mt-4 text-center">
          <Col>
            <Button as={Link} to="/institutions" variant="outline-primary" size="lg">
              View All Institutions
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Home;