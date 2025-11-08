import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { fetchOrganizations } from '../organization/organizationApi';

function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ description:'', amount:'', employeeId:'', organizationId:'' });
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`)
      .then(res => { if (!res.ok) throw new Error('fail'); return res.json(); })
      .then(json => {
        // Ensure organizationId is a string for dropdown matching
        let orgId = json.organizationId || '';
        if (typeof orgId !== 'string') orgId = String(orgId);
        setForm({ description: json.description || '', amount: json.amount || '', employeeId: json.employeeId || '', organizationId: orgId, organizationName:'' });
      })
      .catch(() => setError('Unable to load expense'))
      .finally(() => setLoading(false));
      fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
          .then(res => res.json())
          .then(data => {
            const orgs = data._embedded ? data._embedded.organizations || [] : data;
            setOrganizations(orgs);
          })
          .catch(() => {});
  }, [id]);

   const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm((f) => ({ ...f, file: files[0] }));
    } else if (name === 'organizationId') {
      // Find organization name from selected dropdown value
      const selectedOrg = organizations.find(org => String(org.id) === String(value));
      let temp = e.currentTarget.options[e.currentTarget.selectedIndex].text     
      setForm((f) => ({ ...f, organizationId: value, organizationName: temp }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { description: form.description, amount: Number(form.amount), organizationId: form.organizationId || undefined,
        organizationName: form.organizationName || undefined };
      if (form.employeeId) payload.employeeId = Number(form.employeeId);
      if (form.organizationId) payload.organizationId = form.organizationId;
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('failed');
      navigate(`/pettycash/expenses/${id}`);
    } catch (err) { setError('Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title={`Edit Expense`}>
        {error && <div style={{ color:'#c53030' }}>{error}</div>}
        {loading ? <div className="small">Loading...</div> : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>Organization</label>
                <select name="organizationId" value={form.organizationId} onChange={handleChange} required>
                  <option value="">Select organization</option>
                  {organizations.map(org => (
                    <option key={org.id || org._links?.self?.href} value={org.id || (org._links && org._links.self && org._links.self.href.split('/').pop())}>{org.name}</option>
                  ))}
                </select>
              </div>
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
