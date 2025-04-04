import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook

function Navbar() {
  const { isLoggedIn, isAdmin, logout, isLoading } = useAuth(); // Get state and functions from context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Call logout from context
    navigate('/login'); // Redirect to login after logout
  };

  // Don't render navbar content until auth state is determined
  if (isLoading) {
    return (
       <nav className="bg-blue-600 text-white p-4 shadow-md">
         <div className="container mx-auto flex justify-between items-center">
            <span className="text-xl font-bold">Complaint Portal</span>
            <span className="text-sm">Loading...</span>
         </div>
       </nav>
    );
  }

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold hover:text-blue-200">
          Complaint Portal
        </Link>
        <ul className="flex space-x-4 items-center">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:text-blue-200 ${isActive ? 'font-semibold border-b-2 border-white' : ''}`
              }
            >
              Home
            </NavLink>
          </li>
          {isLoggedIn ? (
            <>
              <li>
                <NavLink
                  to="/submit-complaint"
                  className={({ isActive }) =>
                    `hover:text-blue-200 ${isActive ? 'font-semibold border-b-2 border-white' : ''}`
                  }
                >
                  Submit Complaint
                </NavLink>
              </li>
              {isAdmin && (
                 <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `hover:text-blue-200 ${isActive ? 'font-semibold border-b-2 border-white' : ''}`
                    }
                  >
                    Admin Dashboard
                  </NavLink>
                </li>
              )}
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `hover:text-blue-200 ${isActive ? 'font-semibold border-b-2 border-white' : ''}`
                  }
                >
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `hover:text-blue-200 ${isActive ? 'font-semibold border-b-2 border-white' : ''}`
                  }
                >
                  Sign Up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
