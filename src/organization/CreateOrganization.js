import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function CreateOrganization({ onCreated }) {
  const [form, setForm] = useState({
    parentOrganization: '',
    name: '',
    registrationNo: '',
    gstn: '',
    pan: '',
    contact: '',
    fax: '',
    email: '',
    website: '',
    status: 'Active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to create organization');
      if (onCreated) onCreated();
    } catch (err) {
      setError('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Create Organization">
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label>Parent Organization</label>
            <input name="parentOrganization" value={form.parentOrganization} onChange={handleChange} />
          </div>
          <div>
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label>Registration No</label>
            <input name="registrationNo" value={form.registrationNo} onChange={handleChange} />
          </div>
          <div>
            <label>GSTN</label>
            <input name="gstn" value={form.gstn} onChange={handleChange} />
          </div>
          <div>
            <label>PAN</label>
            <input name="pan" value={form.pan} onChange={handleChange} />
          </div>
          <div>
            <label>Contact</label>
            <input name="contact" value={form.contact} onChange={handleChange} required />
          </div>
          <div>
            <label>Fax</label>
            <input name="fax" value={form.fax} onChange={handleChange} />
          </div>
          <div>
            <label>Email</label>
            <input name="email" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label>Website</label>
            <input name="website" value={form.website} onChange={handleChange} />
          </div>
          <div>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </PageCard>
    </div>
  );
}

export default CreateOrganization;
