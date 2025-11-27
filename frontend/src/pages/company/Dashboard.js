import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import JobPosting from '../../components/company/JobPosting';
import JobList from '../../components/company/JobList';
import CompanyProfile from '../../components/company/CompanyProfile';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const CompanyDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated or wrong user type
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Redirect if user is not a company
    if (currentUser.userType !== 'company') {
      const dashboardPaths = {
        'admin': '/admin',
        'student': '/student',
        'institute': '/institute'
      };
      const correctPath = dashboardPaths[currentUser.userType] || '/login';
      navigate(correctPath);
      return;
    }
  }, [currentUser, navigate]);

  const loadCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      if (!currentUser?.uid) return;
      
      const companyRef = doc(db, 'companies', currentUser.uid);
      const snap = await getDoc(companyRef);
      if (snap.exists()) {
        setCompanyData({ id: snap.id, ...snap.data() });
      } else {
        setCompanyData(null);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.uid && currentUser.userType === 'company') {
      loadCompanyData();
    } else {
      setLoading(false);
    }
  }, [currentUser, loadCompanyData]);

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

  const handleJobCreated = () => {
    setActiveTab('my-jobs');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const tabs = [
    { id: 'jobs', label: 'Post Job', icon: '📝' },
    { id: 'my-jobs', label: 'My Jobs', icon: '💼' },
    { id: 'profile', label: 'Profile', icon: '⚙️' }
  ];

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
  if (!currentUser || currentUser.userType !== 'company') {
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
            Company
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
              Company Dashboard
            </h1>
            {companyData && (
              <p className="text-muted mb-0 mt-2">Welcome, {companyData.name}! Post job opportunities and connect with qualified graduates.</p>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'jobs' && <JobPosting onJobCreated={handleJobCreated} />}
          {activeTab === 'my-jobs' && <JobList />}
          {activeTab === 'profile' && <CompanyProfile onUpdate={loadCompanyData} />}
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard;
