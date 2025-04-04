import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    setIsLoading(true);

    // Basic client-side validation
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    if (!formData.email.endsWith('@gcoeara.ac.in')) {
        setError('Please use your college email ending with @gcoeara.ac.in');
        setIsLoading(false);
        return;
    }
    if (!formData.gender) {
        setError('Please select your gender.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        gender: formData.gender,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      });

      setSuccessMessage(response.data.message || 'Signup successful! Please check your email to verify.');
      // Optionally clear form or redirect after a delay
      setFormData({ name: '', email: '', gender: '', password: '', passwordConfirm: '' });
      // setTimeout(() => navigate('/login'), 5000); // Example redirect

    } catch (err) {
      console.error("Signup failed:", err);
      setError(err.response?.data?.message || 'An error occurred during signup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-center mb-6">Create Account</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            College Email (@gcoeara.ac.in)
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            pattern=".+@gcoeara\.ac\.in"
            title="Please use your college email ending with @gcoeara.ac.in"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

         <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gender">
            Gender
          </label>
          <select
            name="gender"
            id="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="" disabled>Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passwordConfirm">
            Confirm Password
          </label>
          <input
            type="password"
            name="passwordConfirm"
            id="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
            minLength="6"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SignupPage;
