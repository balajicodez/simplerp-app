import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../_components/sidebar/Sidebar';
import PageCard from '../_components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import './Employees.css';
import DefaultAppSidebarLayout from "../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";

function EmployeeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/employees/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => setEmployee(json))
      .catch((e) => setError('Unable to load employee'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
      <DefaultAppSidebarLayout pageTitle={"Employee Management"}>
      <PageCard title={employee ? employee.name : 'Employee Details'}>
        {loading && <div className="small">Loading...</div>}
        {error && <div style={{ color: '#c53030' }}>{error}</div>}

        {employee && (
          <div>
            <table className="employees-table">
              <tbody>
                <tr>
                  <th>Name</th>
                  <td>{employee.name}</td>
                </tr>
                <tr>
                  <th>Skill</th>
                  <td>{employee.skill}</td>
                </tr>
                <tr>
                  <th>Region</th>
                  <td>{employee.region}</td>
                </tr>
                <tr>
                  <th>Age</th>
                  <td>{employee.age}</td>
                </tr>
                <tr>
                  <th>Migrant Worker</th>
                  <td>{employee.migrantWorker ? 'Yes' : 'No'}</td>
                </tr>
                {employee._links && (
                  <tr>
                    <th>Links</th>
                    <td>
                      {employee._links.self && <a href={employee._links.self.href}>Self</a>}{' '}
                      {employee._links.supervisor && (
                        <a style={{ marginLeft: 8 }} href={employee._links.supervisor.href}>Supervisor</a>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => navigate('/employees')}>Back</button>
              <button className="btn" onClick={() => navigate(`/employees/${id}/edit`)}>Edit</button>
            </div>
          </div>
        )}
      </PageCard>
      </DefaultAppSidebarLayout>
  );
}

export default EmployeeView;
