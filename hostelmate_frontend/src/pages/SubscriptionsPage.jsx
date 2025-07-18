// src/pages/SubscriptionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Your Django backend URL

const SubscriptionsPage = () => {
    const { accessToken } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]); // To fetch available plans
    const [newSubscription, setNewSubscription] = useState({
        plan: '', // This will hold plan_id
        start_date: '',
        end_date: '',
        is_active: true, // Default to active for new subscriptions
    });
    const [searchParams] = useSearchParams();
    const preselectedPlanId = searchParams.get('plan'); // Get plan ID from URL

    useEffect(() => {
        fetchSubscriptions();
        fetchSubscriptionPlans();
    }, []);

    useEffect(() => {
        if (preselectedPlanId && subscriptionPlans.length > 0) {
            // Set the preselected plan if it exists in the fetched plans
            const planExists = subscriptionPlans.some(plan => plan.plan_id === preselectedPlanId);
            if (planExists) {
                setNewSubscription(prev => ({ ...prev, plan: preselectedPlanId }));
            } else {
                toast.warn("Preselected plan not found.");
            }
        }
    }, [preselectedPlanId, subscriptionPlans]);


    const fetchSubscriptions = async () => {
        if (!accessToken) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSubscriptions(data);
            } else {
                toast.error("Failed to fetch subscriptions.");
                console.error("Failed to fetch subscriptions:", response.status, await response.json());
            }
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            toast.error("Network error fetching subscriptions.");
        }
    };

    const fetchSubscriptionPlans = async () => {
        if (!accessToken) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscription-plans/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSubscriptionPlans(data);
            } else {
                toast.error("Failed to fetch subscription plans for form.");
                console.error("Failed to fetch subscription plans:", response.status, await response.json());
            }
        } catch (error) {
            console.error("Error fetching subscription plans:", error);
            toast.error("Network error fetching subscription plans for form.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewSubscription(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-calculate end_date if plan is selected and start_date is provided
        if (name === 'plan' || name === 'start_date') {
            const selectedPlanId = name === 'plan' ? value : newSubscription.plan;
            const startDate = name === 'start_date' ? value : newSubscription.start_date;

            const selectedPlan = subscriptionPlans.find(p => p.plan_id === selectedPlanId);

            if (selectedPlan && startDate) {
                const sDate = new Date(startDate);
                sDate.setMonth(sDate.getMonth() + selectedPlan.duration_months);
                const endDateString = sDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
                setNewSubscription(prev => ({ ...prev, end_date: endDateString }));
            } else {
                 setNewSubscription(prev => ({ ...prev, end_date: '' })); // Clear if no valid plan/start date
            }
        }
    };

    const handleAddSubscription = async (e) => {
        e.preventDefault();
        if (!accessToken) {
            toast.error("You must be logged in to add a subscription.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSubscription),
            });

            if (response.ok) {
                toast.success("Subscription added successfully! Please log out and log back in to refresh your access.");
                setNewSubscription({ plan: '', start_date: '', end_date: '', is_active: true });
                fetchSubscriptions(); // Refresh the list
            } else {
                const errorData = await response.json();
                toast.error(`Failed to add subscription: ${JSON.stringify(errorData)}`);
                console.error("Failed to add subscription:", response.status, errorData);
            }
        } catch (error) {
            console.error("Error adding subscription:", error);
            toast.error("Network error adding subscription.");
        }
    };

    return (
        <div className="container mx-auto p-4 font-inter">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Subscriptions</h1>

            {/* Add New Subscription Form */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Subscription</h2>
                <form onSubmit={handleAddSubscription} className="space-y-4">
                    <div>
                        <label htmlFor="plan" className="block text-gray-700 text-sm font-bold mb-2">Subscription Plan:</label>
                        <select
                            id="plan"
                            name="plan"
                            value={newSubscription.plan}
                            onChange={handleInputChange}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        >
                            <option value="">Select a Plan</option>
                            {subscriptionPlans.map(plan => (
                                <option key={plan.plan_id} value={plan.plan_id}>
                                    {plan.plan_name} (${parseFloat(plan.price).toFixed(2)} for {plan.duration_months} months)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start_date" className="block text-gray-700 text-sm font-bold mb-2">Start Date:</label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={newSubscription.start_date}
                            onChange={handleInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="end_date" className="block text-gray-700 text-sm font-bold mb-2">End Date (Auto-calculated):</label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={newSubscription.end_date}
                            onChange={handleInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                            readOnly // Make it read-only as it's auto-calculated
                        />
                    </div>
                    <div>
                        <label htmlFor="is_active" className="flex items-center text-gray-700 text-sm font-bold mb-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={newSubscription.is_active}
                                onChange={handleInputChange}
                                className="mr-2 leading-tight"
                            />
                            Is Active?
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Add Subscription
                        </button>
                    </div>
                </form>
            </div>

            {/* Display Existing Subscriptions */}
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Current and Past Subscriptions</h2>
            {subscriptions.length === 0 ? (
                <p className="text-gray-600">You have no subscriptions yet.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Plan Name
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Start Date
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    End Date
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.map((sub) => (
                                <tr key={sub.subscription_id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {sub.plan_name}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {sub.start_date}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {sub.end_date}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${sub.is_active ? 'text-green-900' : 'text-red-900'}`}>
                                            <span aria-hidden="true" className={`absolute inset-0 opacity-50 rounded-full ${sub.is_active ? 'bg-green-200' : 'bg-red-200'}`}></span>
                                            <span className="relative">{sub.is_active ? 'Active' : 'Inactive'}</span>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SubscriptionsPage;