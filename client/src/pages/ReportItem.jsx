// src/pages/ReportItem.jsx
// Protected page for reporting a lost or found item

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Electronics', 'Books', 'ID Card', 'Keys', 'Bag', 'Clothing', 'Other'];

const ReportItem = () => {
  const navigate = useNavigate();
  const { isAuth } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    type: 'lost',
    location: '',
    date: new Date().toISOString().split('T')[0], // Today's date as default
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        // Only include image if URL is provided
        image: formData.image.trim() || null,
      };

      const response = await api.post('/items', payload);
      console.log(`✅ Item reported: "${response.data.title}"`);

      setSuccess(true);

      // Redirect to item detail page after short delay
      setTimeout(() => {
        navigate(`/items/${response.data._id}`);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to report item.';
      setError(msg);
      console.error('❌ Report item error:', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-main max-w-2xl">
        {/* ─── Page Header ────────────────────────────────────────────────── */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="page-title">Report an Item</h1>
          <p className="text-gray-500">Fill in the details about the item you lost or found on campus.</p>
        </div>

        {/* ─── Success State ───────────────────────────────────────────────── */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center gap-4 animate-scaleIn">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-green-800">Item reported successfully!</p>
              <p className="text-green-600 text-sm">Redirecting to item page...</p>
            </div>
          </div>
        )}

        {/* ─── Form Card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          {/* Error alert */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="report-item-form">
            {/* Type Toggle — Lost or Found */}
            <div>
              <label className="label">Item Type *</label>
              <div className="flex gap-3">
                {[
                  { value: 'lost', label: '🔴 I Lost This', desc: 'You are looking for this item' },
                  { value: 'found', label: '🟢 I Found This', desc: 'You found this and want to return it' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    id={`type-${value}`}
                    onClick={() => setFormData({ ...formData, type: value })}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.type === value
                        ? value === 'lost'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="item-title" className="label">Item Title *</label>
              <input
                id="item-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Black Dell Laptop, Blue Backpack..."
                className="input"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="item-category" className="label">Category</label>
              <select
                id="item-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="item-description" className="label">Description</label>
              <textarea
                id="item-description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the item — color, brand, distinguishing features..."
                className="input resize-none"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="item-location" className="label">Location *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  id="item-location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Library 2nd Floor, Cafeteria, Block B Room 205..."
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="item-date" className="label">Date Lost/Found *</label>
              <input
                id="item-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="item-image" className="label">
                Image URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="item-image"
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1.5">Paste a direct image URL. A photo helps others identify the item.</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-report"
                disabled={loading || success}
                className="btn-primary flex-1 justify-center"
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Report Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportItem;
