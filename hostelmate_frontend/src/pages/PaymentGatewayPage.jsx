// src/pages/PaymentGatewayPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://127.0.0.1:8000';

const PaymentGatewayPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { accessToken, user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const planId = searchParams.get('plan');

    useEffect(() => {
        const fetchPlanDetails = async () => {
            if (!accessToken || !planId) {
                setLoading(false);
                setError("No plan selected or not authenticated.");
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/subscription-plans/${planId}/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setSelectedPlan(data);
                } else {
                    const errorData = await response.json();
                    setError(`Failed to fetch plan details: ${JSON.stringify(errorData)}`);
                    toast.error("Failed to load selected plan details.");
                }
            } catch (err) {
                setError(`Network error: ${err.message}`);
                toast.error("Network error fetching plan details.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlanDetails();
    }, [accessToken, planId]);

    const handleSimulatePaymentAndSubscribe = async () => {
        if (!selectedPlan || !accessToken || !user) {
            toast.error("Cannot process payment. Please select a plan and ensure you are logged in.");
            return;
        }

        // Simulate payment success and create subscription
        try {
            const today = new Date();
            const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + selectedPlan.duration_months);
            const endDateString = endDate.toISOString().split('T')[0];

            const response = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    plan: selectedPlan.plan_id,
                    start_date: startDate,
                    end_date: endDateString,
                    is_active: true,
                    // For now, leave stripe_subscription_id/paypal_subscription_id blank
                }),
            });

            if (response.ok) {
                toast.success("Payment simulated & Subscription activated! Please log out and log back in to access the dashboard.");
                navigate('/dashboard'); // Redirect to dashboard after successful subscription
            } else {
                const errorData = await response.json();
                toast.error(`Failed to activate subscription: ${JSON.stringify(errorData)}`);
                console.error("Failed to activate subscription:", response.status, errorData);
            }
        } catch (error) {
            console.error("Error during simulated payment and subscription:", error);
            toast.error("Network error during subscription process.");
        }
    };

    if (loading) return <div className="text-center p-8">Loading payment details...</div>;
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;
    if (!selectedPlan) return <div className="text-center p-8 text-yellow-600">No subscription plan selected. Please go back and choose a plan.</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Payment Gateway</h2>
                <p className="text-lg text-gray-700 mb-4">You are subscribing to:</p>
                <div className="border border-indigo-300 bg-indigo-50 p-4 rounded-md mb-6">
                    <h3 className="text-xl font-bold text-indigo-800 mb-2">{selectedPlan.plan_name}</h3>
                    <p className="text-gray-800 text-2xl font-semibold mb-2">${parseFloat(selectedPlan.price).toFixed(2)} / {selectedPlan.duration_months} Months</p>
                    <p className="text-gray-600">{selectedPlan.description}</p>
                </div>

                <p className="text-gray-700 mb-6">
                    This is a placeholder for your actual payment gateway integration.
                    Click the button below to simulate payment and activate your subscription.
                </p>
                <button
                    onClick={handleSimulatePaymentAndSubscribe}
                    className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition duration-300"
                >
                    Simulate Payment & Subscribe
                </button>
                <p className="mt-4 text-sm text-gray-600">
                    <Link to="/subscription-plans" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Go back to Subscription Plans
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default PaymentGatewayPage;