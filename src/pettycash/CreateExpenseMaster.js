import React, { useState, useEffect } from 'react';
import Sidebar from '../_components/sidebar/Sidebar';
import PageCard from '../_components/PageCard';
import './PettyCash.css';
import { useNavigate } from 'react-router-dom';
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function CreateExpenseMaster() {
  const [form, setForm] = useState({ description: '', type: '', subtype: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [types, setTypes] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    // Only allow CASH-IN and CASH-OUT as type options
    setTypes(['CASH-IN', 'CASH-OUT']);
  }, []);

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
      const bearerToken = localStorage.getItem('token');
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters?page=0&size=1000`, {
        method: 'POST', headers: {'Content-Type':'application/json','Authorization': `Bearer ${bearerToken}`}, body: JSON.stringify(form)
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
        {error && <div style={{ color: "#c53030" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value="">Select type</option>
                <option value="CASH-IN">CASH-IN</option>
                <option value="CASH-OUT">CASH-OUT</option>
              </select>
            </div>
            <div>
              <label>Subtype</label>
              <input
                name="subtype"
                value={form.subtype}
                onChange={handleChange}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "0 2%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              className="btn-secondary"
              type="back"
              onClick={() => {
                navigate("/pettycash/masters");
              }}
            >
              Back
            </button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : "  💾  Save"}
            </button>
          </div>
        </form>
      </PageCard>
    </div>
  );
}

export default CreateExpenseMaster;
