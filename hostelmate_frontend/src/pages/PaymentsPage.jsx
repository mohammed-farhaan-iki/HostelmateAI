// src/pages/PaymentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth
import AddPaymentForm from '../components/AddPaymentForm.jsx'; // We will create this next

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const PaymentsPage = () => {
    const { accessToken } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch payments (can be called to refresh list)
    const fetchPayments = async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/payments/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPayments(data.results);
            } else {
                const errorData = await response.json();
                setError(`Failed to fetch payments: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [accessToken]); // Re-fetch if accessToken changes

    if (loading) return <div className="text-center p-8">Loading payments...</div>;
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Payments</h2>
            {payments.length === 0 ? (
                <p className="text-gray-600">No payments found. Add your first payment!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payments.map((payment) => (
                        <div key={payment.payment_id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-2">Amount: AED{payment.amount_paid}</h3>
                            <p className="text-gray-700 mb-1"><strong>Tenant:</strong> {payment.tenant_name || 'N/A'}</p> {/* Assuming tenant_name is available */}
                            <p className="text-gray-700 mb-1"><strong>Booking:</strong> {payment.booking_id || 'N/A'}</p>
                            <p className="text-gray-700 mb-1"><strong>Date:</strong> {payment.payment_date}</p>
                            <p className="text-gray-700"><strong>Method:</strong> {payment.payment_method}</p>
                        </div>
                    ))}
                </div>
            )}
            {/* Add the AddPaymentForm here */}
            <AddPaymentForm onPaymentAdded={fetchPayments} /> {/* Pass fetchPayments to refresh list */}
        </div>
    );
};

export default PaymentsPage;