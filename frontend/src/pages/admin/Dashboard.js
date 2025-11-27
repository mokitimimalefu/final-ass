import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InstitutionManagement from '../../components/admin/InstitutionManagement';
import FacultyManagement from '../../components/admin/FacultyManagement';
import CourseManagement from '../../components/admin/CourseManagement';
import CompanyManagement from '../../components/admin/CompanyManagement';
import AdmissionsManagement from '../../components/admin/AdmissionsManagement';
import SystemReports from '../../components/admin/SystemReports';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated or wrong user type
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Redirect if user is not an admin
    if (currentUser.userType !== 'admin') {
      const dashboardPaths = {
        'student': '/student',
        'institute': '/institute',
        'company': '/company'
      };
      const correctPath = dashboardPaths[currentUser.userType] || '/login';
      navigate(correctPath);
      return;
    }
  }, [currentUser, navigate]);

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'institutions', label: 'Institutions', icon: '🏫' },
    { id: 'faculties', label: 'Faculties', icon: '👨‍🏫' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'companies', label: 'Companies', icon: '🏢' },
    { id: 'admissions', label: 'Admissions', icon: '📝' },
    { id: 'reports', label: 'Reports', icon: '📈' }
  ];

  // Don't render anything if redirecting
  if (!currentUser || currentUser.userType !== 'admin') {
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
            <i className="bi bi-shield-check"></i>
            Admin
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
              <i className="bi bi-shield-check"></i>
              Admin Dashboard
            </h1>
            <p className="text-muted mb-0 mt-2">Manage institutions, companies, admissions, and view system reports.</p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="dashboard-cards-grid">
              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-building"></i>
                </div>
                <h5 className="dashboard-card-title">Institutions</h5>
                <p className="dashboard-card-text">Add and manage higher learning institutions</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('institutions')}
                  >
                    Manage Institutions
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Faculties</h5>
                <p className="dashboard-card-text">Add faculties under institutions</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-success w-100"
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
                <p className="dashboard-card-text">Add courses under faculties</p>
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
                  <i className="bi bi-briefcase-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Companies</h5>
                <p className="dashboard-card-text">Approve, suspend, or delete company accounts</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-warning w-100"
                    onClick={() => setActiveTab('companies')}
                  >
                    Manage Companies
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-file-earmark-text-fill"></i>
                </div>
                <h5 className="dashboard-card-title">Admissions</h5>
                <p className="dashboard-card-text">Publish admissions and monitor registered users</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('admissions')}
                  >
                    Manage Admissions
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <i className="bi bi-graph-up"></i>
                </div>
                <h5 className="dashboard-card-title">System Reports</h5>
                <p className="dashboard-card-text">View and manage system reports</p>
                <div className="dashboard-card-action">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setActiveTab('reports')}
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'institutions' && <InstitutionManagement />}
          {activeTab === 'faculties' && <FacultyManagement />}
          {activeTab === 'courses' && <CourseManagement />}
          {activeTab === 'companies' && <CompanyManagement />}
          {activeTab === 'admissions' && <AdmissionsManagement />}
          {activeTab === 'reports' && <SystemReports />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
