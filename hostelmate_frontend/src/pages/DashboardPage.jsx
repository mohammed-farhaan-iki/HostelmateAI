// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area // Added AreaChart, Area
} from 'recharts';

// Import for PDF export (already installed)
// const { jsPDF } = await import('jspdf'); // These imports should be inside the function or useEffect
// const html2canvas = (await import('html2canvas')).default;


const API_BASE_URL = 'http://127.0.0.1:8000'; // Make sure this is correct

const DashboardPage = () => {
    const { accessToken } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [timePeriod, setTimePeriod] = useState('last_year'); // Default to last_year
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedBedspaceType, setSelectedBedspaceType] = useState('');
    const [selectedNationality, setSelectedNationality] = useState('');
    const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('');

    // What-If Sliders states
    const [expenseIncreasePercent, setExpenseIncreasePercent] = useState(0);
    const [occupancyImpactPercent, setOccupancyImpactPercent] = useState(0);
    const [priceChangePercent, setPriceChangePercent] = useState(0);

    // State for dropdown options (fetched from API or hardcoded if simple)
    const [properties, setProperties] = useState([]);
    const [bedspaceTypes, setBedspaceTypes] = useState([]);
    const [nationalities, setNationalities] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);

    // Helper to calculate start/end dates based on timePeriod
    const getDateRange = (period) => {
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (period) {
            case 'last_week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'last_month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'last_3_months':
                startDate.setMonth(today.getMonth() - 3);
                break;
            case 'last_6_months':
                startDate.setMonth(today.getMonth() - 6);
                break;
            case 'last_year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case 'custom':
                startDate = customStartDate ? new Date(customStartDate) : null;
                endDate = customEndDate ? new Date(customEndDate) : null;
                break;
            default:
                startDate.setFullYear(today.getFullYear() - 1); // Default to last year
                break;
        }
        return { startDate, endDate };
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!accessToken) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            const { startDate, endDate } = getDateRange(timePeriod);

            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('start_date', startDate.toISOString().split('T')[0]);
            if (endDate) queryParams.append('end_date', endDate.toISOString().split('T')[0]);
            if (selectedProperty) queryParams.append('property_id', selectedProperty);
            if (selectedBedspaceType) queryParams.append('bedspace_type', selectedBedspaceType);
            if (selectedNationality) queryParams.append('nationality', selectedNationality);
            if (selectedExpenseCategory) queryParams.append('expense_category', selectedExpenseCategory);

            // Add what-if parameters
            queryParams.append('expense_increase_percent', expenseIncreasePercent);
            queryParams.append('occupancy_impact_percent', occupancyImpactPercent);
            queryParams.append('price_change_percent', priceChangePercent);


            try {
                const response = await fetch(`${API_BASE_URL}/api/dashboard-kpis/?${queryParams.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setDashboardData(data);
                    console.log("Dashboard Data:", data); // Log the fetched data

                    // Populate filter options from backend data
                    if (data.charts_data) {
                         if (data.charts_data.revenue_by_property) {
                             const uniqueProperties = [...new Set(data.charts_data.revenue_by_property.map(item => item.property_name))];
                             setProperties(uniqueProperties.filter(name => name && name !== 'N/A')); // Exclude null/undefined/N/A
                         }
                         if (data.charts_data.occupancy_rate_by_bedspace_type) {
                             const uniqueBedspaceTypes = [...new Set(data.charts_data.occupancy_rate_by_bedspace_type.map(item => item.bedspace_type))];
                             setBedspaceTypes(uniqueBedspaceTypes.filter(type => type && type !== 'N/A'));
                         }
                         if (data.charts_data.top_nationalities) {
                             const uniqueNationalities = [...new Set(data.charts_data.top_nationalities.map(item => item.nationality))];
                             setNationalities(uniqueNationalities.filter(nat => nat && nat !== 'N/A'));
                         }
                         if (data.charts_data.expense_by_category) {
                             const uniqueCategories = [...new Set(data.charts_data.expense_by_category.map(item => item.category))];
                             setExpenseCategories(uniqueCategories.filter(cat => cat && cat !== 'N/A'));
                         }
                    }


                } else {
                    const errorText = await response.text();
                    console.error('Failed to fetch dashboard data:', response.status, errorText);
                    toast.error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
                    setError(`Failed to load dashboard data. Status: ${response.status}`);
                }
            } catch (err) {
                console.error('Network error fetching dashboard data:', err);
                toast.error(`Network error fetching dashboard data: ${err.message}`);
                setError(`Network error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [accessToken, timePeriod, customStartDate, customEndDate, selectedProperty, selectedBedspaceType, selectedNationality, selectedExpenseCategory, expenseIncreasePercent, occupancyImpactPercent, priceChangePercent]);


    if (loading) return <div className="text-center p-8 text-xl font-semibold text-gray-700">Loading dashboard...</div>;
    if (error) return <div className="text-center p-8 text-xl font-semibold text-red-600">Error: {error}</div>;

    // Ensure dashboardData and its top-level keys exist before destructing
    if (!dashboardData || !dashboardData.kpis || !dashboardData.charts_data || !dashboardData.what_if_analysis) {
        // This check ensures all main sections of the data are present
        return <div className="text-center p-8 text-xl font-semibold text-gray-500">
            No complete dashboard data available. Please ensure your backend is running and returning all expected data.
        </div>;
    }

    // Destructure KPIs for easier access
    const { kpis, charts_data, what_if_analysis } = dashboardData;

    // Recharts color palette for pie/donut charts
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

    // Function to handle PDF export
    const exportToPdf = async (elementId, filename) => {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const input = document.getElementById(elementId);
        if (!input) {
            toast.error(`Element with ID ${elementId} not found for PDF export.`);
            return;
        }

        const canvas = await html2canvas(input, { scale: 2 }); // Increase scale for better quality
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        pdf.save(filename);
        toast.success(`${filename} exported successfully!`);
    };

    return (
        <div className="container mx-auto p-4 font-inter">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Property Management Dashboard</h1>

            {/* Export All to PDF Button */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => exportToPdf('dashboard-content', 'Hostelmate_Dashboard_Full_Report.pdf')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
                >
                    Export Full Dashboard to PDF
                </button>
            </div>

            <div id="dashboard-content"> {/* Wrap entire dashboard for full export */}
                {/* Filters Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Time Period Filter */}
                        <div>
                            <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-700">Time Period:</label>
                            <select
                                id="timePeriod"
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="last_week">Last Week</option>
                                <option value="last_month">Last Month</option>
                                <option value="last_3_months">Last 3 Months</option>
                                <option value="last_6_months">Last 6 Months</option>
                                <option value="last_year">Last 1 Year</option>
                                <option value="custom">Custom Date Range</option>
                            </select>
                        </div>

                        {timePeriod === 'custom' && (
                            <>
                                <div>
                                    <label htmlFor="customStartDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
                                    <input
                                        type="date"
                                        id="customStartDate"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="customEndDate" className="block text-sm font-medium text-gray-700">End Date:</label>
                                    <input
                                        type="date"
                                        id="customEndDate"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                                    />
                                </div>
                            </>
                        )}

                        {/* Property ID Filter */}
                        <div>
                            <label htmlFor="propertyFilter" className="block text-sm font-medium text-gray-700">Property:</label>
                            <select
                                id="propertyFilter"
                                value={selectedProperty}
                                onChange={(e) => setSelectedProperty(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="">All Properties</option>
                                {properties.map(prop => (
                                    <option key={prop} value={prop}>{prop}</option>
                                ))}
                            </select>
                        </div>

                        {/* Bedspace Type Filter */}
                        <div>
                            <label htmlFor="bedspaceTypeFilter" className="block text-sm font-medium text-gray-700">Bedspace Type:</label>
                            <select
                                id="bedspaceTypeFilter"
                                value={selectedBedspaceType}
                                onChange={(e) => setSelectedBedspaceType(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="">All Bedspace Types</option>
                                {bedspaceTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Nationality Filter */}
                        <div>
                            <label htmlFor="nationalityFilter" className="block text-sm font-medium text-gray-700">Nationality:</label>
                            <select
                                id="nationalityFilter"
                                value={selectedNationality}
                                onChange={(e) => setSelectedNationality(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="">All Nationalities</option>
                                {nationalities.map(nat => (
                                    <option key={nat} value={nat}>{nat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Expense Category Filter */}
                        <div>
                            <label htmlFor="expenseCategoryFilter" className="block text-sm font-medium text-gray-700">Expense Category:</label>
                            <select
                                id="expenseCategoryFilter"
                                value={selectedExpenseCategory}
                                onChange={(e) => setSelectedExpenseCategory(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="">All Categories</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800">Key Metrics</h2>
                        <button
                            onClick={() => exportToPdf('kpi-cards-section', 'Hostelmate_KPI_Cards.pdf')}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-md transition duration-300 ease-in-out"
                        >
                            Export KPIs
                        </button>
                    </div>
                    <div id="kpi-cards-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* KPI Cards */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Properties</h3>
                            <p className="text-3xl font-bold text-indigo-600">{kpis.total_properties ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Units</h3>
                            <p className="text-3xl font-bold text-blue-600">{kpis.total_units ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Beds</h3>
                            <p className="text-3xl font-bold text-purple-600">{kpis.total_beds_in_system ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Occupied Beds (Current)</h3>
                            <p className="text-3xl font-bold text-green-600">{kpis.current_occupied_beds_count ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Vacant Beds</h3>
                            <p className="text-3xl font-bold text-red-600">{kpis.vacant_beds ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Occupancy Rate</h3>
                            <p className="text-3xl font-bold text-teal-600">{(kpis.current_occupancy_rate ?? 0).toFixed(2)}%</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Tenants</h3>
                            <p className="text-3xl font-bold text-orange-600">{kpis.total_tenants ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Actual Revenue</h3>
                            <p className="text-3xl font-bold text-green-700">AED {(kpis.actual_revenue ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Expenses</h3>
                            <p className="text-3xl font-bold text-red-700">AED {(kpis.total_expenses ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Operating Profit</h3>
                            <p className="text-3xl font-bold text-purple-700">AED { ((kpis.actual_revenue ?? 0) - (kpis.total_expenses ?? 0)).toFixed(2) }</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Profit Margin</h3>
                            <p className="text-3xl font-bold text-pink-600">{(kpis.profit_margin ?? 0).toFixed(2)}%</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Amount</h3>
                            <p className="text-3xl font-bold text-yellow-600">AED {(kpis.pending_amount ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">People Pending Rent</h3>
                            <p className="text-3xl font-bold text-yellow-700">{kpis.num_people_pending_rent ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">New Tenants This Month</h3>
                            <p className="text-3xl font-bold text-cyan-600">{kpis.new_tenants_this_month ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Bookings</h3>
                            <p className="text-3xl font-bold text-lime-600">{kpis.active_bookings_count ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg. Monthly Revenue/Bed</h3>
                            <p className="text-3xl font-bold text-emerald-600">AED {(kpis.avg_monthly_revenue_per_bed ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Break-Even Occupancy</h3>
                            <p className="text-3xl font-bold text-orange-500">{(kpis.break_even_occupancy ?? 0).toFixed(2)} Beds</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg. Price Per Bedspace</h3>
                            <p className="text-3xl font-bold text-violet-600">AED {(kpis.avg_price_per_bedspace ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Projected Future Revenue</h3>
                            <p className="text-3xl font-bold text-blue-500">AED {(kpis.projected_future_revenue ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Monthly Expected Revenue</h3>
                            <p className="text-3xl font-bold text-green-500">AED {(kpis.total_monthly_expected_revenue ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Fixed Monthly Expenses</h3>
                            <p className="text-3xl font-bold text-red-500">AED {(kpis.total_fixed_monthly_expenses ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Variable Monthly Expenses</h3>
                            <p className="text-3xl font-bold text-red-400">AED {(kpis.total_variable_monthly_expenses ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Number of Fully Paid Bookings</h3>
                            <p className="text-3xl font-bold text-green-400">{kpis.num_fully_paid_bookings ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">People Due Soon (5 days)</h3>
                            <p className="text-3xl font-bold text-amber-500">{kpis.num_people_due_soon ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">People Due (2 days)</h3>
                            <p className="text-3xl font-bold text-orange-500">{kpis.num_people_due ?? 0}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">People Overdue (Past Checkout)</h3>
                            <p className="text-3xl font-bold text-red-800">{kpis.num_people_overdue ?? 0}</p>
                        </div>
                    </div>
                </div>

                {/* What-If Analysis Section */}
                {/* Add conditional rendering for what_if_analysis */}
                {what_if_analysis && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">What-If Analysis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {/* Expense Increase Slider */}
                            <div>
                                <label htmlFor="expenseIncrease" className="block text-sm font-medium text-gray-700 mb-2">
                                    Expense Increase/Decrease: {expenseIncreasePercent}%
                                </label>
                                <input
                                    type="range"
                                    id="expenseIncrease"
                                    min="-30"
                                    max="30"
                                    value={expenseIncreasePercent}
                                    onChange={(e) => setExpenseIncreasePercent(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                                />
                                <p className="text-xl font-bold text-gray-900 mt-2">
                                    Impacted Profit Margin: {(what_if_analysis.profit_margin_with_expense_impact ?? 0).toFixed(2)}%
                                </p>
                            </div>

                            {/* Occupancy Impact Slider */}
                            <div>
                                <label htmlFor="occupancyImpact" className="block text-sm font-medium text-gray-700 mb-2">
                                    Occupancy Impact: {occupancyImpactPercent}%
                                </label>
                                <input
                                    type="range"
                                    id="occupancyImpact"
                                    min="-30"
                                    max="30"
                                    value={occupancyImpactPercent}
                                    onChange={(e) => setOccupancyImpactPercent(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                                />
                                <p className="text-xl font-bold text-gray-900 mt-2">
                                    Impacted Occupancy Rate: {(what_if_analysis.occupancy_rate_with_impact ?? 0).toFixed(2)}%
                                </p>
                            </div>

                            {/* Price Change Slider */}
                            <div>
                                <label htmlFor="priceChange" className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Change: {priceChangePercent}%
                                </label>
                                <input
                                    type="range"
                                    id="priceChange"
                                    min="-30"
                                    max="30"
                                    value={priceChangePercent}
                                    onChange={(e) => setPriceChangePercent(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                                />
                                <p className="text-xl font-bold text-gray-900 mt-2">
                                    Projected Revenue with Price Change: AED {(what_if_analysis.projected_revenue_with_price_change ?? 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Section */}
                {charts_data && ( // Add conditional rendering for charts_data
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-800">Analytical Charts</h2>
                            <button
                                onClick={() => exportToPdf('charts-section', 'Hostelmate_Charts_Report.pdf')}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-md transition duration-300 ease-in-out"
                            >
                                Export Charts
                            </button>
                        </div>
                        <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Monthly Revenue vs Expenses (Stacked Bar Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Revenue vs Expenses</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={charts_data.monthly_trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="revenue" stackId="a" fill="#82ca9d" name="Revenue" />
                                        <Bar dataKey="expenses" stackId="a" fill="#ff7300" name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Monthly Occupancy Rate (Line Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Occupancy Rate</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={charts_data.monthly_trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="occupancy_rate" stroke="#8884d8" name="Occupancy Rate (%)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Revenue by Property ID (Pie Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue by Property</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={charts_data.revenue_by_property}
                                            dataKey="revenue"
                                            nameKey="property_name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            label
                                        >
                                            {charts_data.revenue_by_property.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Expense Breakdown by Category (Bar Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Expense Breakdown by Category</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={charts_data.expense_by_category}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="category" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="amount" fill="#FF8042" name="Amount" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Top 10 Nationalities (Bar Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Nationalities</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={charts_data.top_nationalities}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="nationality" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="#00C49F" name="Count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Profit Margin by Sharing Type (Bar Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Profit Margin by Bedspace Type</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={charts_data.profit_margin_by_sharing_type}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="sharing_type" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="profit_margin" fill="#A28DFF" name="Profit Margin (%)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Occupancy share by Property (Donut Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Occupancy Share by Property</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={charts_data.occupancy_by_property}
                                            dataKey="occupancy_rate"
                                            nameKey="property_name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            label
                                        >
                                            {charts_data.occupancy_by_property.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Occupancy Rate by Bedspace Type (Bar Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Occupancy Rate by Bedspace Type</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={charts_data.occupancy_rate_by_bedspace_type}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="bedspace_type" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="occupancy_rate" fill="#FF6B6B" name="Occupancy Rate (%)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Net Profit Over Time (Area Chart) */}
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Net Profit Over Time</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={charts_data.monthly_trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        {/* Ensure 'profit' key exists in monthly_trends data */}
                                        <Area type="monotone" dataKey="profit" stroke="#82ca9d" fill="#82ca9d" name="Net Profit" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Placeholder for Detailed Tables Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Detailed Reports (Coming Soon)</h2>
                    <p className="text-gray-600">
                        Detailed tables for Tenants, Expenses, and Pending Payments will be available here,
                        fetched from dedicated, paginated API endpoints for optimal performance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;