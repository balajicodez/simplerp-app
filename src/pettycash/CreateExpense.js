import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import '../payroll/Payroll.css';
import { useNavigate } from 'react-router-dom';

const API_PREFIX = '/simplerp/api';

function CreateExpense() {
  const [form, setForm] = useState({ description: '', amount: '', employeeId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.description || !form.amount || !form.employeeId) { setError('Please fill required fields'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_PREFIX}/expenses`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ description: form.description, amount: Number(form.amount), employeeId: Number(form.employeeId) })
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
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange} required />
            </div>
            <div>
              <label>Amount</label>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
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

