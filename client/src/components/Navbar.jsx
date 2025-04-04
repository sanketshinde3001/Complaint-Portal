import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { isLoggedIn, isAdmin, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Active link style
  const activeLinkClass = "font-semibold text-blue-300 border-b-2 border-blue-300";
  const normalLinkClass = "hover:text-blue-300 transition-colors duration-200";

  if (isLoading) {
    return (
      <nav className="bg-gray-900 text-gray-200 py-4 px-6 shadow-lg border-b border-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <span className="text-xl font-bold text-blue-400">Complaint Portal</span>
          <span className="text-sm">Loading...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-900 text-gray-200 py-4 px-6 shadow-lg border-b border-gray-800">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200">
          Complaint Portal
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
          onClick={toggleMenu}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
            />
          </svg>
        </button>
        
        {/* Desktop Navigation */}
        <div className={`w-full lg:flex lg:items-center lg:w-auto ${isMenuOpen ? 'block' : 'hidden'} lg:block mt-4 lg:mt-0`}>
          <ul className="flex flex-col lg:flex-row lg:space-x-6 space-y-2 lg:space-y-0 items-start lg:items-center">
            <li className="w-full lg:w-auto">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block py-1 ${isActive ? activeLinkClass : normalLinkClass}`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </NavLink>
            </li>
            {isLoggedIn ? (
              <>
                <li className="w-full lg:w-auto">
                  <NavLink
                    to="/submit-complaint"
                    className={({ isActive }) =>
                      `block py-1 ${isActive ? activeLinkClass : normalLinkClass}`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Submit Complaint
                  </NavLink>
                </li>
                {isAdmin && (
                  <li className="w-full lg:w-auto">
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `block py-1 ${isActive ? activeLinkClass : normalLinkClass}`
                      }
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </NavLink>
                  </li>
                )}
                <li className="w-full lg:w-auto">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-4 rounded transition-colors duration-200 w-full lg:w-auto text-left lg:text-center"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="w-full lg:w-auto">
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `block py-1 ${isActive ? activeLinkClass : normalLinkClass}`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </NavLink>
                </li>
                <li className="w-full lg:w-auto">
                  <NavLink
                    to="/signup"
                    className={({ isActive }) =>
                      `block py-1 ${isActive ? activeLinkClass : normalLinkClass}`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </NavLink>
                </li>
                <li className="w-full lg:w-auto mt-2 lg:mt-0">
                  <Link 
                    to="/signup" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-4 rounded transition-colors duration-200 block text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;