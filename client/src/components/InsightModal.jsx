// Modal for sharing helpful information about an open lost-item report.

import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const InsightModal = ({ item, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    location: '',
    seenAt: new Date().toISOString().split('T')[0],
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/insights', { itemId: item._id, ...form });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not share your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Share information</h2>
            <p className="text-sm text-gray-500 mt-0.5">Help locate “{item.title}”</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" aria-label="Close insight form">✕</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label htmlFor="insight-location" className="label">Where did you see or find it?</label>
            <input id="insight-location" required maxLength={200} className="input" placeholder="e.g. Library entrance, Block B" value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </div>
          <div>
            <label htmlFor="insight-date" className="label">When?</label>
            <input id="insight-date" required type="date" max={new Date().toISOString().split('T')[0]} className="input" value={form.seenAt}
              onChange={(event) => setForm({ ...form, seenAt: event.target.value })} />
          </div>
          <div>
            <label htmlFor="insight-message" className="label">What do you know?</label>
            <textarea id="insight-message" required maxLength={1000} rows={4} className="input resize-none" placeholder="Describe what you saw, where the item is now, or how to find it." value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })} />
          </div>
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Sending…' : 'Share information'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InsightModal;
