// src/components/Layout.jsx
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth from App.jsx

const Layout = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
            {/* Header/Navbar */}
            <header className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-lg p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-3xl font-extrabold tracking-tight rounded-md px-2 py-1 hover:bg-white hover:text-indigo-700 transition duration-300">
                        Hostelmate.ai
                    </Link>

                    <nav className="space-x-6">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Dashboard
                                </Link>
                                <Link to="/properties" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Properties
                                </Link>
                                <Link to="/units" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Units
                                </Link>
                                <Link to="/beds" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Beds
                                </Link>
                                <Link to="/tenants" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Tenants
                                </Link>
                                <Link to="/bookings" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Bookings
                                </Link>
                                <Link to="/payments" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Payments
                                </Link>
                                <Link to="/expenses" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Expenses
                                </Link>

                                {/* Conditional rendering for Subscription Plans - ONLY for Superusers */}
                                {user && user.is_superuser && (
                                    <Link to="/subscription-plans" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                        Subscription Plans
                                    </Link>
                                )}

                                <span className="text-lg font-medium text-indigo-200">
                                    Welcome, <span className="font-bold">{user?.username || user?.email}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="ml-4 px-5 py-2 bg-red-500 text-white font-semibold rounded-full shadow-md hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Login
                                </Link>
                                <Link to="/register" className="text-lg font-medium hover:text-indigo-200 transition duration-300 rounded-md px-3 py-2 hover:bg-indigo-600">
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* Main Content Area - Outlet is used here to render child routes */}
            <main className="flex-grow container mx-auto p-6">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white text-center p-4 mt-8 shadow-inner">
                <div className="container mx-auto">
                    <p>&copy; {new Date().getFullYear()} Hostelmate.ai. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;