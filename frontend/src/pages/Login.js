import React, { useState } from 'react';
import { authService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      const { user, userType } = response;

      // Get Firebase ID token from current user
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Authentication failed');
      const idToken = await firebaseUser.getIdToken();

      // Store token in localStorage for API calls
      localStorage.setItem('token', idToken);

      // Update auth context
      login(user);

      // Redirect based on user type
      switch (userType) {
        case 'admin':
          window.location.href = '/admin';
          break;
        case 'institute':
          window.location.href = '/institute';
          break;
        case 'student':
          window.location.href = '/student';
          break;
        case 'company':
          window.location.href = '/company';
          break;
        default:
          window.location.href = '/';
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 gradient-bg-primary d-flex flex-column justify-content-center py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="text-center mb-5 fade-in-up">
            <h2 className="display-4 fw-bold text-white mb-3">Career Guidance Platform</h2>
            <p className="text-white-50 fs-5">Sign in to your account</p>
          </div>

          <div className="glass-card card-beautiful">
            <div className="card-body p-5">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label fw-medium text-white">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control form-control-beautiful"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-medium text-white">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control form-control-beautiful"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-gradient-primary btn-lg fw-bold"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </form>

              <hr className="my-4 opacity-50" />

              <div className="text-center">
                  <p className="text-white-50 mb-0">
                  Don't have an account?{' '}
                  <a href="/register" className="text-white text-decoration-none fw-medium">
                    Sign up
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;