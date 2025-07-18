// Example: src/components/ExpenseRow.jsx
import React from 'react';
import { toast } from 'react-toastify';

const ExpenseRow = React.memo(({ expense }) => {
    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">AED {expense.amount}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{expense.expense_date}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{expense.category || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{expense.property_name || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {expense.unit_numbers && expense.unit_numbers.length > 0 ? expense.unit_numbers.join(', ') : 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    onClick={() => toast.info("Edit functionality coming soon!")}
                >
                    Edit
                </button>
                <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => toast.info("Delete functionality coming soon!")}
                >
                    Delete
                </button>
            </td>
        </tr>
    );
});

export default ExpenseRow;

// Then in src/pages/ExpensesPage.jsx
// ...
// import ExpenseRow from '../components/ExpenseRow.jsx';
// ...
// <tbody className="bg-white divide-y divide-gray-200">
//     {expenses.map((expense) => (
//         <ExpenseRow key={expense.expense_id} expense={expense} />
//     ))}
// </tbody>
// ...