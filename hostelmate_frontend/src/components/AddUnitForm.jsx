// src/components/AddUnitForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddUnitForm = ({ onUnitAdded }) => {
  const { accessToken } = useAuth();
  const [unitNumber, setUnitNumber] = useState('');
  const [bedspaceType, setBedspaceType] = useState('Shared'); // Default to Shared
  const [rentPerBed, setRentPerBed] = useState('');
  const [propertyId, setPropertyId] = useState(''); // To hold selected property ID
  const [properties, setProperties] = useState([]); // To store fetched properties
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch properties when component mounts or accessToken changes
  useEffect(() => {
    const fetchProperties = async () => {
      if (!accessToken) {
        setLoadingProperties(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/properties/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProperties(data.results);
          if (data.results.length > 0) {
            setPropertyId(data.results[0].property_id); // Auto-select first property
          }
        } else {
          const errorData = await response.json();
          setPropertiesError(`Failed to fetch properties: ${JSON.stringify(errorData)}`);
        }
      } catch (err) {
        setPropertiesError(`Network error fetching properties: ${err.message}`);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [accessToken]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!propertyId) {
      alert("Please select a property for the unit.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/units/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          unit_number: unitNumber,
          bedspace_type: bedspaceType,
          rent_per_bed: parseFloat(rentPerBed), // Ensure it's a number
          property: propertyId, // Link to the selected property
        }),
      });

      if (response.ok) {
        alert('Unit added successfully!');
        // Clear form
        setUnitNumber('');
        setBedspaceType('Shared');
        setRentPerBed('');
        // propertyId remains selected or resets based on preference
        if (onUnitAdded) onUnitAdded(); // Callback to refresh units list
      } else {
        const errorData = await response.json();
        console.error('Failed to add unit:', errorData);
        alert(`Failed to add unit: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Unit add request failed:', error);
      alert('Unit add request failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProperties) return <div className="text-center p-4">Loading properties for unit assignment...</div>;
  if (propertiesError) return <div className="text-center p-4 text-red-600">Error: {propertiesError}</div>;
  if (properties.length === 0) return <div className="text-center p-4 text-yellow-600">Please add a property first before adding units.</div>;


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Unit</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="property" className="block text-sm font-medium text-gray-700">Select Property</label>
          <select
            id="property"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
          >
            {properties.map((prop) => (
              <option key={prop.property_id} value={prop.property_id}>
                {prop.property_name} ({prop.city})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700">Unit Number</label>
          <input
            type="text"
            id="unitNumber"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="bedspaceType" className="block text-sm font-medium text-gray-700">Bedspace Type</label>
          <select
            id="bedspaceType"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={bedspaceType}
            onChange={(e) => setBedspaceType(e.target.value)}
            required
          >
            <option value="Shared">Shared</option>
            <option value="Private">Private</option>
          </select>
        </div>
        <div>
          <label htmlFor="rentPerBed" className="block text-sm font-medium text-gray-700">Rent Per Bed</label>
          <input
            type="number"
            id="rentPerBed"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={rentPerBed}
            onChange={(e) => setRentPerBed(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Unit...' : 'Add Unit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUnitForm;