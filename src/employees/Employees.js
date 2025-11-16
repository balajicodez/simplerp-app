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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') || 0);
  const sizeParam = Number(searchParams.get('size') || 20);

  const fetchUrl = async (url) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
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
   
    const url = `${APP_SERVER_URL_PREFIX}/employees/search/findBySupervisorId?supervisorId=1&page=${pageParam}&size=${sizeParam}`;
    fetchUrl(url);
  }, [pageParam, sizeParam]);

  const totalEmployees = employees.length;
  const migrantCount = employees.filter(emp => emp.migrantWorker).length;
  const averageAge = employees.length > 0 
    ? Math.round(employees.reduce((sum, emp) => sum + (emp.age || 0), 0) / employees.length)
    : 0;

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.age?.toString().includes(searchTerm)
  );

  // Sort employees
  const sortedEmployees = React.useMemo(() => {
    if (!sortConfig.key) return filteredEmployees;
    
    return [...filteredEmployees].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (aString < bString) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aString > bString) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredEmployees, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const getSkillColor = (skill) => {
    const skillColors = {
      'DEVELOPER': '#3b82f6',
      'DESIGNER': '#8b5cf6',
      'MANAGER': '#f59e0b',
      'ANALYST': '#10b981',
      'TESTER': '#ef4444',
      'ADMIN': '#6b7280'
    };
    return skillColors[skill] || '#6b7280';
  };

  const getRegionIcon = (region) => {
    const regionIcons = {
      'NORTH': '🧭',
      'SOUTH': '🌅',
      'EAST': '🌄',
      'WEST': '🏜️',
      'CENTRAL': '🏙️'
    };
    return regionIcons[region] || '📍';
  };

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Employee Management">
        
        <div className="employees-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Employee Directory</h1>
              <p>Manage and view all employees in your organization</p>
            </div>
            <button 
              className="btn-primary create-employee-btn"
              onClick={() => navigate('/employees/create')}
            >
              <span className="btn-icon">+</span>
              Add New Employee
            </button>
          </div>

          <div className="stats-grid">
            <div className="emp-stat-card employee-stat">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{totalEmployees}</div>
                <div className="stat-label">Total Employees</div>
              </div>
            </div>
            <div className="emp-stat-card migrant-stat">
              <div className="stat-icon">🌍</div>
              <div className="stat-content">
                <div className="stat-value">{migrantCount}</div>
                <div className="stat-label">Migrant Workers</div>
              </div>
            </div>
            <div className="emp-stat-card age-stat">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{averageAge}</div>
                <div className="stat-label">Average Age</div>
              </div>
            </div>
          </div>
        </div>
        <div className="filters-section">
          <div className="filters-grid">
            <div className="search-box">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search employees by name, skill, region, or age..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="filter-group">
              <label>Items per page</label>
              <select 
                value={sizeParam}
                onChange={(e) => setSearchParams({ page: 0, size: e.target.value })}
                className="filter-select"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
        {searchTerm && (
          <div className="search-results-info">
            Found {filteredEmployees.length} employees matching "{searchTerm}"
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading employees...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="modern-table employees-table">
                <thead>
                  <tr>
                    <th 
                      onClick={() => handleSort('name')}
                      className="sortable-header"
                    >
                      <div className="th-content">
                        <span>Employee</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('skill')}
                      className="sortable-header"
                    >
                      <div className="th-content">
                        <span>Skill</span>
                        {getSortIcon('skill')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('region')}
                      className="sortable-header"
                    >
                      <div className="th-content">
                        <span>Region</span>
                        {getSortIcon('region')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('age')}
                      className="sortable-header"
                    >
                      <div className="th-content">
                        <span>Age</span>
                        {getSortIcon('age')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('migrantWorker')}
                      className="sortable-header"
                    >
                      <div className="th-content">
                        <span>Migrant</span>
                        {getSortIcon('migrantWorker')}
                      </div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        <div className="no-data-content">
                          <div className="no-data-icon">👥</div>
                          <p>
                            {searchTerm 
                              ? `No employees found for "${searchTerm}"`
                              : 'No employees found'
                            }
                          </p>
                          {!searchTerm && (
                            <button 
                              className="btn-primary"
                              onClick={() => navigate('/employees/create')}
                            >
                              Add First Employee
                            </button>
                          )}
                          {searchTerm && (
                            <button 
                              className="btn-secondary"
                              onClick={() => setSearchTerm('')}
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedEmployees.map((emp, idx) => (
                      <tr key={idx} className="table-row employee-row">
                        <td className="employee-cell">
                          <div className="employee-info">
                            <div className="employee-avatar">
                              {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                            </div>
                            <div className="employee-details">
                              <div className="employee-name">{emp.name || 'Unknown'}</div>
                              <div className="employee-id">ID: {emp.id || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="skill-cell">
                          <span 
                            className="skill-badge"
                            style={{ backgroundColor: getSkillColor(emp.skill) }}
                          >
                            {emp.skill || 'Not specified'}
                          </span>
                        </td>
                        <td className="region-cell">
                          <div className="region-info">
                            <span className="region-icon">{getRegionIcon(emp.region)}</span>
                            <span className="region-text">{emp.region || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="age-cell">
                          <div className="age-display">
                            <span className="age-value">{emp.age || 'N/A'}</span>
                            <span className="age-label">years</span>
                          </div>
                        </td>
                        <td className="migrant-cell">
                          <div className={`migrant-status ${emp.migrantWorker ? 'migrant-yes' : 'migrant-no'}`}>
                            <span className="status-dot"></span>
                            {emp.migrantWorker ? 'Yes' : 'No'}
                          </div>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="btn-outline view-btn"
                            onClick={() => navigate(`/employees/${emp.id || emp._links.self.href.split('/').pop()}`)}
                          >
                            <span className="btn-icon">👁️</span>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {sortedEmployees.length > 0 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  <div className="pagination-stats">
                    Showing <strong>{sortedEmployees.length}</strong> of many employees
                  </div>
                  <div className="pagination-summary">
                    Page {pageParam + 1} • {migrantCount} migrant workers
                  </div>
                </div>
                <div className="pagination-controls">
                  <button 
                    className="btn-outline"
                    disabled={!(links.prev || pageParam > 0)}
                    onClick={() => {
                      if (links.prev) return fetchUrl(links.prev.href);
                      const prev = Math.max(0, pageParam - 1);
                      setSearchParams({ page: prev, size: sizeParam });
                    }}
                  >
                    ← Previous
                  </button>
                  <div className="page-indicator">
                    Page {pageParam + 1}
                  </div>
                  <button 
                    className="btn-outline"
                    disabled={!(links.next || employees.length >= sizeParam)}
                    onClick={() => {
                      if (links.next) return fetchUrl(links.next.href);
                      const next = pageParam + 1;
                      setSearchParams({ page: next, size: sizeParam });
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  );
}

export default Employees;