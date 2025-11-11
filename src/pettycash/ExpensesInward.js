import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate, useSearchParams } from 'react-router-dom';

function ExpensesInward() {
  const [items, setItems] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalFile, setModalFile] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') || 0);
  const sizeParam = Number(searchParams.get('size') || 20);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const fetchUrl = async (url) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      const list = (json.content) || json.content || [];
      setItems(list.filter(e => e.expenseType === 'CASH-IN'));
      setLinks(json._links || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name === 'organizationId') {
      // Find organization name from selected dropdown value
      const selectedOrg = organizations.find(org => String(org.id) === String(value));
      let temp = e.currentTarget.options[e.currentTarget.selectedIndex].text
      if (e.currentTarget.selectedIndex >0) {
        fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}&expenseType=CASH-IN&organizationId=${value}`);
      } else {
        fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}&expenseType=CASH-IN`);
      }
    }
  };

  useEffect(() => {
    fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}&expenseType=CASH-IN`);
  }, [pageParam, sizeParam]);

  useEffect(() => {
    // Fetch organizations for dropdown
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
      .then(res => res.json())
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => { });
  }, []);

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Cashflow - Inward">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="small">Inward expenses (CASH-IN)</div>
          <div>
            <button className="btn" onClick={() => navigate('/pettycash/expenses/create?type=CASH-IN')}>Create Expense</button>
          </div>
        </div>
        <div style={{ margin: '12px 0' }}>
          <label style={{ marginRight: 8 }}>Branch</label>
          <select name="organizationId" onChange={handleChange} className="styled-select" style={{ minWidth: 180 }}>
            <option value="">All organizations</option>
            {organizations.map(org => (
              <option key={org.id || org._links?.self?.href} value={org.id || (org._links && org._links.self && org._links.self.href.split('/').pop())}>{org.name}</option>
            ))}
          </select>
        </div>
        {loading ? <div className="small">Loading...</div> : (
          <>
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                 
                  <th>Type</th>
                  <th>Receipt</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.description}</td>
                    <td>{it.amount}</td>
                 
                    <td>{it.expenseSubType}</td>
                    <td>
                      {it.imageData ? (
                        <button className="btn" onClick={() => setModalFile(it.imageData)}>View</button>
                      ) : (it.fileUrl || it.file ? (
                        <button className="btn" onClick={() => setModalFile(it.fileUrl || it.file)}>View</button>
                      ) : '')}
                    </td>
                    <td>
                      <button className="btn" onClick={() => navigate(`/pettycash/expenses/${it.id || (it._links && it._links.self && it._links.self.href.split('/').pop())}/edit`)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {modalFile && (
              <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalFile(null)}>
                <div style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: '80vw', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                  <h3>Receipt</h3>
                  {modalFile.startsWith('data:image') ? (
                    <img src={modalFile} alt="Expense File" style={{ maxWidth: '60vw', maxHeight: '60vh', border: 'none' }} />
                  ) : (
                    <img src={`data:image/png;base64,${modalFile}`} alt="Expense File" style={{ maxWidth: '60vw', maxHeight: '60vh', border: 'none' }} />
                  )}
                  <div style={{ marginTop: 12 }}>
                    <button className="btn" onClick={() => setModalFile(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
            <div className="payroll-controls">
              <div>
                <button className="btn" disabled={!(links.prev || pageParam > 0)} onClick={() => {
                  if (links.prev) return fetchUrl(links.prev.href);
                  const prev = Math.max(0, pageParam - 1);
                  setSearchParams({ page: prev, size: sizeParam });
                  fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${prev}&size=${sizeParam}`);
                }}>Previous</button>
                <button className="btn" style={{ marginLeft: 8 }} disabled={!(links.next || items.length >= sizeParam)} onClick={() => {
                  if (links.next) return fetchUrl(links.next.href);
                  const next = pageParam + 1;
                  setSearchParams({ page: next, size: sizeParam });
                  fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${next}&size=${sizeParam}`);
                }}>Next</button>
              </div>
              <div className="small">Page {pageParam + 1}  Showing {items.length} results</div>
            </div>
          </>
        )}
      </PageCard>
    </div>
  );
}

export default ExpensesInward;
