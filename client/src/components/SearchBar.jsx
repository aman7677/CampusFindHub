// src/components/SearchBar.jsx
// Search input with 400ms debounce for live filtering

import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ onSearch, placeholder = 'Search lost & found items...' }) => {
  const [inputValue, setInputValue] = useState('');
  const debounceTimer = useRef(null);

  // ─── Debounce Logic ───────────────────────────────────────────────────────
  // Fires onSearch callback 400ms after the user stops typing
  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear previous timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Set new timer — calls onSearch after 400ms pause
    debounceTimer.current = setTimeout(() => {
      onSearch(value.trim());
    }, 400);
  };

  // Clear search
  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Input Field */}
      <input
        id="search-input"
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-900
                   placeholder-gray-400 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:border-transparent transition-all duration-200"
      />

      {/* Clear Button — shown when input has text */}
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
