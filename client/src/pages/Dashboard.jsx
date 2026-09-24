// src/pages/Dashboard.jsx
// Protected dashboard: My Reports | My Claims | Incoming Claims (approve/reject)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const Badge = ({ type, value }) => {
  const statusClasses = {
    open: 'badge-open',
    matched: 'badge-matched',
    claimed: 'badge-claimed',
    closed: 'badge-closed',
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  };
  const typeClasses = { lost: 'badge-lost', found: 'badge-found' };
  const className =
    type === 'type' ? typeClasses[value] || 'badge' : statusClasses[value] || 'badge';
  return <span className={className}>{value}</span>;
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Placeholder thumbnail ─────────────────────────────────────────────────────
const Thumbnail = ({ src, alt }) => (
  <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-300">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('reports');

  // Data
  const [myItems, setMyItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [incomingClaims, setIncomingClaims] = useState([]); // claims ON my found items
  const [incomingInsights, setIncomingInsights] = useState([]); // information ON my lost items

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [actioningClaimId, setActioningClaimId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [error, setError] = useState('');

  // ─── Fetch My Items ─────────────────────────────────────────────────────────
  const fetchMyItems = async () => {
    const res = await api.get('/items');
    const mine = res.data.filter(
      (item) => item.reportedBy?._id === user.id || item.reportedBy === user.id
    );
    setMyItems(mine);
    return mine;
  };

  // ─── Fetch All Claims on My Items (Incoming) ────────────────────────────────
  const fetchIncomingClaims = async (myItemsList) => {
    try {
      const foundItems = myItemsList.filter((i) => i.type === 'found');
      if (foundItems.length === 0) {
        setIncomingClaims([]);
        return;
      }

      // Fetch claims for all found items in parallel
      const results = await Promise.all(
        foundItems.map((item) =>
          api
            .get(`/claims/item/${item._id}`)
            .then((r) => r.data)
            .catch(() => []) // Silently skip if endpoint fails
        )
      );

      const all = results.flat();
      setIncomingClaims(all);
    } catch (err) {
      console.error('❌ Fetch incoming claims error:', err.message);
      setIncomingClaims([]);
    }
  };

  // ─── Fetch My Claims (claims I submitted) ───────────────────────────────────
  const fetchMyClaims = async () => {
    const res = await api.get('/claims/my');
    setMyClaims(res.data);
  };

  const fetchIncomingInsights = async () => {
    const res = await api.get('/insights/incoming');
    setIncomingInsights(res.data);
  };

  // Load all on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mine] = await Promise.all([fetchMyItems(), fetchMyClaims(), fetchIncomingInsights()]);
        await fetchIncomingClaims(mine);
      } catch (err) {
        console.error('Dashboard load error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Delete My Item ──────────────────────────────────────────────────────────
  const handleDelete = async (itemId, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setDeletingId(itemId);
    try {
      await api.delete(`/items/${itemId}`);
      setMyItems((p) => p.filter((i) => i._id !== itemId));
      console.log(`🗑️ Deleted: ${title}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Toggle Item Status (Open / Closed) ─────────────────────────────────────
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'closed' ? 'open' : 'closed';
    setUpdatingStatusId(item._id);
    setError('');
    try {
      await api.patch(`/items/${item._id}/status`, { status: newStatus });
      console.log(`🔄 Item "${item.title}" status changed to ${newStatus}`);
      setMyItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ─── Approve / Reject Incoming Claim ────────────────────────────────────────
  const handleClaimAction = async (claimId, status) => {
    setActioningClaimId(claimId);
    setError('');
    try {
      await api.put(`/claims/${claimId}`, { status });
      console.log(`✅ Claim ${status}: ${claimId}`);

      // Update local state — change claim status and refresh items
      setIncomingClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status } : c))
      );

      // If approved, update item status in myItems too
      if (status === 'approved') {
        const claim = incomingClaims.find((c) => c._id === claimId);
        if (claim) {
          setMyItems((prev) =>
            prev.map((i) =>
              i._id === (claim.item?._id || claim.item) ? { ...i, status: 'claimed' } : i
            )
          );
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActioningClaimId(null);
    }
  };

  // Pending incoming claims count (for badge alert)
  const pendingCount = incomingClaims.filter((c) => c.status === 'pending').length;

  const tabs = [
    { id: 'reports', label: 'My Reports', count: myItems.length },
    { id: 'claims', label: 'My Claims', count: myClaims.length },
    { id: 'incoming', label: 'Incoming Claims', count: pendingCount, alert: pendingCount > 0 },
    { id: 'insights', label: 'Item Insights', count: incomingInsights.length, alert: incomingInsights.length > 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-main">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title">My Dashboard</h1>
            <p className="text-gray-500">
              Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span> 👋
            </p>
          </div>
          <Link to="/report" className="btn-primary self-start sm:self-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Report New Item
          </Link>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Items Reported', value: myItems.length, icon: '📦' },
            { label: 'Open Reports', value: myItems.filter((i) => i.status === 'open').length, icon: '🔍' },
            { label: 'Claimed / Closed', value: myItems.filter((i) => i.status === 'claimed' || i.status === 'closed').length, icon: '✅' },
            { label: 'Helpful Insights', value: incomingInsights.length, icon: '💡', highlight: incomingInsights.length > 0 },
          ].map(({ label, value, icon, highlight }) => (
            <div
              key={label}
              className={`rounded-2xl p-5 border shadow-sm ${
                highlight
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <div className={`text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>
                {value}
              </div>
              <div className="text-sm text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs Card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map(({ id, label, count, alert }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`flex-1 min-w-max py-4 px-5 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    alert
                      ? 'bg-orange-100 text-orange-700 animate-pulse'
                      : activeTab === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
                <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="spinner w-8 h-8"></div>
                <span className="text-gray-400 font-medium">Loading...</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 1 — My Reports
            ══════════════════════════════════════════════════════════════ */}
            {!loading && activeTab === 'reports' && (
              <>
                {myItems.length === 0 ? (
                  <EmptyState
                    icon="📦"
                    title="No reports yet"
                    desc="You haven't reported any lost or found items."
                    action={<Link to="/report" className="btn-primary text-sm">Report First Item</Link>}
                  />
                ) : (
                  <div className="space-y-3">
                    {myItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <Thumbnail src={item.image} alt={item.title} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                              <Badge type="type" value={item.type} />
                              <Badge type="status" value={item.status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                              <span>📍 {item.location}</span>
                              <span>📅 {formatDate(item.date)}</span>
                              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          {/* Close / Reopen button */}
                          {item.status !== 'claimed' && (
                            <button
                              onClick={() => handleToggleStatus(item)}
                              id={`toggle-status-${item._id}`}
                              disabled={updatingStatusId === item._id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 active:scale-95 ${
                                item.status === 'closed'
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                              title={item.status === 'closed' ? 'Reopen this report' : (item.type === 'lost' ? 'Mark as Found (Close Report)' : 'Close Report')}
                            >
                              {updatingStatusId === item._id ? (
                                <div className="spinner w-3.5 h-3.5"></div>
                              ) : item.status === 'closed' ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Reopen</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>{item.type === 'lost' ? 'Found / Close' : 'Close'}</span>
                                </>
                              )}
                            </button>
                          )}

                          <Link to={`/items/${item._id}`} id={`view-report-${item._id}`}
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="View">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>

                          <button onClick={() => handleDelete(item._id, item.title)}
                            id={`delete-report-${item._id}`}
                            disabled={deletingId === item._id}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50" title="Delete">
                            {deletingId === item._id
                              ? <div className="spinner w-4 h-4"></div>
                              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 2 — My Claims (claims I submitted on others' items)
            ══════════════════════════════════════════════════════════════ */}
            {!loading && activeTab === 'claims' && (
              <>
                {myClaims.length === 0 ? (
                  <EmptyState
                    icon="📋"
                    title="No claims yet"
                    desc="You haven't claimed any found items yet."
                    action={<Link to="/" className="btn-primary text-sm">Browse Found Items</Link>}
                  />
                ) : (
                  <div className="space-y-3">
                    {myClaims.map((claim) => (
                      <div key={claim._id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                        <Thumbnail src={claim.item?.image} alt={claim.item?.title} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {claim.item?.title || 'Unknown Item'}
                            </h3>
                            <Badge type="status" value={claim.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span>Submitted: {formatDate(claim.createdAt)}</span>
                            {claim.item?.location && <span>📍 {claim.item.location}</span>}
                          </div>
                          {claim.message && (
                            <p className="text-xs text-gray-500 mt-1 italic">"{claim.message}"</p>
                          )}

                          {/* Status info message */}
                          <div className="mt-2">
                            {claim.status === 'pending' && (
                              <p className="text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg inline-block">
                                ⏳ Waiting for item owner to approve/reject
                              </p>
                            )}
                            {claim.status === 'approved' && (
                              <p className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-lg inline-block">
                                ✅ Approved! Contact the item owner to collect.
                              </p>
                            )}
                            {claim.status === 'rejected' && (
                              <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-lg inline-block">
                                ❌ Your claim was rejected.
                              </p>
                            )}
                          </div>
                        </div>
                        {claim.item?._id && (
                          <Link to={`/items/${claim.item._id}`} id={`view-claim-item-${claim._id}`}
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="View Item">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 3 — Incoming Claims (people claiming MY found items)
            ══════════════════════════════════════════════════════════════ */}
            {!loading && activeTab === 'incoming' && (
              <>
                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">How to approve a claim</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Someone found an item you reported as "Found". Review their claim message and approve if it belongs to them, or reject if not.
                    </p>
                  </div>
                </div>

                {incomingClaims.length === 0 ? (
                  <EmptyState
                    icon="🔔"
                    title="No incoming claims"
                    desc="Nobody has claimed your found items yet."
                    action={null}
                  />
                ) : (
                  <div className="space-y-4">
                    {incomingClaims.map((claim) => (
                      <div key={claim._id}
                        className={`p-5 rounded-xl border-2 transition-all ${
                          claim.status === 'pending'
                            ? 'border-orange-200 bg-orange-50/30'
                            : claim.status === 'approved'
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-gray-100 bg-gray-50/30'
                        }`}>
                        <div className="flex items-start gap-4">
                          <Thumbnail src={claim.item?.image} alt={claim.item?.title} />

                          <div className="flex-1 min-w-0">
                            {/* Item title */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Item:</p>
                              <Link to={`/items/${claim.item?._id}`}
                                className="text-sm font-bold text-blue-600 hover:underline truncate">
                                {claim.item?.title || 'Unknown Item'}
                              </Link>
                            </div>

                            {/* Claimant info */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {claim.claimedBy?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {claim.claimedBy?.name || 'Unknown User'}
                                </p>
                                <p className="text-xs text-gray-400">{claim.claimedBy?.email}</p>
                              </div>
                              <Badge type="status" value={claim.status} />
                            </div>

                            {/* Claim message */}
                            {claim.message ? (
                              <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Their message:</p>
                                <p className="text-sm text-gray-700 italic">"{claim.message}"</p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic mb-3">No message provided.</p>
                            )}

                            <p className="text-xs text-gray-400 mb-3">
                              Submitted: {formatDate(claim.createdAt)}
                            </p>

                            {/* ── Approve / Reject buttons (only for pending) ── */}
                            {claim.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  id={`approve-claim-${claim._id}`}
                                  onClick={() => handleClaimAction(claim._id, 'approved')}
                                  disabled={actioningClaimId === claim._id}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-95"
                                >
                                  {actioningClaimId === claim._id ? (
                                    <div className="spinner w-4 h-4"></div>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  Approve
                                </button>
                                <button
                                  id={`reject-claim-${claim._id}`}
                                  onClick={() => handleClaimAction(claim._id, 'rejected')}
                                  disabled={actioningClaimId === claim._id}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-95"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Reject
                                </button>
                              </div>
                            )}

                            {/* Already actioned state */}
                            {claim.status === 'approved' && (
                              <p className="text-sm text-green-700 font-semibold flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                You approved this claim — item marked as claimed.
                              </p>
                            )}
                            {claim.status === 'rejected' && (
                              <p className="text-sm text-red-600 font-semibold flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                You rejected this claim.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!loading && activeTab === 'insights' && (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-blue-800">Information about your lost reports</p>
                  <p className="text-xs text-blue-600 mt-0.5">Community members can share where they saw or found an item. Use their contact details to follow up safely.</p>
                </div>
                {incomingInsights.length === 0 ? (
                  <EmptyState icon="💡" title="No insights yet" desc="When someone sees one of your lost items, their information will appear here." action={null} />
                ) : (
                  <div className="space-y-4">
                    {incomingInsights.map((insight) => (
                      <div key={insight._id} className="p-5 rounded-xl border border-blue-100 bg-blue-50/30">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold">
                            {insight.sharedBy?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-gray-900">{insight.item?.title || 'Lost item'}</p>
                              {insight.item?._id && <Link to={`/items/${insight.item._id}`} className="text-xs text-blue-600 hover:underline">View report</Link>}
                            </div>
                            <p className="text-sm text-gray-700 mt-3">“{insight.message}”</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-3">
                              <span>📍 {insight.location}</span>
                              <span>📅 Seen {formatDate(insight.seenAt)}</span>
                              <span>Shared by {insight.sharedBy?.name || 'Campus member'}{insight.sharedBy?.email ? ` · ${insight.sharedBy.email}` : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Empty State Helper ────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, desc, action }) => (
  <div className="text-center py-16">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-gray-700 mb-2">{title}</h3>
    <p className="text-gray-400 mb-5 text-sm">{desc}</p>
    {action}
  </div>
);

export default Dashboard;
