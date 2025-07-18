// src/components/AddSubscriptionPlanForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddSubscriptionPlanForm = ({ onPlanAdded }) => {
  const { accessToken } = useAuth();
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!planName || !price || !durationMonths) {
      alert("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription-plans/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan_name: planName,
          price: parseFloat(price),
          duration_months: parseInt(durationMonths, 10),
        }),
      });

      if (response.ok) {
        alert('Subscription plan added successfully!');
        // Clear form
        setPlanName('');
        setPrice('');
        setDurationMonths('');
        if (onPlanAdded) onPlanAdded(); // Callback to refresh list
      } else {
        const errorData = await response.json();
        console.error('Failed to add subscription plan:', errorData);
        alert(`Failed to add subscription plan: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Subscription plan add request failed:', error);
      alert('Subscription plan add request failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Subscription Plan</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Name */}
        <div>
          <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Plan Name</label>
          <input
            type="text"
            id="planName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            required
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (AED)</label>
          <input
            type="number"
            id="price"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* Duration (Months) */}
        <div>
          <label htmlFor="durationMonths" className="block text-sm font-medium text-gray-700">Duration (Months)</label>
          <input
            type="number"
            id="durationMonths"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Plan...' : 'Add Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubscriptionPlanForm;