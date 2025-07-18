// src/pages/PropertiesListPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'react-toastify'; // Assuming you have react-toastify installed
import AddPropertyForm from '../components/AddPropertyForm.jsx'; // Assuming this component exists

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const PropertiesListPage = () => {
  const { user, accessToken } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch properties (can be called to refresh list)
  const fetchProperties = async () => {
    if (!accessToken) {
      setLoading(false);
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
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch properties: ${JSON.stringify(errorData)}`);
        toast.error("Failed to fetch properties.");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      toast.error("Network error fetching properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [accessToken]);

  if (loading) return <div className="text-center p-8">Loading Properties data...</div>;
  if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Properties</h2>
      {properties.length === 0 ? (
        <p className="text-gray-600">No properties found. Add your first property!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.property_id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">{property.property_name}</h3>
              <p className="text-gray-700 mb-1"><strong>Address:</strong> {property.address || 'N/A'}</p>
              <p className="text-gray-700 mb-1"><strong>City:</strong> {property.city || 'N/A'}</p>
              <p className="text-gray-700"><strong>Country:</strong> {property.country || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
      {/* Ensure AddPropertyForm is correctly imported and used, or remove if not needed on dashboard */}
      <AddPropertyForm accessToken={accessToken} onPropertyAdded={fetchProperties} />
    </>
  );
};

export default PropertiesListPage;