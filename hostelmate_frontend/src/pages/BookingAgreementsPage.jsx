// src/pages/BookingAgreementsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth
import AddBookingAgreementForm from '../components/AddBookingAgreementForm.jsx'; // We will create this next

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const BookingAgreementsPage = () => {
    const { accessToken } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch booking agreements (can be called to refresh list)
    const fetchBookings = async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/booking-agreements/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setBookings(data.results);
            } else {
                const errorData = await response.json();
                setError(`Failed to fetch bookings: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [accessToken]); // Re-fetch if accessToken changes

    if (loading) return <div className="text-center p-8">Loading booking agreements...</div>;
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Booking Agreements</h2>
            {bookings.length === 0 ? (
                <p className="text-gray-600">No booking agreements found. Add your first booking!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                        <div key={booking.booking_id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-2">Tenant: {booking.tenant_name || 'N/A'}</h3>
                            <p className="text-gray-700 mb-1"><strong>Bed:</strong> {booking.bed_number || 'N/A'} (Unit: {booking.unit_number || 'N/A'}, Property: {booking.property_name || 'N/A'})</p>
                            <p className="text-gray-700 mb-1"><strong>Check-in:</strong> {booking.check_in_date}</p>
                            <p className="text-gray-700 mb-1"><strong>Check-out:</strong> {booking.check_out_date}</p>
                            <p className="text-gray-700 mb-1"><strong>Rent:</strong> ${booking.rent_amount}</p>
                            <p className="text-gray-700"><strong>Status:</strong> {booking.booking_status}</p>
                        </div>
                    ))}
                </div>
            )}
            {/* Add the AddBookingAgreementForm here */}
            <AddBookingAgreementForm onBookingAdded={fetchBookings} /> {/* Pass fetchBookings to refresh list */}
        </div>
    );
};

export default BookingAgreementsPage;