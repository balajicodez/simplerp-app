import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate } from 'react-router-dom';

function CreateDayClosing() {
  const [description, setDescription] = useState('Day Closing');
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [tenNoteCount, set10NoteCount] = useState('');
  const [twentyNoteCount, set20NoteCount] = useState('');
  const [fiftyNoteCount, set50NoteCount] = useState('');
  const [hundredNoteCount, set100NoteCount] = useState('');
  const [twoHundredNoteCount, set200NoteCount] = useState('');
  const [fiveHundredNoteCount, set500NoteCount] = useState('');
  const [tenSoiledNoteCount, set10SoiledNoteCount] = useState('');
  const [twentySoiledNoteCount, set20SoiledNoteCount] = useState('');
  const [fiftySoiledNoteCount, set50SoiledNoteCount] = useState('');
  const [hundredSoiledNoteCount, set100SoiledNoteCount] = useState('');
  const [twoHundredSoiledNoteCount, set200SoiledNoteCount] = useState('');
  const [fiveHundredSoiledNoteCount, set500SoiledNoteCount] = useState('');
  const [oneCoinCount, set1CoinCount] = useState('');
  const [fiveCoinCount, set5CoinCount] = useState('');
  const [tenCoinCount, set10CoinCount] = useState('');
  const [twentyCoinCount, set20CoinCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Get current user from localStorage (adjust key as needed)
  const currentUser = localStorage.getItem('username') || localStorage.getItem('user') || '';
  // Date field now controlled by user
  // Get current time
  const createdTime = new Date().toISOString();

  React.useEffect(() => {
    import('../organization/organizationApi').then(mod => {
      mod.fetchOrganizations().then(setOrganizations).catch(() => { });
    });
  }, []);

  React.useEffect(() => {
    // Fetch organizations for dropdown
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
      .then(res => res.json())
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => { });
  }, []);

  const handleChange = async (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'select-one') {
      setOrganizationId(e.target.value);
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing/init?closingDate=${date}&organizationId=${e.target.value}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        setOpeningBalance(data.cashIn);
        setClosingBalance(data.cashOut);
      }
    } else if (type === 'date') {
      setDate(e.target.value);
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing/init?closingDate=${e.target.value}&organizationId=${organizationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setOpeningBalance(data.cashIn);
        setClosingBalance(data.cashOut);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Defensive: ensure description is not null or 0
      const desc = typeof description === 'string' && description.trim() ? description.trim() : 'Day Closing';
      const payload = {
        closingDate: date,
        description: desc,
        createdBy: currentUser,
        createdTime,
        organizationId: organizationId || undefined,
        openingBalance: openingBalance ? Number(openingBalance) : 0,
        closingBalance: closingBalance ? Number(closingBalance) : 0,
        tenNoteCount: tenNoteCount ? Number(tenNoteCount) : 0,
        twentyNoteCount: twentyNoteCount ? Number(twentyNoteCount) : 0,
        fiftyNoteCount: fiftyNoteCount ? Number(fiftyNoteCount) : 0,
        hundredNoteCount: hundredNoteCount ? Number(hundredNoteCount) : 0,
        twoHundredNoteCount: twoHundredNoteCount ? Number(twoHundredNoteCount) : 0,
        fiveHundredNoteCount: fiveHundredNoteCount ? Number(fiveHundredNoteCount) : 0,
        tenSoiledNoteCount: tenSoiledNoteCount ? Number(tenSoiledNoteCount) : 0,
        twentySoiledNoteCount: twentySoiledNoteCount ? Number(twentySoiledNoteCount) : 0,
        fiftySoiledNoteCount: fiftySoiledNoteCount ? Number(fiftySoiledNoteCount) : 0,
        hundredSoiledNoteCount: hundredSoiledNoteCount ? Number(hundredSoiledNoteCount) : 0,
        twoHundredSoiledNoteCount: twoHundredSoiledNoteCount ? Number(twoHundredSoiledNoteCount) : 0,
        fiveHundredSoiledNoteCount: fiveHundredSoiledNoteCount ? Number(fiveHundredSoiledNoteCount) : 0,
        oneCoinCount: oneCoinCount ? Number(oneCoinCount) : 0,
        fiveCoinCount: fiveCoinCount ? Number(fiveCoinCount) : 0,
        tenCoinCount: tenCoinCount ? Number(tenCoinCount) : 0,
        twentyCoinCount: twentyCoinCount ? Number(twentyCoinCount) : 0
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
          <div className="form-grid">
            <div>
              <label style={{ minWidth: 100 }}>Organization:</label>
              <select value={organizationId} type="dropdown" onChange={handleChange} className="styled-select" style={{ minWidth: 180 }} required>
                <option value="">Select organization</option>
                {organizations.map(org => (
                  <option key={org.id || (org._links && org._links.self && org._links.self.href)} value={org.id || (org._links && org._links.self && org._links.self.href.split('/').pop())}>{org.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ minWidth: 100 }}>Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="form-control" style={{ minWidth: 180 }} />
            </div>
            <div>
              <label style={{ minWidth: 100 }}>Date</label>
              <input type="date" value={date} onChange={handleChange} className="form-control" style={{ minWidth: 180 }} />
            </div>
            <div>
              <label style={{ minWidth: 120 }}>Opening Balance</label>
              <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="form-control" min="0" />
            </div>
            <div>
              <label style={{ minWidth: 120 }}>Closing Balance</label>
              <input type="number" value={closingBalance} onChange={e => setClosingBalance(e.target.value)} className="form-control" min="0" />
            </div>

          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>10 Note Count</label>
              <input type="number" value={tenNoteCount} onChange={e => set10NoteCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>20 Note Count</label>
              <input type="number" value={twentyNoteCount} onChange={e => set20NoteCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>50 Note Count</label>
              <input type="number" value={fiftyNoteCount} onChange={e => set50NoteCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>100 Note Count</label>
              <input type="number" value={hundredNoteCount} onChange={e => set100NoteCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>200 Note Count</label>
              <input type="number" value={twoHundredNoteCount} onChange={e => set200NoteCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>500 Note Count</label>
              <input type="number" value={fiveHundredNoteCount} onChange={e => set500NoteCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>10 Soiled Note Count</label>
              <input type="number" value={tenSoiledNoteCount} onChange={e => set10SoiledNoteCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>20 Soiled Note Count</label>
              <input type="number" value={twentySoiledNoteCount} onChange={e => set20SoiledNoteCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>50 Soiled Note Count</label>
              <input type="number" value={fiftySoiledNoteCount} onChange={e => set50SoiledNoteCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>100 Soiled Note Count</label>
              <input type="number" value={hundredSoiledNoteCount} onChange={e => set100SoiledNoteCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>200 Soiled Note Count</label>
              <input type="number" value={twoHundredSoiledNoteCount} onChange={e => set200SoiledNoteCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>500 Soiled Note Count</label>
              <input type="number" value={fiveHundredSoiledNoteCount} onChange={e => set500SoiledNoteCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>1 Coin Count</label>
              <input type="number" value={oneCoinCount} onChange={e => set1CoinCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>5 Coin Count</label>
              <input type="number" value={fiveCoinCount} onChange={e => set5CoinCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>10 Coin Count</label>
              <input type="number" value={tenCoinCount} onChange={e => set10CoinCount(e.target.value)} className="form-control" min="0" />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ minWidth: 120 }}>20 Coin Count</label>
              <input type="number" value={twentyCoinCount} onChange={e => set20CoinCount(e.target.value)} className="form-control" min="0" />
            </div>
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ marginLeft: 16, minWidth: 180 }}>{loading ? 'Saving...' : 'Create Day Closing'}</button>
        </form>
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        {success && <div style={{ color: '#2563eb' }}>{success}</div>}
      </PageCard>
    </div>
  );
}

export default CreateDayClosing;
