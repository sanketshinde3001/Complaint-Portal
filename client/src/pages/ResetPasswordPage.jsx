import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function ResetPasswordPage() {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const { login } = useAuth(); // Use login from context to set user state after reset

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await api.patch(`/auth/resetPassword/${token}`, {
        password,
        passwordConfirm,
      });

      setMessage('Password reset successfully! You are now logged in.');
      // Log the user in using the data returned from the reset endpoint
      login(response.data.data.user);

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/'); // Redirect to home page
      }, 2000);

    } catch (err) {
      console.error("Reset Password failed:", err);
      setError(err.response?.data?.message || 'Failed to reset password. The token might be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
        <div>
          <h2 className="text-center text-2xl font-bold text-white">Reset Your Password</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {message && (
          <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {!message && ( // Hide form after success message
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                New Password
                </label>
                <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="New Password (min. 6 characters)"
                />
            </div>
            <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm New Password
                </label>
                <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm New Password"
                />
            </div>

            <div>
                <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                >
                {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>
            </form>
        )}
         <div className="text-sm text-center mt-4">
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200">
              Back to Login
            </Link>
          </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
