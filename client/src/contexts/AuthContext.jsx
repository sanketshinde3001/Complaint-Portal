import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Assuming api.js is set up for Axios

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Removed token state
  const [isLoading, setIsLoading] = useState(true); // Still useful for initial check

  // Check authentication status on initial load by calling a 'me' endpoint
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Assume you have an endpoint that returns user data if cookie is valid
        // Or returns 401 if not authenticated
        const response = await api.get('/auth/me'); // Example endpoint
        if (response.data.status === 'success') {
          setUser(response.data.data.user);
        } else {
           setUser(null); // Ensure user is null if 'me' endpoint fails non-exceptionally
        }
      } catch (error) {
        // If the request fails (e.g., 401 Unauthorized), user is not logged in
        console.log("Not authenticated on initial load or error fetching user:", error.response?.data?.message || error.message);
        setUser(null);
      } finally {
        setIsLoading(false); // Finished checking auth status
      }
    };
    checkAuthStatus();
  }, []);

  // Login function now only sets user state (cookie is handled by backend)
  const login = (userData) => {
    setUser(userData);
    // No need to handle token here
  };

  // Logout function clears user state and calls backend logout endpoint
  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Call backend to clear cookie
    } catch (error) {
        console.error("Logout API call failed:", error.response?.data?.message || error.message);
        // Still clear frontend state even if backend call fails
    } finally {
        setUser(null);
        // Optionally redirect to login page via useNavigate() in component
    }
  };

  const value = {
    user,
    // Removed token from context value
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
