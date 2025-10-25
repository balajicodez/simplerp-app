import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate } from 'react-router-dom';

function CreateDayClosing() {
  const [description, setDescription] = useState('Day Closing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Get current user from localStorage (adjust key as needed)
  const currentUser = localStorage.getItem('username') || localStorage.getItem('user') || '';
  // Get today's date from expense records (use local date)
  const closingDate = new Date().toISOString().slice(0, 10);
  // Get current time
  const createdTime = new Date().toISOString();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Defensive: ensure description is not null or undefined
      const desc = typeof description === 'string' && description.trim() ? description.trim() : 'Day Closing';
      const payload = {
        closingDate,
        description: desc,
        createdBy: currentUser,
        createdTime
      };
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed');
      setSuccess('Day closing created!');
      setTimeout(() => navigate('/pettycash/day-closing'), 1200);
    } catch (e) {
      setError('Failed to create day closing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Create Day Closing">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ minWidth: 100 }}>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="form-control" style={{ flex: 1 }} />
            <button className="btn" type="submit" disabled={loading} style={{ marginLeft: 16, minWidth: 180 }}>{loading ? 'Saving...' : 'Create Day Closing'}</button>
          </div>
        </form>
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        {success && <div style={{ color: '#2563eb' }}>{success}</div>}
      </PageCard>
    </div>
  );
}

export default CreateDayClosing;
