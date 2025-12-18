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
    const bearerToken = localStorage.getItem('token');
    fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters`, {
      headers: {'Authorization': `Bearer ${bearerToken}` }
    })
      .then(res => {
        // Check if the response is successful
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        return res.json(); // Parse the JSON response body
      })
      .then(data => {
        setLoading(false);
        // Access the _embedded property from the parsed data
        const expenseTypes = data._embedded.expenseTypeMasters;
        setItems(expenseTypes);  // Set the expense types to state
      }).catch(err => {
        setLoading(false);  // If an error occurs, set error message
      });
  }, []);

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Expense Category Masters">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:12 }}>         
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

