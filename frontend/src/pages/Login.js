import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate(); // Add this line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      const userType = userData.userType;

      // Store user info in localStorage
      localStorage.setItem('userType', userType);
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('email', email);

      // Update auth context
      login({ 
        uid: user.uid, 
        email: email, 
        userType: userType 
      });

      // Redirect based on user type using navigate
      const dashboardPaths = {
        'admin': '/admin',
        'institute': '/institute',
        'student': '/student',
        'company': '/company'
      };

      const redirectPath = dashboardPaths[userType] || '/';
      navigate(redirectPath, { replace: true });

    } catch (error) {
      console.error('Login error:', error);
      
      // More specific error messages
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message === 'User data not found') {
        errorMessage = 'User account not properly set up. Please contact support.';
      }
      
      setError(errorMessage);
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
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
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
                    placeholder="Enter your email"
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
                    placeholder="Enter your password"
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
                  <Link to="/register" className="text-white text-decoration-none fw-medium">
                    Sign up
                  </Link>
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
