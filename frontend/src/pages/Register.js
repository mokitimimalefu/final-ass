import React, { useState } from 'react';
import StudentRegistration from '../components/StudentRegistration';
import InstituteRegistration from '../components/InstituteRegistration';
import CompanyRegistration from '../components/CompanyRegistration';
import AdminRegistration from '../components/AdminRegistration';

const Register = () => {
  const [userType, setUserType] = useState('student');

  return (
    <div className="container-fluid min-vh-100 gradient-bg-secondary py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="text-center mb-5 fade-in-up">
              <h1 className="display-4 fw-bold text-white mb-3">Create Account</h1>
              <p className="text-white-50 fs-5">Choose your account type</p>
            </div>

            {/* User Type Selection */}
            <div className="d-flex justify-content-center mb-5">
              <div className="btn-group shadow-lg" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="userType"
                  id="student"
                  autoComplete="off"
                  checked={userType === 'student'}
                  onChange={() => setUserType('student')}
                />
                <label className="btn btn-gradient-primary fw-bold px-4 py-3" htmlFor="student">
                  🎓 Student
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="userType"
                  id="institute"
                  autoComplete="off"
                  checked={userType === 'institute'}
                  onChange={() => setUserType('institute')}
                />
                <label className="btn btn-gradient-secondary fw-bold px-4 py-3" htmlFor="institute">
                  🏫 Institute
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="userType"
                  id="company"
                  autoComplete="off"
                  checked={userType === 'company'}
                  onChange={() => setUserType('company')}
                />
                <label className="btn btn-gradient-success fw-bold px-4 py-3" htmlFor="company">
                  🏢 Company
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="userType"
                  id="admin"
                  autoComplete="off"
                  checked={userType === 'admin'}
                  onChange={() => setUserType('admin')}
                />
                <label className="btn btn-gradient-danger fw-bold px-4 py-3" htmlFor="admin">
                  👤 Admin
                </label>
              </div>
            </div>

            {/* Registration Form Based on User Type */}
            <div className="glass-card card-beautiful">
              <div className="card-body p-5">
                {userType === 'student' && <StudentRegistration />}
                {userType === 'institute' && <InstituteRegistration />}
                {userType === 'company' && <CompanyRegistration />}
                {userType === 'admin' && <AdminRegistration />}
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-white-50">
                Already have an account?{' '}
                <a href="/login" className="text-white text-decoration-none fw-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;