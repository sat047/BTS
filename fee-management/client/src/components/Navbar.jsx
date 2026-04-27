import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-indigo-600 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Brand */}
        <Link to="/" className="text-white text-2xl font-bold">
          BLOOM TANZ STUDIO
        </Link>

        {/* Hamburger menu for mobile */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-white focus:outline-none"
            aria-label="Toggle navigation"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-white hover:text-indigo-200 transition">
            Dashboard
          </Link>
          <Link to="/payments" className="text-white hover:text-indigo-200 transition">
            Payments
          </Link>
          <Link to="/students" className="text-white hover:text-indigo-200 transition">
            Students
          </Link>
          {admin && (
            <span className="text-indigo-200 text-sm">
              Logged in as: {admin.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2 px-4 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu (conditionally rendered) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-indigo-700 mt-4 rounded-md shadow-lg">
          <div className="flex flex-col space-y-2 p-4">
            <Link
              to="/dashboard"
              className="text-white hover:text-indigo-200 transition block py-2"
              onClick={toggleMobileMenu}
            >
              Dashboard
            </Link>
            <Link
              to="/payments"
              className="text-white hover:text-indigo-200 transition block py-2"
              onClick={toggleMobileMenu}
            >
              Payments
            </Link>
            <Link
              to="/students"
              className="text-white hover:text-indigo-200 transition block py-2"
              onClick={toggleMobileMenu}
            >
              Students
            </Link>
            <button
              onClick={() => { handleLogout(); toggleMobileMenu(); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-md transition w-full text-left"
            >
              Logout
            </button>
            {admin && (
              <span className="text-indigo-200 text-sm pt-2">
                Logged in as: {admin.email}
              </span>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}