import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Import the API service

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying...');
  const [error, setError] = useState(null);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const verifyToken = async () => {
      if (!token) {
        setStatus('Invalid verification link.');
        return;
      }
      try {
        // Make API call to backend
        await api.get(`/auth/verify-email/${token}`);
        setStatus('Email verified successfully! Redirecting to login...');
        // No need to store token here, user will log in separately
        if (isMounted) {
          setTimeout(() => navigate('/login'), 3000); // Redirect after 3 seconds
        }
      } catch (err) {
        console.error("Verification failed:", err);
        const errorMessage = err.response?.data?.message || 'Verification failed. The link may be invalid or expired.';
        if (isMounted) {
          setError(errorMessage);
          setStatus('Verification Failed');
          // Check if the error message indicates an invalid/expired token
          if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired')) {
            setShowResend(true);
          }
        }
      }
    };

    verifyToken();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [token, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || isResending) return;

    setIsResending(true);
    setResendStatus('Sending...');
    setResendError('');

    try {
      const response = await api.post('/auth/resend-verification', { email: resendEmail });
      setResendStatus(response.data.message || 'New verification link sent!');
      setResendEmail(''); // Clear email input on success
    } catch (err) {
      console.error("Resend failed:", err);
      setResendError(err.response?.data?.message || 'Failed to resend verification email.');
      setResendStatus('');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
      <h1 className="text-2xl font-semibold mb-4">Email Verification</h1>
      <p className={`text-lg mb-4 ${error ? 'text-red-600' : 'text-gray-700'}`}>{status}</p>
      {error && !showResend && <p className="text-red-500 mt-2">{error}</p>}

      {showResend && (
        <div className="mt-6 border-t pt-6">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-4">Your verification link might be invalid or expired. Enter your email address to resend the verification link.</p>
          <form onSubmit={handleResend}>
            <input
              type="email"
              placeholder="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4"
            />
            <button
              type="submit"
              disabled={isResending}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </form>
          {resendStatus && <p className="text-green-600 mt-3">{resendStatus}</p>}
          {resendError && <p className="text-red-600 mt-3">{resendError}</p>}
        </div>
      )}
    </div>
  );
}

export default VerifyEmailPage;
