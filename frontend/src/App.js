// App.js - Updated
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import InstituteDashboard from './pages/institute/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import CompanyDashboard from './pages/company/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/institute/*" element={<InstituteDashboard />} />
            <Route path="/student/*" element={<StudentDashboard />} />
            <Route path="/company/*" element={<CompanyDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;