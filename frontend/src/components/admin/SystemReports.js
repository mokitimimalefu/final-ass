import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const SystemReports = () => {
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('statistics');

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'admissions') {
      loadAdmissions();
    }
  }, [activeTab]);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      // Fetch statistics directly from Firebase
      const [institutionsSnap, coursesSnap, companiesSnap, usersSnap, applicationsSnap] = await Promise.all([
        getDocs(collection(db, 'institutions')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'companies')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'applications'))
      ]);

      // Calculate statistics
      const totalInstitutions = institutionsSnap.size;
      const totalCourses = coursesSnap.size;
      const totalCompanies = companiesSnap.size;
      const totalUsers = usersSnap.size;
      const totalApplications = applicationsSnap.size;

      // Count applications by status
      let pendingApplications = 0;
      let admittedApplications = 0;
      applicationsSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'pending') pendingApplications++;
        if (data.status === 'admitted') admittedApplications++;
      });

      // Count users by type
      let students = 0;
      let institutes = 0;
      let companies = 0;
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.userType === 'student') students++;
        if (data.userType === 'institute') institutes++;
        if (data.userType === 'company') companies++;
      });

      setStatistics({
        totalStudents: students,
        totalInstitutions: institutes,
        totalCompanies: companies,
        totalJobs: totalCourses, // Using courses as proxy for jobs
        totalApplications,
        pendingApplications,
        admittedApplications,
        totalCourses
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadAdmissions = async () => {
    try {
      const applicationsSnap = await getDocs(collection(db, 'applications'));
      const admissionsData = applicationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmissions(admissionsData);
    } catch (error) {
      console.error('Error loading admissions:', error);
      setAdmissions([]);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading reports...</div>;
  }

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">System Reports</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Registered Users
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'admissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('admissions')}
          >
            Admissions Report
          </button>
        </li>
      </ul>

      {activeTab === 'statistics' && statistics && (
        <div>
          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Students</h5>
                  <h2 className="text-primary">{statistics.totalStudents || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Institutions</h5>
                  <h2 className="text-success">{statistics.totalInstitutions || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Companies</h5>
                  <h2 className="text-info">{statistics.totalCompanies || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Courses</h5>
                  <h2 className="text-warning">{statistics.totalCourses || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Applications</h5>
                  <h2 className="text-secondary">{statistics.totalApplications || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Pending Applications</h5>
                  <h2 className="text-warning">{statistics.pendingApplications || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Admitted Applications</h5>
                  <h2 className="text-success">{statistics.admittedApplications || 0}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Email</th>
                <th>User Type</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <span className="badge bg-info">
                        {user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.createdAt && user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'admissions' && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student Email</th>
                <th>Institution</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No admissions found</td>
                </tr>
              ) : (
                admissions.map((admission) => (
                  <tr key={admission.id}>
                    <td>{admission.studentName || 'Unknown'}</td>
                    <td>{admission.studentEmail || 'Unknown'}</td>
                    <td>{admission.instituteName || 'Unknown'}</td>
                    <td>
                      <span className="badge bg-success">
                        {admission.status ? admission.status.charAt(0).toUpperCase() + admission.status.slice(1) : 'Admitted'}
                      </span>
                    </td>
                    <td>
                      {admission.appliedDate && admission.appliedDate.seconds ? new Date(admission.appliedDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SystemReports;
