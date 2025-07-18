// src/components/AddSubscriptionForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddSubscriptionForm = ({ onSubscriptionAdded }) => {
  const { accessToken } = useAuth();
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true); // Default to active

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch subscription plans when component mounts or accessToken changes
  useEffect(() => {
    const fetchPlans = async () => {
      if (!accessToken) {
        setLoadingPlans(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/subscription-plans/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setPlans(data.results);
          if (data.results.length > 0) {
            setPlanId(data.results[0].plan_id); // Auto-select first plan
          }
        } else {
          const errorData = await response.json();
          setPlansError(`Failed to fetch subscription plans: ${JSON.stringify(errorData)}`);
        }
      } catch (err) {
        setPlansError(`Network error fetching plans: ${err.message}`);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [accessToken]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!planId || !startDate || !endDate) {
      alert("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan: planId,
          start_date: startDate,
          end_date: endDate,
          is_active: isActive,
        }),
      });

      if (response.ok) {
        alert('Subscription added successfully!');
        // Clear form
        setPlanId(plans.length > 0 ? plans[0].plan_id : '');
        setStartDate('');
        setEndDate('');
        setIsActive(true);
        if (onSubscriptionAdded) onSubscriptionAdded(); // Callback to refresh list
      } else {
        const errorData = await response.json();
        console.error('Failed to add subscription:', errorData);
        alert(`Failed to add subscription: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Subscription add request failed:', error);
      alert('Subscription add request failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingPlans) return <div className="text-center p-4">Loading subscription plans...</div>;
  if (plansError) return <div className="text-center p-4 text-red-600">Error: {plansError}</div>;
  if (plans.length === 0) return <div className="text-center p-4 text-yellow-600">Please add subscription plans first (e.g., via Django Admin or Subscription Plans page).</div>;


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Subscription</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Selection */}
        <div>
          <label htmlFor="plan" className="block text-sm font-medium text-gray-700">Select Plan</label>
          <select
            id="plan"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            required
          >
            {plans.map((plan) => (
              <option key={plan.plan_id} value={plan.plan_id}>
                {plan.plan_name} (${plan.price} / {plan.duration_months} months)
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        {/* Is Active Checkbox */}
        <div className="flex items-center md:col-span-2 mt-2">
          <input
            type="checkbox"
            id="isActive"
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Is Active?</label>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Subscription...' : 'Add Subscription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubscriptionForm;