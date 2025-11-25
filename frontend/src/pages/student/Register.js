import React, { useState } from 'react';
import StudentRegistration from '../components/StudentRegistration';
import InstituteRegistration from '../components/InstituteRegistration';
import CompanyRegistration from '../components/CompanyRegistration';

const Register = () => {
  const [userType, setUserType] = useState('student');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-gray-600">Choose your account type</p>
        </div>

        {/* User Type Selection */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                userType === 'student'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setUserType('institute')}
              className={`px-4 py-2 text-sm font-medium ${
                userType === 'institute'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Institute
            </button>
            <button
              type="button"
              onClick={() => setUserType('company')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                userType === 'company'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Company
            </button>
          </div>
        </div>

        {/* Registration Form Based on User Type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {userType === 'student' && <StudentRegistration />}
          {userType === 'institute' && <InstituteRegistration />}
          {userType === 'company' && <CompanyRegistration />}
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:text-blue-600 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;