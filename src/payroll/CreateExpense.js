import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import '../pettycash/PettyCash.css';
import { useNavigate } from 'react-router-dom';
import { APP_SERVER_URL_PREFIX } from "../constants.js";

function CreateExpense() {
  const [form, setForm] = useState({ description: '', amount: '', employeeId: '', subtype: '' });
  const [subtypes, setSubtypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  useEffect(() => {
    let mounted = true;
    fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters`)
      .then(res => { if (!res.ok) throw new Error('no masters'); return res.json(); })
      .then(json => {
        const list = (json._embedded && json._embedded.expenseTypeMasters) || json._embedded || json || [];
        const vals = list.map(m => (m.subtype || m.subType)).filter(Boolean);
        const uniq = Array.from(new Set(vals));
        if (mounted) setSubtypes(uniq);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.description || !form.amount || !form.employeeId || (subtypes.length > 0 && !form.subtype)) { setError('Please fill required fields'); return; }
    setLoading(true);
    try {
      // derive createdBy info from localStorage if available
      let storedUser = null;
      try { storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (e) { storedUser = null; }
      const createdByUserId = storedUser && (storedUser.id || storedUser.userId) ? (storedUser.id || storedUser.userId) : null;
      const createdByUser = storedUser && (storedUser.name || storedUser.username || storedUser.email) ? (storedUser.name || storedUser.username || storedUser.email) : (localStorage.getItem('rememberedEmail') || '');
      const createdDate = new Date().toISOString().slice(0,10);
      const payload = { description: form.description, amount: Number(form.amount), employeeId: Number(form.employeeId), subtype: form.subtype, createdByUserId, createdByUser, createdDate };

      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
  if (!res.ok) throw new Error('failed');
  navigate('/pettycash/expenses');
    } catch (err) { setError('Failed to create expense'); } 
    finally { setLoading(false); }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Create Expense">
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange} required />
            </div>
            <div>
              <label>Amount</label>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
            </div>
            <div>
              <label>Expense Type</label>
              <select name="subtype" value={form.subtype} onChange={handleChange} required={subtypes.length>0}>
                <option value="">Select expense type</option>
                {subtypes.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Employee ID</label>
              <input name="employeeId" type="number" value={form.employeeId} onChange={handleChange} required />
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <button className="btn" type="submit" disabled={loading}>{loading? 'Saving...':'Create'}</button>
          </div>
        </form>
      </PageCard>
    </div>
  );
}

export default CreateExpense;
