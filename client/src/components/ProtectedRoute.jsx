import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component to protect routes that require login
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    // Show a loading indicator while checking auth status
    // You might want a more sophisticated loading spinner here
    return <div className="text-center p-10">Loading...</div>;
  }

  if (!isLoggedIn) {
    // Redirect to login page if not logged in
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect to home or a 'not authorized' page if admin access is required but user is not admin
    // For simplicity, redirecting to home here
    console.warn("Access denied: Admin privileges required.");
    return <Navigate to="/" replace />;
  }

  // If logged in (and has admin role if required), render the child component/route
  // Outlet is used if this component wraps nested routes, otherwise use children
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
