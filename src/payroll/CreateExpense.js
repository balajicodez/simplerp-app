import React, { useState, useEffect } from 'react';
import Sidebar from '../_components/sidebar/Sidebar';
import PageCard from '../_components/PageCard';
import '../pettycash/PettyCash.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_SERVER_URL_PREFIX } from "../constants.js";

function CreateExpense() {
  const [form, setForm] = useState({ description: '', amount: '', employeeId: '', subtype: '', type: '', expenseDate: '', referenceNumber: '', file: null });
  const [subtypes, setSubtypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm((f) => ({ ...f, file: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  useEffect(() => {
    let mounted = true;
    fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters?page=0&size=1000`)
      .then(res => {
        if (!res.ok) throw new Error('no masters');
        return res.json();
      })
      .then(json => {
        const list = (json._embedded && json._embedded.expenseTypeMasters) || json._embedded || json || [];
        // Check for ?type= in query string
        const params = new URLSearchParams(location.search);
        let filterType = params.get('type');
        if (!filterType) {
          if (location.pathname.includes('expenses-inward')) filterType = 'CASH-IN';
          if (location.pathname.includes('expenses-outward')) filterType = 'CASH-OUT';
        }
        // Set form.type based on filterType
        setForm(f => ({ ...f, type: filterType || '' }));
        const vals = list
          .filter(m => !filterType || m.type === filterType)
          .map(m => (m.subtype || m.subType)).filter(Boolean);
        const uniq = Array.from(new Set(vals));
        if (mounted) setSubtypes(uniq);
      })
      .catch(() => {
        // ignore failures — dropdown will be empty
      });
    return () => { mounted = false; };
  }, [location.pathname, location.search]);

  const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDate());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.description || !form.amount || (subtypes.length>0 && !form.subtype)) { setError('Please fill required fields'); return; }
    setLoading(true);
    try {
      let storedUser = null;
      try { storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (e) { storedUser = null; }
      const createdByUserId = storedUser && (storedUser.id || storedUser.userId) ? (storedUser.id || storedUser.userId) : null;
      const createdByUser = storedUser && (storedUser.name || storedUser.username || storedUser.email) ? (storedUser.name || storedUser.username || storedUser.email) : (localStorage.getItem('rememberedEmail') || '');
      const createdDate = getLocalDate();

      const expensePayload = {
        description: form.description,
        amount: Number(form.amount),
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        expenseSubType: form.subtype,
        expenseType: form.type,
        createdByUserId,
        createdByUser,
        createdDate,
        expenseDate: form.expenseDate || undefined,
        referenceNumber: form.referenceNumber || undefined
      };

      const formData = new FormData();
      formData.append('expense', new Blob([JSON.stringify(expensePayload)], { type: 'application/json' }));
      if (form.file) formData.append('file', form.file);
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('failed');
      navigate('/pettycash/expenses');
    } catch (err) { setError('Failed to create expense'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
  <PageCard title={location.pathname.includes('expenses-inward') || location.search.includes('type=CASH-IN') ? 'Create Expense - Inward' : location.pathname.includes('expenses-outward') || location.search.includes('type=CASH-OUT') ? 'Create Expense - Outward' : 'Create Expense'}>
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        <form onSubmit={handleSubmit} encType="multipart/form-data">
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
              <input name="employeeId" type="number" value={form.employeeId} onChange={handleChange} />
            </div>
            <div>
              <label>Expense Date</label>
              <input name="expenseDate" type="date" value={form.expenseDate} onChange={handleChange} />
            </div>
            <div>
              <label>Reference Number</label>
              <input name="referenceNumber" type="text" value={form.referenceNumber} onChange={handleChange} placeholder="Optional" />
            </div>
            <div>
              <label>File Upload</label>
              <input name="file" type="file" onChange={handleChange} />
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
