// src/pages/Home.jsx
// Main landing page with hero, search, filters, and items grid

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';

// Available categories matching the backend enum
const CATEGORIES = ['Electronics', 'Books', 'ID Card', 'Keys', 'Bag', 'Clothing', 'Other'];

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // ─── Fetch Items ──────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Build query params from filter state
      const params = {};
      if (search) params.search = search;
      if (selectedType) params.type = selectedType;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const response = await api.get('/items', { params });
      setItems(response.data);
      console.log(`📋 Loaded ${response.data.length} items`);
    } catch (err) {
      setError('Failed to load items. Please try again.');
      console.error('❌ Fetch items error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedCategory, selectedStatus]);

  // Re-fetch whenever any filter changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Stats derived from current items ────────────────────────────────────
  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;
  const openCount = items.filter((i) => i.status === 'open').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Hero Section ───────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container-main py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Campus Lost & Found System
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Lost Something on Campus?
              <br />
              <span className="text-yellow-300">We'll Help You Find It.</span>
            </h1>

            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Browse reported lost and found items. Report what you've lost or found on campus — connecting students and staff.
            </p>

            {/* Search Bar */}
            <div className="flex justify-center">
              <SearchBar onSearch={setSearch} placeholder="Search by title or description..." />
            </div>

            {/* Stats Row */}
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{lostCount}</div>
                <div className="text-blue-200 text-sm">Lost Items</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">{foundCount}</div>
                <div className="text-blue-200 text-sm">Found Items</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">{openCount}</div>
                <div className="text-blue-200 text-sm">Still Open</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filter Row ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-40">
        <div className="container-main py-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type:</label>
              <div className="flex gap-1">
                {[
                  { label: 'All', value: '' },
                  { label: '🔴 Lost', value: 'lost' },
                  { label: '🟢 Found', value: 'found' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    id={`filter-type-${value || 'all'}`}
                    onClick={() => setSelectedType(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedType === value
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="category-filter" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category:</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="status-filter" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status:</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="matched">Matched</option>
                <option value="claimed">Claimed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Active filter count */}
            {(selectedType || selectedCategory || selectedStatus || search) && (
              <button
                onClick={() => {
                  setSelectedType('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setSearch('');
                }}
                className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Items Grid ─────────────────────────────────────────────────────── */}
      <section className="container-main py-10">
        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Showing <span className="text-blue-600 font-bold">{items.length}</span> item{items.length !== 1 ? 's' : ''}
            {search && <span> for "<em>{search}</em>"</span>}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="spinner w-10 h-10"></div>
            <p className="text-gray-400 text-sm font-medium">Loading items...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">{error}</p>
            <button onClick={fetchItems} className="btn-primary text-sm">Try Again</button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-700">No items found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Items Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
