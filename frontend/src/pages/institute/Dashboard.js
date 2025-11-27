import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import FacultyManagement from '../../components/institute/FacultyManagement';
import CourseManagement from '../../components/institute/CourseManagement';
import ApplicationManagement from '../../components/institute/ApplicationManagement';
import ProfileManagement from '../../components/institute/ProfileManagement';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import FacultyManagement from '../../components/institute/FacultyManagement';
import CourseManagement from '../../components/institute/CourseManagement';
import ApplicationManagement from '../../components/institute/ApplicationManagement';
import ProfileManagement from '../../components/institute/ProfileManagement';

const InstituteDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [instituteData, setInstituteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Redirect if user is not an institute
    if (currentUser.userType !== 'institute') {
      const dashboardPaths = {
        'admin': '/admin',
        'student': '/student',
        'company': '/company'
      };
      const correctPath = dashboardPaths[currentUser.userType] || '/login';
      navigate(correctPath);
      return;
    }
  }, [currentUser, navigate]);

  const loadInstituteData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading institute data for:', currentUser.uid);
      const instRef = doc(db, 'institutions', currentUser.uid);
      const instSnap = await getDoc(instRef);
      if (instSnap.exists()) {
        const data = { id: instSnap.id, ...instSnap.data() };
        console.log('Institute data loaded:', data);
        setInstituteData(data);
      } else {
        setInstituteData(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading institute data:', error);
      console.error('Error details:', error.message);
      setLoading(false);
      setInstituteData(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadInstituteData();
    } else {
      setLoading(false);
    }
  }, [currentUser, loadInstituteData]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'faculties', label: 'Faculties', icon: '👨‍🏫' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'applications', label: 'Applications', icon: '📝' },
    { id: 'profile', label: 'Profile', icon: '⚙️' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      navigate('/login');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading only if we have a current user but data is still loading
  if (loading && currentUser) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if redirecting
  if (!currentUser || currentUser.userType !== 'institute') {
    return null;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Toggle */}
      <button 
        className="dashboard-mobile-toggle"
        onClick={toggleSidebar}
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dashboard-sidebar-header">
          <h2>
            <i className="bi bi-building"></i>
            Institute
          </h2>
        </div>
        <ul className="dashboard-sidebar-nav">
          {tabs.map(tab => (
            <li key={tab.id} className="dashboard-sidebar-nav-item">
              <button
                className={`dashboard-sidebar-nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="dashboard-sidebar-footer">
          <button 
            className="btn btn-outline-danger w-100"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main-content">
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1>
              <i className="bi bi-building"></i>
              Institute Dashboard
            </h1>
            {instituteData && (
              <p className="text-muted mb-0 mt-2">Welcome, {instituteData.name}! Manage your institution's faculties, courses, and student applications.</p>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="dashboard-cards-grid">
              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Faculties</h5>
                <p className="dashboard-card-text">Manage teaching staff</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('faculties')}
                  >
                    Manage Faculties
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-book-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Courses</h5>
                <p className="dashboard-card-text">Add and manage courses</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('courses')}
                  >
                    Manage Courses
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-file-earmark-text-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Applications</h5>
                <p className="dashboard-card-text">Review student applications</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('applications')}
                  >
                    View Applications
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-gear-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Profile</h5>
                <p className="dashboard-card-text">Update institution details</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('profile')}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faculties' && <FacultyManagement instituteId={currentUser?.uid} />}
          {activeTab === 'courses' && <CourseManagement instituteId={currentUser?.uid} />}
          {activeTab === 'applications' && <ApplicationManagement instituteId={currentUser?.uid} />}
          {activeTab === 'profile' && (
            <ProfileManagement
              instituteId={currentUser?.uid}
              instituteData={instituteData}
              onUpdate={loadInstituteData}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default InstituteDashboard;
const InstituteDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [instituteData, setInstituteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadInstituteData();
    } else {
      // If no current user, stop loading
      setLoading(false);
    }
  }, [currentUser]);

  const loadInstituteData = async () => {
    try {
      setLoading(true);
      console.log('Loading institute data for:', currentUser.uid);
      const instRef = doc(db, 'institutions', currentUser.uid);
      const instSnap = await getDoc(instRef);
      if (instSnap.exists()) {
        const data = { id: instSnap.id, ...instSnap.data() };
        console.log('Institute data loaded:', data);
        setInstituteData(data);
      } else {
        setInstituteData(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading institute data:', error);
      console.error('Error details:', error.message);
      // Set loading to false even on error to prevent infinite loading
      setLoading(false);
      // Optionally set a default/empty state
      setInstituteData(null);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'faculties', label: 'Faculties', icon: '👨‍🏫' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'applications', label: 'Applications', icon: '📝' },
    { id: 'profile', label: 'Profile', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Toggle */}
      <button 
        className="dashboard-mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dashboard-sidebar-header">
          <h2>
            <i className="bi bi-building"></i>
            Institute
          </h2>
        </div>
        <ul className="dashboard-sidebar-nav">
          {tabs.map(tab => (
            <li key={tab.id} className="dashboard-sidebar-nav-item">
              <button
                className={`dashboard-sidebar-nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="dashboard-sidebar-footer">
          <button 
            className="btn btn-outline-danger w-100"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main-content">
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1>
              <i className="bi bi-building"></i>
              Institute Dashboard
            </h1>
            {instituteData && (
              <p className="text-muted mb-0 mt-2">Welcome, {instituteData.name}! Manage your institution's faculties, courses, and student applications.</p>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="dashboard-cards-grid">
              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Faculties</h5>
                <p className="dashboard-card-text">Manage teaching staff</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('faculties')}
                  >
                    Manage Faculties
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-book-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Courses</h5>
                <p className="dashboard-card-text">Add and manage courses</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('courses')}
                  >
                    Manage Courses
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-file-earmark-text-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Applications</h5>
                <p className="dashboard-card-text">Review student applications</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('applications')}
                  >
                    View Applications
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-gear-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Profile</h5>
                <p className="dashboard-card-text">Update institution details</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('profile')}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faculties' && <FacultyManagement instituteId={currentUser?.uid} />}
          {activeTab === 'courses' && <CourseManagement instituteId={currentUser?.uid} />}
          {activeTab === 'applications' && <ApplicationManagement instituteId={currentUser?.uid} />}
          {activeTab === 'profile' && (
            <ProfileManagement
              instituteId={currentUser?.uid}
              instituteData={instituteData}
              onUpdate={loadInstituteData}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default InstituteDashboard;
