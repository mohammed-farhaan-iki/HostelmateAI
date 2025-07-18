// src/pages/TenantsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth
import AddTenantForm from '../components/AddTenantForm.jsx'; // We will create this next

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const TenantsPage = () => {
    const { accessToken } = useAuth();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch tenants (can be called to refresh list)
    const fetchTenants = async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/tenants/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setTenants(data.results);
            } else {
                const errorData = await response.json();
                setError(`Failed to fetch tenants: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, [accessToken]); // Re-fetch if accessToken changes

    if (loading) return <div className="text-center p-8">Loading tenants...</div>;
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Tenants</h2>
            {tenants.length === 0 ? (
                <p className="text-gray-600">No tenants found. Add your first tenant!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant) => (
                        <div key={tenant.tenant_id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-2">{tenant.tenant_name}</h3>
                            <p className="text-gray-700 mb-1"><strong>Email:</strong> {tenant.email || 'N/A'}</p>
                            <p className="text-gray-700 mb-1"><strong>Contact:</strong> {tenant.contact_number || 'N/A'}</p>
                            <p className="text-gray-700"><strong>Nationality:</strong> {tenant.nationality || 'N/A'}</p>
                            {/* Add more tenant details here if needed */}
                        </div>
                    ))}
                </div>
            )}
            {/* Add the AddTenantForm here */}
            <AddTenantForm onTenantAdded={fetchTenants} /> {/* Pass fetchTenants to refresh list after adding */}
        </div>
    );
};

export default TenantsPage;