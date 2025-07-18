// src/components/AddPropertyForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth
import { toast } from 'react-toastify'; // Import toast

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const AddPropertyForm = ({ onPropertyAdded }) => {
    const { accessToken } = useAuth();
    const [propertyName, setPropertyName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/properties/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ property_name: propertyName, address, city, country, description }),
            });

            if (response.ok) {
                toast.success('Property added successfully!');
                setPropertyName('');
                setAddress('');
                setCity('');
                setCountry('');
                setDescription('');
                if (onPropertyAdded) onPropertyAdded();
            } else {
                const errorData = await response.json();
                console.error('Failed to add property:', errorData);
                toast.error(`Failed to add property: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Property add request failed:', error);
            toast.error('Property add request failed. Please check your network connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Property</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700">Property Name</label>
                    <input
                        type="text"
                        id="propertyName"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={propertyName}
                        onChange={(e) => setPropertyName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                        type="text"
                        id="address"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                    <input
                        type="text"
                        id="city"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                        type="text"
                        id="country"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        id="description"
                        rows="3"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>
                <div className="md:col-span-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Adding Property...' : 'Add Property'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPropertyForm;