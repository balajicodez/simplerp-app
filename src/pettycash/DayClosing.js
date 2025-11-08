import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate, useSearchParams } from 'react-router-dom';

function DayClosing() {
  const [items, setItems] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);
  const [success, setSuccess] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') || 0);
  const sizeParam = Number(searchParams.get('size') || 20);
  const today = new Date().toISOString().slice(0,10);

  const fetchUrl = async (url) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(url);
      const json = await res.json();
      let list = (json.content ) || json.content || [];
      list = list.filter(e => e.createdDate === today);
      if (selectedOrgId) {
        list = list.filter(e => String(e.organizationId) === String(selectedOrgId));
      }
      setItems(list);
      setLinks(json._links || {});
    } catch (e) { setError('Failed to fetch expenses'); }
    setLoading(false);
  };

  useEffect(() => {
    fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}`);
  }, [pageParam, sizeParam, selectedOrgId]);

  useEffect(() => {
    import('../organization/organizationApi').then(mod => {
      mod.fetchOrganizations().then(setOrganizations).catch(() => {});
    });
  }, []);

  const handleDayClosing = async () => {
    setClosing(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      setSuccess('Day closing successful!');
    } catch (e) {
      setError('Day closing failed');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title={`Day Closing — ${today}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:12 }}>
          <div className="small">All expenses for today</div>
          <div>
            <label style={{ marginRight: 8 }}>Organization:</label>
            <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)} className="styled-select" style={{ minWidth: 180 }}>
              <option value="">All organizations</option>
              {organizations.map(org => (
                <option key={org.id || (org._links && org._links.self && org._links.self.href)} value={org.id || (org._links && org._links.self && org._links.self.href.split('/').pop())}>{org.name}</option>
              ))}
            </select>
            <button className="btn" style={{ marginLeft: 8 }} onClick={() => navigate('/pettycash/day-closing/create')}>Create Day Closing</button>
          </div>
        </div>
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        {success && <div style={{ color: '#2563eb' }}>{success}</div>}
        {loading ? <div className="small">Loading...</div> : (
          <>
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Employee ID</th>
                  <th>Type</th>
                  <th>Created By</th>
                  <th>Created Date</th>                 
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.description}</td>
                    <td>{it.amount}</td>
                    <td>{it.employeeId}</td>
                    <td>{it.expenseSubType}</td>
                    <td>{it.createdByUser}</td>
                    <td>{it.createdDate}</td>
                    <td>{it._links && it._links.self ? <button className="btn" onClick={() => navigate(`/pettycash/expenses/${it.id || it._links.self.href.split('/').pop()}`)}>View</button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="payroll-controls">
              <div>
                <button className="btn" disabled={!(links.prev || pageParam>0)} onClick={() => {
                  if (links.prev) return fetchUrl(links.prev.href);
                  const prev = Math.max(0, pageParam-1);
                  setSearchParams({ page: prev, size: sizeParam });
                  fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${prev}&size=${sizeParam}`);
                }}>Previous</button>
                <button className="btn" style={{ marginLeft:8 }} disabled={!(links.next || items.length>=sizeParam)} onClick={() => {
                  if (links.next) return fetchUrl(links.next.href);
                  const next = pageParam+1;
                  setSearchParams({ page: next, size: sizeParam });
                  fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${next}&size=${sizeParam}`);
                }}>Next</button>
              </div>
              <div className="small">Page {pageParam+1}  Showing {items.length} results</div>
            </div>
          </>
        )}
      </PageCard>
    </div>
  );
}

export default DayClosing;
