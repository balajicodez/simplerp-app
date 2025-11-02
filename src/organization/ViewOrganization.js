import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate } from 'react-router-dom';

function ViewOrganization() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
      .then(res => res.json())
      .then(data => {
        setOrgs(data._embedded ? data._embedded.organizations || [] : data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch organizations');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Organizations">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn" onClick={() => navigate('/organization/create')}>Create Organization</button>
        </div>
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        {loading ? <div className="small">Loading...</div> : (
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Parent</th>
                <th>Registration No</th>
                <th>GSTN</th>
                <th>PAN</th>
                <th>Contact</th>
                <th>Fax</th>
                <th>Email</th>
                <th>Website</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org, idx) => (
                <tr key={idx}>
                  <td>{org.name}</td>
                  <td>{org.parentOrganization}</td>
                  <td>{org.registrationNo}</td>
                  <td>{org.gstn}</td>
                  <td>{org.pan}</td>
                  <td>{org.contact}</td>
                  <td>{org.fax}</td>
                  <td>{org.email}</td>
                  <td>{org.website}</td>
                  <td>{org.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
    </div>
  );
}

export default ViewOrganization;
