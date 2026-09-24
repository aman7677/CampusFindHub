// src/components/ItemCard.jsx
// Card component for displaying a lost or found item in the grid

import React from 'react';
import { Link } from 'react-router-dom';

// ─── Helper: Format Date ──────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Category Icons (SVG paths) ───────────────────────────────────────────────
const categoryIcons = {
  Electronics: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Books: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  'ID Card': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
    </svg>
  ),
  Keys: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  Bag: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Clothing: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21l4-8 4 8M7 21H3l4-8 4-4 4 4 4 8h-4" />
    </svg>
  ),
  Other: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
};

const ItemCard = ({ item }) => {
  const {
    _id,
    title,
    description,
    category,
    type,
    location,
    date,
    status,
    image,
    reportedBy,
  } = item;

  // Status badge class mapping
  const statusClass = {
    open: 'badge-open',
    matched: 'badge-matched',
    claimed: 'badge-claimed',
    closed: 'badge-closed',
  }[status] || 'badge-open';

  return (
    <div className="card group animate-fadeIn">
      {/* ─── Item Image ─────────────────────────────────────────────────────── */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Placeholder shown when no image or on error */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-gray-400 ${image ? 'hidden' : 'flex'}`}
          style={{ display: image ? 'none' : 'flex' }}
        >
          <svg className="w-12 h-12 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium opacity-60">No Image</span>
        </div>

        {/* Type badge (lost/found) — top right overlay */}
        <div className="absolute top-3 right-3">
          <span className={`badge text-xs font-bold uppercase tracking-wider shadow-sm ${type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
            {type === 'lost' ? '🔴 Lost' : '🟢 Found'}
          </span>
        </div>

        {/* Status chip — top left overlay */}
        <div className="absolute top-3 left-3">
          <span className={`${statusClass} shadow-sm`}>{status}</span>
        </div>
      </div>

      {/* ─── Card Body ──────────────────────────────────────────────────────── */}
      <div className="p-5">
        {/* Category badge */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-blue-500">{categoryIcons[category] || categoryIcons.Other}</span>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {category || 'Other'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-lg mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Description excerpt */}
        {description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{description}</p>
        )}

        {/* Location and Date */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(date)}</span>
          </div>
          {reportedBy?.name && (
            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate">{reportedBy.name}</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <Link
          to={`/items/${_id}`}
          id={`view-item-${_id}`}
          className="btn-primary w-full justify-center text-sm py-2.5"
        >
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default ItemCard;
