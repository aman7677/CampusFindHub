// src/components/ClaimModal.jsx
// Modal overlay for submitting a claim on a found item

import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ClaimModal = ({ item, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Prevent background scroll when modal is open ─────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // ─── Close on Escape key ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ─── Submit Claim ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/claims', {
        itemId: item._id,
        message,
      });

      console.log(`✅ Claim submitted for item: ${item.title}`);
      onSuccess(); // Notify parent to refresh/update UI
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit claim. Please try again.';
      setError(msg);
      console.error('❌ Claim submission error:', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ─── Modal Overlay ─────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        // Close when clicking backdrop (not modal content)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ─── Modal Panel ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submit a Claim</h2>
            <p className="text-sm text-gray-500 mt-0.5">Tell us why this item belongs to you</p>
          </div>
          <button
            onClick={onClose}
            id="close-claim-modal"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Item Info */}
        <div className="px-6 pt-4">
          <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Claiming Item</p>
              <p className="text-sm font-bold text-blue-900">{item.title}</p>
              <p className="text-xs text-blue-600 mt-0.5">📍 {item.location}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="claim-message" className="label">
              Describe why this is yours <span className="text-gray-400 font-normal">(optional but recommended)</span>
            </label>
            <textarea
              id="claim-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="E.g., The bag has my initials on the side, and there's a red keychain attached..."
              className="input resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">Providing details increases your chance of approval.</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              id="cancel-claim"
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-claim"
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? (
                <>
                  <div className="spinner w-4 h-4"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Claim
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimModal;
