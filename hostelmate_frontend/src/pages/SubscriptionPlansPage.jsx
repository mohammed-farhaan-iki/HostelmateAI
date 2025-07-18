// src/pages/SubscriptionPlansPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Your Django backend URL

const SubscriptionPlansPage = () => {
    const { accessToken, user } = useAuth(); // Get user object to check for superuser status
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [newPlan, setNewPlan] = useState({
        plan_name: '',
        price: '',
        duration_months: '',
        description: '',
        features: []
    });
    const [isAddingPlan, setIsAddingPlan] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, [accessToken]);

    const fetchPlans = async () => {
        if (!accessToken) {
            setPlans([]);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscription-plans/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Fetched subscription plans raw data:", data);

                if (Array.isArray(data)) {
                    setPlans(data);
                } else if (data && Array.isArray(data.results)) {
                    setPlans(data.results);
                } else {
                    console.error("Fetched data for subscription plans is not an array or expected paginated format:", data);
                    setPlans([]);
                    toast.error("Received unexpected data format for subscription plans.");
                }
            } else {
                const errorData = await response.json();
                toast.error(`Failed to fetch subscription plans: ${JSON.stringify(errorData)}`);
                console.error("Failed to fetch subscription plans:", response.status, errorData);
                setPlans([]);
            }
        } catch (error) {
            console.error("Network error fetching subscription plans:", error);
            toast.error("Network error fetching subscription plans.");
            setPlans([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPlan(prev => ({ ...prev, [name]: value }));
    };

    const handleFeaturesChange = (e) => {
        setNewPlan(prev => ({ ...prev, features: e.target.value.split(',').map(f => f.trim()).filter(f => f) }));
    };

    const handleAddPlan = async (e) => {
        e.preventDefault();
        if (!accessToken) {
            toast.error("You must be logged in to add a plan.");
            return;
        }
        if (!user || !user.is_superuser) {
            toast.error("Only administrators can add subscription plans.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/subscription-plans/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPlan),
            });

            if (response.ok) {
                toast.success("Subscription plan added successfully!");
                setNewPlan({ plan_name: '', price: '', duration_months: '', description: '', features: [] });
                setIsAddingPlan(false); // Hide the form after adding
                fetchPlans(); // Refresh the list
            } else {
                const errorData = await response.json();
                toast.error(`Failed to add subscription plan: ${JSON.stringify(errorData)}`);
                console.error("Failed to add subscription plan:", response.status, errorData);
            }
        } catch (error) {
            console.error("Error adding subscription plan:", error);
            toast.error("Network error adding subscription plan.");
        }
    };

    const handleChoosePlan = (planId) => {
        // Redirect to the new payment gateway page with the selected plan ID
        navigate(`/payment-gateway?plan=${planId}`); // <--- CHANGED REDIRECT HERE
    };

    return (
        <div className="container mx-auto p-4 font-inter">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Subscription Plans</h1>

            {/* Conditional rendering for Add New Plan form (only for superusers) */}
            {user && user.is_superuser && ( // <--- Conditional rendering based on user.is_superuser
                <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                        {isAddingPlan ? 'Add New Subscription Plan' : 'Admin: Manage Plans'}
                    </h2>
                    {!isAddingPlan ? (
                        <button
                            onClick={() => setIsAddingPlan(true)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Add New Plan
                        </button>
                    ) : (
                        <form onSubmit={handleAddPlan} className="space-y-4">
                            <div>
                                <label htmlFor="plan_name" className="block text-gray-700 text-sm font-bold mb-2">Plan Name:</label>
                                <input
                                    type="text"
                                    id="plan_name"
                                    name="plan_name"
                                    value={newPlan.plan_name}
                                    onChange={handleInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Price:</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={newPlan.price}
                                    onChange={handleInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="duration_months" className="block text-gray-700 text-sm font-bold mb-2">Duration (Months):</label>
                                <input
                                    type="number"
                                    id="duration_months"
                                    name="duration_months"
                                    value={newPlan.duration_months}
                                    onChange={handleInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={newPlan.description}
                                    onChange={handleInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="features" className="block text-gray-700 text-sm font-bold mb-2">Features (comma-separated):</label>
                                <input
                                    type="text"
                                    id="features"
                                    name="features"
                                    value={newPlan.features.join(', ')}
                                    onChange={handleFeaturesChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Add Plan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingPlan(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Display existing plans */}
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Available Plans</h2>
            {Array.isArray(plans) && plans.length === 0 ? (
                <p className="text-gray-600">No subscription plans available yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(plans) && plans.map((plan) => (
                        <div key={plan.plan_id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-indigo-700 mb-2">{plan.plan_name}</h3>
                            <p className="text-gray-800 text-2xl font-semibold mb-4">${parseFloat(plan.price).toFixed(2)} / {plan.duration_months} Months</p>
                            <p className="text-gray-600 mb-4">{plan.description}</p>
                            {plan.features && plan.features.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-lg font-medium text-gray-700 mb-2">Features:</h4>
                                    <ul className="list-disc list-inside text-gray-600">
                                        {plan.features.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <button
                                onClick={() => handleChoosePlan(plan.plan_id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            >
                                Choose This Plan
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubscriptionPlansPage;