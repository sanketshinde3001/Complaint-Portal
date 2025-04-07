import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Pages
import LandingPage from './pages/LandingPage'; // Import Landing Page
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import CreatePetitionPage from './pages/CreatePetitionPage'; // Import Create Petition page
import PetitionsListPage from './pages/PetitionsListPage';
import PetitionDetailPage from './pages/PetitionDetailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // Import Forgot Password page
import ResetPasswordPage from './pages/ResetPasswordPage';   // Import Reset Password page
import AdminDashboardPage from './pages/AdminDashboardPage';
// TODO: Import AdminPetitionsPage if implementing admin UI
import NotFoundPage from './pages/NotFoundPage';

// Import Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

function App() {
  return (
    <>
      <Navbar /> {/* Display Navbar on all pages */}
      {/* Remove container/padding from main if LandingPage handles its own layout */}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} /> {/* Landing page at root */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> {/* Reset Password Route */}
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}> {/* Routes requiring login */}
            <Route path="/home" element={<HomePage />} /> {/* Main app home */}
            <Route path="/submit-complaint" element={<SubmitComplaintPage />} />
            <Route path="/complaint/:id" element={<ComplaintDetailPage />} />
            <Route path="/petitions" element={<PetitionsListPage />} />
            <Route path="/petitions/new" element={<CreatePetitionPage />} /> {/* Create new petition */}
            <Route path="/petition/:id" element={<PetitionDetailPage />} /> {/* View single petition */}
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
