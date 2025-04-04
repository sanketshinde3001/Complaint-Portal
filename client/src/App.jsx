import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Pages (placeholders for now)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Import Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

function App() {
  return (
    <>
      <Navbar /> {/* Display Navbar on all pages */}
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}> {/* Routes requiring login */}
            <Route path="/submit-complaint" element={<SubmitComplaintPage />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly={true} />}> {/* Routes requiring admin role */}
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>

          {/* Catch-all for 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
