import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (userData) => {
    setCurrentUser(userData);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      setCurrentUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      // Clear token and user even if signOut fails
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          // Additional user data will be fetched from Firestore when needed
        });
        // Ensure we have a fresh ID token stored for API requests
        user.getIdToken().then((idToken) => {
          try {
            localStorage.setItem('token', idToken);
          } catch {}
        }).catch(() => {});
      } else {
        // User is signed out
        try {
          localStorage.removeItem('token');
        } catch {}
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
