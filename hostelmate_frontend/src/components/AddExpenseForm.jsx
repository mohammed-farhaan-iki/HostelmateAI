// src/components/AddExpenseForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import MultiSelectUnits from './MultiSelectUnits'; // <--- IMPORT THE NEW COMPONENT

const API_BASE_URL = 'http://127.0.0.1:8000';

const AddExpenseForm = ({ onExpenseAdded }) => {
    const { accessToken } = useAuth();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState('');
    const [category, setCategory] = useState('Maintenance');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedUnits, setSelectedUnits] = useState([]); // Array for multi-select
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [loadingUnits, setLoadingUnits] = useState(false);

    // Fetch properties on component mount
    useEffect(() => {
        const fetchProperties = async () => {
            if (!accessToken) {
                setLoadingProperties(false);
                return;
            }
            setLoadingProperties(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/properties/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("API Response for Properties:", data);
                    const propertiesArray = Array.isArray(data) ? data : data.results;
                    setProperties(propertiesArray || []);
                    if (propertiesArray && propertiesArray.length > 0) {
                        setSelectedProperty(propertiesArray[0].property_id);
                    } else {
                        setSelectedProperty('');
                    }
                } else {
                    const errorData = await response.json();
                    toast.error(`Failed to fetch properties: ${JSON.stringify(errorData)}`);
                    console.error('Failed to fetch properties:', errorData);
                }
            } catch (error) {
                toast.error(`Network error fetching properties: ${error.message}`);
                console.error('Network error fetching properties:', error);
            } finally {
                setLoadingProperties(false);
            }
        };

        fetchProperties();
    }, [accessToken]);

    // Fetch units when selectedProperty changes
    useEffect(() => {
        const fetchUnits = async () => {
            if (!accessToken || !selectedProperty) {
                setUnits([]);
                setSelectedUnits([]); // Clear selected units
                setLoadingUnits(false);
                return;
            }
            setLoadingUnits(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/units/?property=${selectedProperty}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("API Response for Units:", data);
                    const unitsArray = Array.isArray(data) ? data : data.results;
                    setUnits(unitsArray || []);
                    setSelectedUnits([]); // Reset selected units on property change
                } else {
                    const errorData = await response.json();
                    toast.error(`Failed to fetch units: ${JSON.stringify(errorData)}`);
                    console.error('Failed to fetch units:', errorData);
                }
            } catch (error) {
                toast.error(`Network error fetching units: ${error.message}`);
                console.error('Network error fetching units:', error);
            } finally {
                setLoadingUnits(false);
            }
        };

        fetchUnits();
    }, [accessToken, selectedProperty]);

    // No longer need handleUnitChange as MultiSelectUnits handles its internal state and passes the array directly
    // const handleUnitChange = (e) => {
    //     const options = e.target.options;
    //     const value = [];
    //     for (let i = 0, l = options.length; i < l; i++) {
    //         if (options[i].selected) {
    //             value.push(options[i].value);
    //         }
    //     }
    //     setSelectedUnits(value);
    //     console.log("Selected Units after change:", value);
    // };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!description || !amount || !expenseDate || !category) {
            toast.error("Please fill in all required fields.");
            setIsSubmitting(false);
            return;
        }

        if (properties.length > 0 && !selectedProperty) {
            toast.error("Please select a property.");
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                description: description,
                amount: parseFloat(amount),
                expense_date: expenseDate,
                category: category,
                ...(selectedProperty && { property: selectedProperty }),
                ...(selectedUnits.length > 0 && { units: selectedUnits }),
            };

            const response = await fetch(`${API_BASE_URL}/api/expenses/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success('Expense added successfully!');
                setDescription('');
                setAmount('');
                setExpenseDate('');
                setCategory('Maintenance');
                setSelectedProperty(properties.length > 0 ? properties[0].property_id : '');
                setSelectedUnits([]);
                if (onExpenseAdded) onExpenseAdded();
            } else {
                const errorData = await response.json();
                console.error('Failed to add expense:', errorData);
                toast.error(`Failed to add expense: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Expense add request failed:', error);
            toast.error(`Expense add request failed. Please check your network connection: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prepare options for MultiSelectUnits component
    const unitOptions = Array.isArray(units) ? units.map(unit => ({
        label: `${unit.unit_number} (${unit.bedspace_type})`,
        value: unit.unit_id
    })) : [];

    const isUnitsSelectDisabled = !selectedProperty || loadingUnits || unitOptions.length === 0;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Expense</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                        type="text"
                        id="description"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                {/* Amount */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (AED)</label>
                    <input
                        type="number"
                        id="amount"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>

                {/* Expense Date */}
                <div>
                    <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        id="expenseDate"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        required
                    />
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        id="category"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="Maintenance">Maintenance</option>
                        <option value="Rent">Rent</option>
                        <option value="Supplies">Supplies</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Property Selection */}
                <div>
                    <label htmlFor="property" className="block text-sm font-medium text-gray-700">Property</label>
                    <select
                        id="property"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={selectedProperty}
                        onChange={(e) => setSelectedProperty(e.target.value)}
                        disabled={loadingProperties}
                        required={properties.length > 0}
                    >
                        <option value="">{loadingProperties ? 'Loading properties...' : 'Select a Property'}</option>
                        {Array.isArray(properties) && properties.map((prop) => (
                            <option key={prop.property_id} value={prop.property_id}>
                                {prop.property_name}
                            </option>
                        ))}
                    </select>
                    {properties.length === 0 && !loadingProperties && (
                        <p className="text-sm text-red-500 mt-1">No properties found. Please add a property first.</p>
                    )}
                </div>

                {/* Custom Multi-select for Units */}
                <div>
                    <label htmlFor="units" className="block text-sm font-medium text-gray-700">Units (Optional)</label>
                    <MultiSelectUnits
                        options={unitOptions}
                        selectedValues={selectedUnits}
                        onChange={setSelectedUnits} // Pass setSelectedUnits directly
                        placeholder={loadingUnits ? 'Loading units...' : (selectedProperty ? 'Select unit(s) (Optional)' : 'Select a Property first')}
                        disabled={isUnitsSelectDisabled}
                    />
                    {selectedProperty && units.length === 0 && !loadingUnits && (
                        <p className="text-sm text-red-500 mt-1">No units found for this property.</p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || loadingProperties || loadingUnits || (properties.length > 0 && !selectedProperty)}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Adding Expense...' : 'Add Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default React.memo(AddExpenseForm);