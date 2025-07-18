// src/components/MultiSelectUnits.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid'; // Example icons, ensure you have @heroicons/react installed

// If you don't have @heroicons/react, you can install it: npm install @heroicons/react
// Or replace with simple SVG/text icons if you prefer not to install heroicons.

const MultiSelectUnits = ({ options, selectedValues, onChange, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleOptionClick = (value) => {
        const newSelectedValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value) // Deselect
            : [...selectedValues, value]; // Select
        onChange(newSelectedValues);
    };

    const displayValue = selectedValues.length > 0
        ? options.filter(opt => selectedValues.includes(opt.value)).map(opt => opt.label).join(', ')
        : placeholder;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className={`relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                onClick={handleToggle}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="block truncate">{displayValue}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
            </button>

            {isOpen && (
                <ul
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    tabIndex="-1"
                    role="listbox"
                    aria-labelledby="listbox-label"
                >
                    {options.length === 0 && !disabled ? (
                        <li className="text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9">
                            No options available.
                        </li>
                    ) : options.map((option) => (
                        <li
                            key={option.value}
                            className={`text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white ${selectedValues.includes(option.value) ? 'bg-indigo-100' : ''}`}
                            onClick={() => handleOptionClick(option.value)}
                            role="option"
                            aria-selected={selectedValues.includes(option.value)}
                        >
                            <span className={`block truncate ${selectedValues.includes(option.value) ? 'font-semibold' : 'font-normal'}`}>
                                {option.label}
                            </span>
                            {selectedValues.includes(option.value) && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MultiSelectUnits;
