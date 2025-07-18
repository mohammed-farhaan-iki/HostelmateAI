// src/pages/ExpensesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Adjust import path for useAuth
import AddExpenseForm from '../components/AddExpenseForm.jsx';
import { toast } from 'react-toastify'; // Import toast for notifications
import ExpenseRow from '../components/ExpenseRow.jsx';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Define API_BASE_URL here or pass as prop

const ExpensesPage = () => {
    const { accessToken } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch expenses (can be called to refresh list)
    const fetchExpenses = async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }
        setLoading(true); // Set loading true when fetching starts
        setError(null); // Clear previous errors
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setExpenses(data.results); // Assuming API returns { "results": [...], "count": ... }
            } else {
                const errorData = await response.json();
                setError(`Failed to fetch expenses: ${JSON.stringify(errorData)}`);
                toast.error(`Failed to fetch expenses: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
            toast.error(`Network error fetching expenses: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [accessToken]); // Re-fetch if accessToken changes

    if (loading) return <div className="text-center p-8 text-xl font-semibold text-gray-700">Loading expenses...</div>;
    if (error) return <div className="text-center p-8 text-xl font-semibold text-red-600">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4 font-inter">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Expenses Management</h1>

            {/* Add Expense Form */}
            <AddExpenseForm onExpenseAdded={fetchExpenses} /> {/* Pass fetchExpenses to refresh list */}

            {/* Expense List Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8 border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-800 p-6 pb-4">Your Expenses List</h2>
                {expenses.length === 0 ? (
                    <p className="text-gray-600 p-6">No expenses found. Add your first expense using the form above!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>{/* Removed whitespace here */}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (AED)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                     <ExpenseRow key={expense.expense_id} expense={expense} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpensesPage;
