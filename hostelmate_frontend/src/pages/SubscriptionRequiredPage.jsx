// src/pages/SubscriptionRequiredPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App'; // <--- IMPORTANT: Import useAuth to access logout function

const SubscriptionRequiredPage = () => {
  const { logout } = useAuth(); // <--- Get the logout function from your AuthContext

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-red-600 mb-4">Subscription Required</h2>
        <p className="text-gray-700 mb-6">
          You need an active subscription to access the dashboard and other features.
        </p>
        <p className="text-gray-700 mb-6">
          Please subscribe to a plan, or contact support if you believe this is an error.
        </p>
        <Link
          to="/subscription-plans"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition duration-300"
        >
          View Subscription Plans
        </Link>
        <p className="mt-4 text-sm text-gray-600">
          {/* Changed from Link to a button that calls the logout function */}
          <button
            onClick={logout} // <--- This calls the logout function from useAuth
            className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none cursor-pointer p-0"
          >
            Logout
          </button>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionRequiredPage;