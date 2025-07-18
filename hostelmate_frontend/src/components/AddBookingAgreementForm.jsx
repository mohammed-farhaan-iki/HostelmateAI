// src/components/AddBookingAgreementForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddBookingAgreementForm = ({ onBookingAdded }) => {
  const { accessToken } = useAuth();
  const [tenantId, setTenantId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [bedId, setBedId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [bookingStatus, setBookingStatus] = useState('Pending'); // Default status

  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [beds, setBeds] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all necessary data (tenants, properties, units, beds)
  useEffect(() => {
    const fetchAllData = async () => {
      if (!accessToken) {
        setLoadingData(false);
        return;
      }
      try {
        const [tenantsRes, propertiesRes, unitsRes, bedsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tenants/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
          fetch(`${API_BASE_URL}/api/properties/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
          fetch(`${API_BASE_URL}/api/units/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
          fetch(`${API_BASE_URL}/api/beds/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        ]);

        const [tenantsData, propertiesData, unitsData, bedsData] = await Promise.all([
          tenantsRes.json(),
          propertiesRes.json(),
          unitsRes.json(),
          bedsRes.json(),
        ]);

        setTenants(tenantsData.results);
        setProperties(propertiesData.results);
        setUnits(unitsData.results);
        setBeds(bedsData.results);

        // Auto-select first available options if any
        if (tenantsData.results.length > 0) setTenantId(tenantsData.results[0].tenant_id);
        if (propertiesData.results.length > 0) setPropertyId(propertiesData.results[0].property_id);
        if (unitsData.results.length > 0) setUnitId(unitsData.results[0].unit_id);
        if (bedsData.results.length > 0) setBedId(bedsData.results[0].bed_id);

      } catch (err) {
        setDataError(`Network error fetching data: ${err.message}`);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, [accessToken]);

  // Filter units and beds based on selected property/unit
  const filteredUnits = units.filter(unit => unit.property === propertyId);
  const filteredBeds = beds.filter(bed => bed.unit === unitId);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!tenantId || !bedId || !checkInDate || !checkOutDate || !rentAmount) {
      alert("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/booking-agreements/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenant: tenantId,
          bed: bedId,
          property: propertyId, // Pass property ID
          unit: unitId, // Pass unit ID
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          rent_amount: parseFloat(rentAmount),
          booking_status: bookingStatus,
        }),
      });

      if (response.ok) {
        alert('Booking agreement added successfully!');
        // Clear form
        setTenantId(tenants.length > 0 ? tenants[0].tenant_id : '');
        setPropertyId(properties.length > 0 ? properties[0].property_id : '');
        setUnitId(units.length > 0 ? units[0].unit_id : '');
        setBedId(beds.length > 0 ? beds[0].bed_id : '');
        setCheckInDate('');
        setCheckOutDate('');
        setRentAmount('');
        setBookingStatus('Pending');
        if (onBookingAdded) onBookingAdded(); // Callback to refresh list
      } else {
        const errorData = await response.json();
        console.error('Failed to add booking agreement:', errorData);
        alert(`Failed to add booking agreement: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Booking agreement add request failed:', error);
      alert('Booking agreement add request failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) return <div className="text-center p-4">Loading data for booking form...</div>;
  if (dataError) return <div className="text-center p-4 text-red-600">Error: {dataError}</div>;

  // Check if essential data is missing
  if (tenants.length === 0) return <div className="text-center p-4 text-yellow-600">Please add tenants first.</div>;
  if (properties.length === 0) return <div className="text-center p-4 text-yellow-600">Please add properties first.</div>;
  if (units.length === 0) return <div className="text-center p-4 text-yellow-600">Please add units first.</div>;
  if (beds.length === 0) return <div className="text-center p-4 text-yellow-600">Please add beds first.</div>;


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Booking Agreement</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tenant Selection */}
        <div>
          <label htmlFor="tenant" className="block text-sm font-medium text-gray-700">Select Tenant</label>
          <select
            id="tenant"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
          >
            {tenants.map((tenant) => (
              <option key={tenant.tenant_id} value={tenant.tenant_id}>
                {tenant.tenant_name} ({tenant.email})
              </option>
            ))}
          </select>
        </div>

        {/* Property Selection */}
        <div>
          <label htmlFor="property" className="block text-sm font-medium text-gray-700">Select Property</label>
          <select
            id="property"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={propertyId}
            onChange={(e) => { setPropertyId(e.target.value); setUnitId(''); setBedId(''); }} // Reset unit/bed on property change
            required
          >
            {properties.map((prop) => (
              <option key={prop.property_id} value={prop.property_id}>
                {prop.property_name} ({prop.city})
              </option>
            ))}
          </select>
        </div>

        {/* Unit Selection (Filtered by Property) */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Select Unit</label>
          <select
            id="unit"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={unitId}
            onChange={(e) => { setUnitId(e.target.value); setBedId(''); }} // Reset bed on unit change
            required
            disabled={filteredUnits.length === 0}
          >
            {filteredUnits.length === 0 && <option value="">No units for this property</option>}
            {filteredUnits.map((unit) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                Unit {unit.unit_number} ({unit.bedspace_type})
              </option>
            ))}
          </select>
        </div>

        {/* Bed Selection (Filtered by Unit) */}
        <div>
          <label htmlFor="bed" className="block text-sm font-medium text-gray-700">Select Bed</label>
          <select
            id="bed"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={bedId}
            onChange={(e) => setBedId(e.target.value)}
            required
            disabled={filteredBeds.length === 0}
          >
            {filteredBeds.length === 0 && <option value="">No beds for this unit</option>}
            {filteredBeds.map((bed) => (
              <option key={bed.bed_id} value={bed.bed_id}>
                Bed {bed.bed_number} (Location: {bed.location_in_unit})
              </option>
            ))}
          </select>
        </div>

        {/* Check-in Date */}
        <div>
          <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">Check-in Date</label>
          <input
            type="date"
            id="checkInDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            required
          />
        </div>

        {/* Check-out Date */}
        <div>
          <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700">Check-out Date</label>
          <input
            type="date"
            id="checkOutDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            required
          />
        </div>

        {/* Rent Amount */}
        <div>
          <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">Rent Amount</label>
          <input
            type="number"
            id="rentAmount"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={rentAmount}
            onChange={(e) => setRentAmount(e.target.value)}
            required
          />
        </div>

        {/* Booking Status */}
        <div>
          <label htmlFor="bookingStatus" className="block text-sm font-medium text-gray-700">Booking Status</label>
          <select
            id="bookingStatus"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            required
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Booking...' : 'Add Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookingAgreementForm;