import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Assuming api.js is set up for Axios

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true); // Start loading until we verify token

  useEffect(() => {
    // Verify token on initial load
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Optional: Add an endpoint like /auth/me to verify token and get user data
          // For now, we assume the token is valid if it exists.
          // A better approach is to decode the token client-side or verify with backend.
          // Let's decode for basic info (requires jwt-decode library: npm install jwt-decode)
          // import { jwtDecode } from 'jwt-decode'; // Install if using this approach
          // const decodedUser = jwtDecode(storedToken);
          // setUser(decodedUser); // Or fetch user data from backend

          // Placeholder: Assume token means logged in, but no user data yet.
          // A dedicated /auth/me endpoint is recommended for robustness.
          setUser({ placeholder: true }); // Indicate logged-in status
        } catch (error) {
          console.error("Token verification failed", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    verifyUser();
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // Optionally redirect to login page
  };

  const value = {
    user,
    token,
    isLoggedIn: !!user, // Simple check if user object exists
    isAdmin: user?.role === 'admin', // Check role if user object has it
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
