import React, { useState } from 'react';
import Sidebar from './../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { useNavigate } from 'react-router-dom';
import './Employees.css';

function CreateEmployee() {
  const [form, setForm] = useState({ name: '', skill: '', region: '', age: '', migrantWorker: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.skill) { setError('Please fill required fields'); return; }
    if (form.age && (Number(form.age) < 18 || Number(form.age) > 100)) { setError('Age must be between 18 and 100'); return; }
    setLoading(true);
    try {
      const res = await fetch(APP_SERVER_URL_PREFIX + '/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: Number(form.age) })
      });
      if (!res.ok) throw new Error('failed');
      navigate('/employees');
    } catch (err) {
      setError('Failed to create employee');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Create Employee">
        {error && <div style={{ color: '#c53030', marginBottom: 8 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
              {touched.name && !form.name && <div style={{ color: '#c53030', fontSize: 13 }}>Name is required</div>}
            </div>
            <div>
              <label>Skill</label>
              <input name="skill" value={form.skill} onChange={handleChange} required />
              {touched.skill && !form.skill && <div style={{ color: '#c53030', fontSize: 13 }}>Skill is required</div>}
            </div>
            <div>
              <label>Region</label>
              <input name="region" value={form.region} onChange={handleChange} />
            </div>
            <div>
              <label>Age</label>
              <input name="age" type="number" value={form.age} onChange={handleChange} />
              {touched.age && form.age && (Number(form.age) < 18 || Number(form.age) > 100) && <div style={{ color: '#c53030', fontSize: 13 }}>Age must be between 18 and 100</div>}
            </div>
            <div className="full-row">
              <label className="checkbox-label"><input type="checkbox" name="migrantWorker" checked={form.migrantWorker} onChange={handleChange} /> Migrant Worker</label>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn" type="submit" disabled={loading || !form.name || !form.skill || (form.age && (Number(form.age) < 18 || Number(form.age) > 100))}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
      </PageCard>
    </div>
  );
}

export default CreateEmployee;
