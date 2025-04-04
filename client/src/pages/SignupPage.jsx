import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import api from '../services/api'; // Import the configured Axios instance

function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Basic client-side validation (keep existing checks)
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.email.endsWith('@gcoeara.ac.in')) {
      setError('Please use your college email ending with @gcoeara.ac.in');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender.');
      return;
    }

    setIsLoading(true); // Start loading only after basic checks pass

    try {
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        gender: formData.gender,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      });

      setSuccessMessage(response.data.message || 'Signup successful! Please check your email to verify.');
      // Clear form on success
      setFormData({ name: '', email: '', gender: '', password: '', passwordConfirm: '' });
      // Optionally redirect after a delay
      // setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      console.error("Signup failed:", err);
      setError(err.response?.data?.message || 'An error occurred during signup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Apply the same outer container style as LoginPage
    <div className="max-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-900">
      {/* Apply the same inner form container style */}
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
        <div>
          {/* Match heading style */}
          <h1 className="text-center text-2xl font-bold text-white">Create a new account</h1>
          {/* Match sub-text and link style */}
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {/* Apply consistent error message style */}
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Apply consistent success message style */}
        {successMessage && (
          <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {/* Match form structure and spacing */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Use rounded-md shadow-sm -space-y-px structure if inputs are meant to look connected, or keep separate divs with mt-4 if preferred */}
          {/* Keeping separate divs for clarity in signup form */}
          <div>
            {/* Match label style */}
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            {/* Match input style */}
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Full Name"
            />
          </div>

          <div className="mt-4"> {/* Add margin top if not using -space-y-px */}
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              College Email (@gcoeara.ac.in)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              pattern=".+@gcoeara\.ac\.in"
              title="Please use your college email ending with @gcoeara.ac.in"
              value={formData.email}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="username@gcoeara.ac.in"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
              Gender
            </label>
            {/* Style select similar to input */}
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" // Removed placeholder-gray-500 as select uses option
            >
              <option value="" disabled className="text-gray-500">Select Gender</option> {/* Style disabled option as placeholder */}
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mt-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength="6"
              value={formData.password}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Password (min. 6 characters)"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              minLength="6"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Confirm Password"
            />
          </div>

          <div>
            {/* Match button style and loading state */}
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Sign up' // Changed button text
              )}
            </button>
          </div>
        </form>
        {/* Removed the redundant "Already have an account?" link from the bottom */}
      </div>
    </div>
  );
}

export default SignupPage;