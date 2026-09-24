// src/pages/ItemDetail.jsx
// Full detail view for a single lost/found item with claim functionality

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ClaimModal from '../components/ClaimModal';
import InsightModal from '../components/InsightModal';

// Format date helper
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// Status badge helper
const StatusBadge = ({ status }) => {
  const classes = {
    open: 'badge-open',
    matched: 'badge-matched',
    claimed: 'badge-claimed',
    closed: 'badge-closed',
  };
  return <span className={`${classes[status] || 'badge-open'} text-sm`}>{status}</span>;
};

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuth } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [userClaim, setUserClaim] = useState(null); // Current user's claim on this item
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [insightSuccess, setInsightSuccess] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ─── Fetch Item Details ───────────────────────────────────────────────────
  const fetchItem = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/items/${id}`);
      setItem(response.data);
    } catch (err) {
      setError('Item not found or failed to load.');
      console.error('❌ Fetch item detail error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch Current User's Claim on This Item ──────────────────────────────
  const fetchUserClaim = async () => {
    if (!isAuth) return;
    try {
      const response = await api.get('/claims/my');
      const found = response.data.find((c) => c.item?._id === id || c.item === id);
      setUserClaim(found || null);
    } catch (err) {
      // Silently fail — not critical
      console.warn('Could not fetch user claims:', err.message);
    }
  };

  useEffect(() => {
    fetchItem();
    fetchUserClaim();
  }, [id]);

  // ─── Handle Successful Claim Submission ───────────────────────────────────
  const handleClaimSuccess = () => {
    setShowClaimModal(false);
    setClaimSuccess(true);
    fetchUserClaim();
    // Re-fetch item to get updated status
    fetchItem();
  };

  // ─── Toggle Item Status (Open / Closed) ─────────────────────────────────────
  const handleToggleStatus = async () => {
    if (!item) return;
    const newStatus = item.status === 'closed' ? 'open' : 'closed';
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/items/${item._id}/status`, { status: newStatus });
      setItem(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Determine if actions should be shown
  const isOwner = user && item && (item.reportedBy?._id === user.id || item.reportedBy === user.id);
  const canClaim = isAuth && item && item.type === 'found' && !isOwner && item.status === 'open';
  const canShareInsight = isAuth && item && item.type === 'lost' && !isOwner && item.status === 'open';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner w-12 h-12"></div>
          <p className="text-gray-400 font-medium">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Item Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-main max-w-4xl">
        {/* ─── Back Button ────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to items
        </button>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-fadeIn">
          {/* ─── Image Section ───────────────────────────────────────────── */}
          <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">No image provided</p>
              </div>
            )}

            {/* Type badge overlay */}
            <div className="absolute top-4 left-4">
              <span className={`badge text-sm font-bold uppercase tracking-wider shadow ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                {item.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
              </span>
            </div>

            {/* Status badge overlay */}
            <div className="absolute top-4 right-4">
              <StatusBadge status={item.status} />
            </div>
          </div>

          {/* ─── Content ─────────────────────────────────────────────────── */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Info */}
              <div className="flex-1">
                <div className="mb-1">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-4">{item.title}</h1>

                {item.description && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h2>
                    <p className="text-gray-700 leading-relaxed">{item.description}</p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Location</p>
                    <div className="flex items-center gap-2 text-gray-800 font-medium">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.location}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</p>
                    <div className="flex items-center gap-2 text-gray-800 font-medium">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(item.date)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Reported By</p>
                    <div className="flex items-center gap-2 text-gray-800 font-medium">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {item.reportedBy?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>

              {/* ─── Action Panel ─────────────────────────────────────────── */}
              <div className="lg:w-72">
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-gray-900">Actions</h3>

                  {/* Closed report banner */}
                  {item.status === 'closed' && (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm text-slate-800 font-semibold">🔒 This report is closed</p>
                      <p className="text-xs text-slate-600 mt-1">This report has been marked as resolved/recovered.</p>
                    </div>
                  )}

                  {/* Item already claimed */}
                  {item.status === 'claimed' && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <p className="text-sm text-green-700 font-semibold">✅ This item has been claimed.</p>
                    </div>
                  )}

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="space-y-3">
                      {item.status !== 'claimed' && (
                        <button
                          id="owner-toggle-status-btn"
                          onClick={handleToggleStatus}
                          disabled={updatingStatus}
                          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95 ${
                            item.status === 'closed'
                              ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {updatingStatus ? (
                            <div className="spinner w-4 h-4"></div>
                          ) : item.status === 'closed' ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reopen Report
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {item.type === 'lost' ? 'Mark as Found (Close)' : 'Close Report'}
                            </>
                          )}
                        </button>
                      )}

                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-xs text-blue-700 font-semibold">📋 You reported this item</p>
                        <Link to="/dashboard" className="text-xs text-blue-500 hover:underline mt-1 block">
                          Manage in Dashboard →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Claim Success Message */}
                  {claimSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fadeIn">
                      <div className="flex items-center gap-2 text-green-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold text-sm">Claim submitted!</span>
                      </div>
                      <p className="text-green-600 text-xs mt-1">The item owner will review your claim.</p>
                    </div>
                  )}

                  {/* Existing claim status */}
                  {userClaim && !claimSuccess && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Your Claim Status</p>
                      <span className={`badge-${userClaim.status}`}>
                        {userClaim.status.charAt(0).toUpperCase() + userClaim.status.slice(1)}
                      </span>
                      {userClaim.message && (
                        <p className="text-xs text-blue-600 mt-2 italic">"{userClaim.message}"</p>
                      )}
                    </div>
                  )}

                  {/* Claim Button — shown only for found items, logged-in non-owners */}
                  {canClaim && !userClaim && !claimSuccess && (
                    <button
                      id="open-claim-modal"
                      onClick={() => setShowClaimModal(true)}
                      className="btn-primary w-full justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Claim This Item
                    </button>
                  )}

                  {/* Share insight button */}
                  {canShareInsight && !insightSuccess && (
                    <button
                      id="open-insight-modal"
                      onClick={() => setShowInsightModal(true)}
                      className="btn-primary w-full justify-center"
                    >
                      💡 I have information
                    </button>
                  )}

                  {insightSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-700 font-semibold">Thanks — your information was sent to the reporter.</p>
                    </div>
                  )}

                  {/* Not logged in prompt */}
                  {!isAuth && item.type === 'found' && item.status === 'open' && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 mb-2 font-medium">Want to claim this item?</p>
                      <Link to="/login" className="btn-primary w-full justify-center text-sm py-2">
                        Sign in to Claim
                      </Link>
                    </div>
                  )}

                  {!isAuth && item.type === 'lost' && item.status === 'open' && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 mb-2 font-medium">Have you seen this item?</p>
                      <Link to="/login" className="btn-primary w-full justify-center text-sm py-2">Sign in to share information</Link>
                    </div>
                  )}

                  {/* Report date */}
                  <p className="text-xs text-gray-400 text-center">
                    Reported on {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Claim Modal ──────────────────────────────────────────────────── */}
      {showClaimModal && (
        <ClaimModal
          item={item}
          onClose={() => setShowClaimModal(false)}
          onSuccess={handleClaimSuccess}
        />
      )}
      {showInsightModal && (
        <InsightModal
          item={item}
          onClose={() => setShowInsightModal(false)}
          onSuccess={() => { setShowInsightModal(false); setInsightSuccess(true); }}
        />
      )}
    </div>
  );
};

export default ItemDetail;
