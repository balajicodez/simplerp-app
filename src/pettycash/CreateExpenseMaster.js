import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { useNavigate } from 'react-router-dom';
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function CreateExpenseMaster() {
  const [form, setForm] = useState({ description: '', type: '', subtype: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.description || !form.type) { setError('Description and Type are required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed');
      navigate('/pettycash/masters');
    } catch (err) {
      setError('Failed to create master');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Create Expense Type Master">
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange} required />
            </div>
            <div>
              <label>Type</label>
              <input name="type" value={form.type} onChange={handleChange} required />
            </div>
            <div>
              <label>Subtype</label>
              <input name="subtype" value={form.subtype} onChange={handleChange} />
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
      </PageCard>
    </div>
  );
}

export default CreateExpenseMaster;
