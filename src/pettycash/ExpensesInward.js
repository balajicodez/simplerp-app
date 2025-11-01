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

  const fetchUrl = async (url) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      const list = (json.content ) || json.content || [];
      setItems(list.filter(e => e.expenseType === 'CASH-IN'));
      setLinks(json._links || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
  fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}&expenseType=CASH-IN`);
  }, [pageParam, sizeParam]);

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Expenses - Inward">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="small">Inward expenses (CASH-IN)</div>
          <div>
            <button className="btn" onClick={() => navigate('/pettycash/expenses/create?type=CASH-IN')}>Create Expense</button>
          </div>
        </div>
        {loading ? <div className="small">Loading...</div> : (
          <>
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Employee ID</th>
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
                    <td>{it.employeeId}</td>
                    <td>{it.expenseSubType}</td>
                    <td>
                      {it.imageData ? (
                        <button className="btn" onClick={() => setModalFile(it.imageData)}>View</button>
                      ) : (it.fileUrl || it.file ? (
                        <button className="btn" onClick={() => setModalFile(it.fileUrl || it.file)}>View</button>
                      ) : '')}
                    </td>
                    <td>
                      <button className="btn" onClick={() => navigate(`/pettycash/expenses/${it.id || (it._links && it._links.self && it._links.self.href.split('/').pop())}/edit`)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {modalFile && (
              <div className="modal" style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setModalFile(null)}>
                <div style={{ background:'#fff', padding:24, borderRadius:8, maxWidth:'80vw', maxHeight:'80vh', overflow:'auto' }} onClick={e => e.stopPropagation()}>
                  <h3>Receipt</h3>
                  {modalFile.startsWith('data:image') ? (
                    <img src={modalFile} alt="Expense File" style={{ maxWidth:'60vw', maxHeight:'60vh', border:'none' }} />
                  ) : (
                    <img src={`data:image/png;base64,${modalFile}`} alt="Expense File" style={{ maxWidth:'60vw', maxHeight:'60vh', border:'none' }} />
                  )}
                  <div style={{ marginTop:12 }}>
                    <button className="btn" onClick={() => setModalFile(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
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

export default ExpensesInward;
