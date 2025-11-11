import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './PettyCash.css';
import { useNavigate } from 'react-router-dom';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
const API_PREFIX = '/simplerp/api';

function ExpenseMasters() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters`)
      .then((res) => res.json())
      .then((json) => {
        const list = (json._embedded && json._embedded.expenseTypeMasters) || json._embedded || [];
        setItems(list);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Expense Category Masters">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:12 }}>
          <div className="small">Masters of expense categories</div>
          <div>
            <button className="btn" onClick={() => navigate('/pettycash/masters/create')}>Create</button>
          </div>
        </div>
        {loading ? <div className="small">Loading...</div> : (
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Subtype</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.description}</td>
                  <td>{it.type}</td>
                  <td>{it.subtype}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
    </div>
  );
}

export default ExpenseMasters;

