// src/components/AddPaymentForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddPaymentForm = ({ onPaymentAdded }) => {
  const { accessToken } = useAuth();
  const [tenantId, setTenantId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Default method

  const [tenants, setTenants] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all necessary data (tenants, booking agreements)
  useEffect(() => {
    const fetchAllData = async () => {
      if (!accessToken) {
        setLoadingData(false);
        return;
      }
      try {
        const [tenantsRes, bookingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tenants/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
          fetch(`${API_BASE_URL}/api/booking-agreements/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        ]);

        const [tenantsData, bookingsData] = await Promise.all([
          tenantsRes.json(),
          bookingsRes.json(),
        ]);

        setTenants(tenantsData.results);
        setBookings(bookingsData.results);

        // Auto-select first available options if any
        if (tenantsData.results.length > 0) setTenantId(tenantsData.results[0].tenant_id);
        if (bookingsData.results.length > 0) setBookingId(bookingsData.results[0].booking_id);

      } catch (err) {
        setDataError(`Network error fetching data: ${err.message}`);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, [accessToken]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!tenantId || !paymentDate || !amountPaid || !paymentMethod) {
      alert("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenant: tenantId,
          booking: bookingId || null, // Booking can be optional, send null if not selected
          payment_date: paymentDate,
          amount_paid: parseFloat(amountPaid),
          payment_method: paymentMethod,
        }),
      });

      if (response.ok) {
        alert('Payment added successfully!');
        // Clear form
        setTenantId(tenants.length > 0 ? tenants[0].tenant_id : '');
        setBookingId(bookings.length > 0 ? bookings[0].booking_id : '');
        setPaymentDate('');
        setAmountPaid('');
        setPaymentMethod('Cash');
        if (onPaymentAdded) onPaymentAdded(); // Callback to refresh list
      } else {
        const errorData = await response.json();
        console.error('Failed to add payment:', errorData);
        alert(`Failed to add payment: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Payment add request failed:', error);
      alert('Payment add request failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) return <div className="text-center p-4">Loading data for payment form...</div>;
  if (dataError) return <div className="text-center p-4 text-red-600">Error: {dataError}</div>;

  // Check if essential data is missing
  if (tenants.length === 0) return <div className="text-center p-4 text-yellow-600">Please add tenants first.</div>;


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Payment</h3>
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

        {/* Booking Agreement Selection (Optional) */}
        <div>
          <label htmlFor="booking" className="block text-sm font-medium text-gray-700">Select Booking (Optional)</label>
          <select
            id="booking"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            disabled={bookings.length === 0}
          >
            <option value="">-- No Booking Selected --</option>
            {bookings.map((booking) => (
              <option key={booking.booking_id} value={booking.booking_id}>
                {booking.tenant_name} - Bed {booking.bed_number} ({booking.check_in_date} to {booking.check_out_date})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">Payment Date</label>
          <input
            type="date"
            id="paymentDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        {/* Amount Paid */}
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">Amount Paid</label>
          <input
            type="number"
            id="amountPaid"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
          <select
            id="paymentMethod"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Online Payment">Online Payment</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Payment...' : 'Add Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPaymentForm;