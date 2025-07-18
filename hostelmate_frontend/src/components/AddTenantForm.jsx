// src/components/AddTenantForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddTenantForm = ({ onTenantAdded }) => {
  const { accessToken } = useAuth();
  const [tenantName, setTenantName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenant_name: tenantName,
          contact_number: contactNumber,
          email: email,
          nationality: nationality,
          identification_number: identificationNumber,
        }),
      });

      if (response.ok) {
        alert('Tenant added successfully!');
        // Clear form
        setTenantName('');
        setContactNumber('');
        setEmail('');
        setNationality('');
        setIdentificationNumber('');
        if (onTenantAdded) onTenantAdded(); // Callback to refresh tenants list
      } else {
        const errorData = await response.json();
        console.error('Failed to add tenant:', errorData);
        alert(`Failed to add tenant: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Tenant add request failed:', error);
      alert('Tenant add request failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Tenant</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">Tenant Name</label>
          <input
            type="text"
            id="tenantName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
          <input
            type="text"
            id="contactNumber"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality</label>
          <input
            type="text"
            id="nationality"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="identificationNumber" className="block text-sm font-medium text-gray-700">Identification Number</label>
          <input
            type="text"
            id="identificationNumber"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={identificationNumber}
            onChange={(e) => setIdentificationNumber(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Tenant...' : 'Add Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTenantForm;