import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ description:'', amount:'', employeeId:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`)
      .then(res => { if (!res.ok) throw new Error('fail'); return res.json(); })
      .then(json => setForm({ description: json.description || '', amount: json.amount || '', employeeId: json.employeeId || '' }))
      .catch(() => setError('Unable to load expense'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target; setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { description: form.description, amount: Number(form.amount) };
      if (form.employeeId) payload.employeeId = Number(form.employeeId);
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('failed');
      navigate(`/pettycash/expenses/${id}`);
    } catch (err) { setError('Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title={`Edit Expense ${id}`}>
        {error && <div style={{ color:'#c53030' }}>{error}</div>}
        {loading ? <div className="small">Loading...</div> : (
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
                <label>Employee ID (optional)</label>
                <input name="employeeId" type="number" value={form.employeeId} onChange={handleChange} />
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <button className="btn" type="submit" disabled={loading}>{loading? 'Saving...':'Save'}</button>
              <button className="btn" type="button" style={{ marginLeft:8 }} onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </form>
        )}
      </PageCard>
    </div>
  );
}

export default EditExpense;
