// src/components/AddBedForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddBedForm = ({ onBedAdded }) => {
  const { accessToken } = useAuth();
  const [bedNumber, setBedNumber] = useState('');
  const [locationInUnit, setLocationInUnit] = useState('');
  const [isActive, setIsActive] = useState(true); // Default to active
  const [unitId, setUnitId] = useState(''); // To hold selected unit ID
  const [units, setUnits] = useState([]); // To store fetched units
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [unitsError, setUnitsError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch units when component mounts or accessToken changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!accessToken) {
        setLoadingUnits(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/units/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUnits(data.results);
          if (data.results.length > 0) {
            setUnitId(data.results[0].unit_id); // Auto-select first unit
          }
        } else {
          const errorData = await response.json();
          setUnitsError(`Failed to fetch units: ${JSON.stringify(errorData)}`);
        }
      } catch (err) {
        setUnitsError(`Network error fetching units: ${err.message}`);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [accessToken]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!unitId) {
      alert("Please select a unit for the bed.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/beds/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          bed_number: bedNumber,
          location_in_unit: locationInUnit,
          is_active: isActive,
          unit: unitId, // Link to the selected unit
        }),
      });

      if (response.ok) {
        alert('Bed added successfully!');
        // Clear form
        setBedNumber('');
        setLocationInUnit('');
        setIsActive(true);
        // unitId remains selected or resets based on preference
        if (onBedAdded) onBedAdded(); // Callback to refresh beds list
      } else {
        const errorData = await response.json();
        console.error('Failed to add bed:', errorData);
        alert(`Failed to add bed: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Bed add request failed:', error);
      alert('Bed add request failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUnits) return <div className="text-center p-4">Loading units for bed assignment...</div>;
  if (unitsError) return <div className="text-center p-4 text-red-600">Error: {unitsError}</div>;
  if (units.length === 0) return <div className="text-center p-4 text-yellow-600">Please add a unit first before adding beds.</div>;


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Bed</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Select Unit</label>
          <select
            id="unit"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            required
          >
            {units.map((unit) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                Unit {unit.unit_number} ({unit.property_name || 'N/A'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bedNumber" className="block text-sm font-medium text-gray-700">Bed Number</label>
          <input
            type="text"
            id="bedNumber"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="locationInUnit" className="block text-sm font-medium text-gray-700">Location in Unit (e.g., A, B, Window)</label>
          <input
            type="text"
            id="locationInUnit"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={locationInUnit}
            onChange={(e) => setLocationInUnit(e.target.value)}
          />
        </div>
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
            {isSubmitting ? 'Adding Bed...' : 'Add Bed'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBedForm;