// src/pages/BedsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth
import AddBedForm from '../components/AddBedForm.jsx'; // We will create this next

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const BedsPage = () => {
    const { accessToken } = useAuth();
    const [beds, setBeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch beds (can be called to refresh list)
    const fetchBeds = async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/beds/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setBeds(data.results);
            } else {
                const errorData = await response.json();
                setError(`Failed to fetch beds: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBeds();
    }, [accessToken]); // Re-fetch if accessToken changes

    if (loading) return <div className="text-center p-8">Loading beds...</div>;
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Beds</h2>
            {beds.length === 0 ? (
                <p className="text-gray-600">No beds found. Add your first bed!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {beds.map((bed) => (
                        <div key={bed.bed_id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-2">Bed Number: {bed.bed_number}</h3>
                            <p className="text-gray-700 mb-1"><strong>Unit:</strong> {bed.unit_number || 'N/A'}</p> {/* Assuming unit_number is available */}
                            <p className="text-gray-700 mb-1"><strong>Location:</strong> {bed.location_in_unit || 'N/A'}</p>
                            <p className="text-gray-700"><strong>Active:</strong> {bed.is_active ? 'Yes' : 'No'}</p>
                        </div>
                    ))}
                </div>
            )}
            {/* Add the AddBedForm here */}
            <AddBedForm onBedAdded={fetchBeds} /> {/* Pass fetchBeds to refresh list after adding */}
        </div>
    );
};

export default BedsPage;