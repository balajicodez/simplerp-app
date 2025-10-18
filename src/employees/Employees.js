import React, { useState, useEffect } from 'react';
import Sidebar from './../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import './Employees.css';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') || 0);
  const sizeParam = Number(searchParams.get('size') || 20);

  const fetchUrl = async (url) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      // Expect HAL style: _embedded.employees
      const items = (json._embedded && json._embedded.employees) || json._embedded || [];
      setEmployees(items);
      setLinks(json._links || {});
    } catch (err) {
      console.error('Error fetching employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prefer query-based pagination: /employees?page=X&size=Y
    const url = `${APP_SERVER_URL_PREFIX}/employees/search/findBySupervisorId?supervisorId=1&page=${pageParam}&size=${sizeParam}`;
    fetchUrl(url);
  }, []);

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Employees">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="small">List of employees (paginated)</div>
          <button className="btn" onClick={() => navigate('/employees/create')}>Create Employee</button>
        </div>

        {loading ? <p className="small">Loading...</p> : (
          <>
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Skill</th>
                  <th>Region</th>
                  <th>Age</th>
                  <th>Migrant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={idx}>
                    <td>{emp.name}</td>
                    <td>{emp.skill}</td>
                    <td>{emp.region}</td>
                    <td>{emp.age}</td>
                    <td>{emp.migrantWorker ? 'Yes' : 'No'}</td>
                    <td>
                      {emp._links && emp._links.self ? (
                        <button className="btn" onClick={() => navigate(`/employees/${emp.id || emp._links.self.href.split('/').pop()}`)}>View</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="employees-controls">
              <div>
                {/* If HAL links available use them, otherwise switch to query params */}
                <button className="btn" disabled={!(links.prev || pageParam > 0)} onClick={() => {
                  if (links.prev) return fetchUrl(links.prev.href);
                  const prev = Math.max(0, pageParam - 1);
                  setSearchParams({ page: prev, size: sizeParam });
                  fetchUrl(`${APP_SERVER_URL_PREFIX}/employees?page=${prev}&size=${sizeParam}`);
                }}>Previous</button>

                <button className="btn" style={{ marginLeft: 8 }} disabled={!(links.next || employees.length >= sizeParam)} onClick={() => {
                  if (links.next) return fetchUrl(links.next.href);
                  const next = pageParam + 1;
                  setSearchParams({ page: next, size: sizeParam });
                  fetchUrl(`${APP_SERVER_URL_PREFIX}/employees?page=${next}&size=${sizeParam}`);
                }}>Next</button>
              </div>
              <div className="small">Page {pageParam + 1} · Showing {employees.length} results</div>
            </div>
          </>
        )}
      </PageCard>
    </div>
  );
}

export default Employees;
