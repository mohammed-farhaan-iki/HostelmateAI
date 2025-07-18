// src/pages/UnitsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import AddUnitForm from '../components/AddUnitForm.jsx'; // <--- Import AddUnitForm

const API_BASE_URL = 'http://127.0.0.1:8000';

const UnitsPage = () => {
    const { accessToken } = useAuth();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch units (can be called to refresh list)
    const fetchUnits = async () => {
        if (!accessToken) {
            setLoading(false);
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
            } else {
                const errorData = await response.json();
                setError(`Failed to fetch units: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, [accessToken]); // Re-fetch if accessToken changes

    if (loading) return <div className="text-center p-8">Loading units...</div>;
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Units</h2>
            {units.length === 0 ? (
                <p className="text-gray-600">No units found. Add your first unit!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {units.map((unit) => (
                        <div key={unit.unit_id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-2">Unit Number: {unit.unit_number}</h3>
                            {/* Assuming property_name is available from API, if not, you'd need to fetch property details */}
                            <p className="text-gray-700 mb-1"><strong>Property:</strong> {unit.property_name || 'N/A'}</p>
                            <p className="text-gray-700 mb-1"><strong>Type:</strong> {unit.bedspace_type || 'N/A'}</p>
                            <p className="text-gray-700"><strong>Rent per Bed:</strong> {unit.rent_per_bed || 'N/A'}</p>
                        </div>
                    ))}
                </div>
            )}
            {/* Add the AddUnitForm here */}
            <AddUnitForm onUnitAdded={fetchUnits} /> {/* Pass fetchUnits to refresh list after adding */}
        </div>
    );
};

export default UnitsPage;