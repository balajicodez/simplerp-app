import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './CreateDayClosing.css';
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
  const today = new Date().toISOString().slice(0, 10);

  // Calculate statistics
  const totalInward = items.filter(item => item.expenseType === 'CASH-IN')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalOutward = items.filter(item => item.expenseType === 'CASH-OUT')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const netBalance = totalInward - totalOutward;
  const totalTransactions = items.length;

  const fetchUrl = async (url) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(url);
      const json = await res.json();
      let list = (json.content) || json.content || [];
      list = list.filter(e => e.createdDate === today);
      if (selectedOrgId) {
        list = list.filter(e => String(e.organizationId) === String(selectedOrgId));
      }
      setItems(list);
      setLinks(json._links || {});
    } catch (e) { 
      setError('Failed to fetch expenses'); 
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}`);
  }, [pageParam, sizeParam, selectedOrgId]);

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

  const handleOrganizationChange = (e) => {
    const value = e.target.value;
    setSelectedOrgId(value);
    
    if (value) {
      fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=0&size=${sizeParam}&organizationId=${value}`);
      setSearchParams({ page: 0, size: sizeParam });
    } else {
      fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=0&size=${sizeParam}`);
      setSearchParams({ page: 0, size: sizeParam });
    }
  };

  const handleDayClosing = async () => {
    setClosing(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' } 
      });
      if (!res.ok) throw new Error('Failed to process day closing');
      setSuccess('Day closing completed successfully! All transactions have been finalized.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (e) {
      setError('Day closing failed. Please try again.');
    } finally {
      setClosing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getExpenseTypeColor = (type) => {
    return type === 'CASH-IN' ? '#10b981' : '#ef4444';
  };

  const getExpenseTypeIcon = (type) => {
    return type === 'CASH-IN' ? '💰' : '💸';
  };

  return (
    <div className="page-container">
      {/* <Sidebar isOpen={true} /> */}
      <PageCard title="Day Closing Management">
        
        {/* Header Section with Stats */}
        <div className="dashboard-header day-closing-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Daily Closing Summary</h1>
              <p>Review and finalize all transactions for {today}</p>
            </div>
            <div className="header-actions">
              <button 
              style={{color:"white"}}
                className="btn-outline"
                onClick={() => navigate('/pettycash/day-closing/create')}
              >
                <span className="btn-icon" style={{color:"white"}}>+</span>
                Perform Day Closing
              </button>
              {/* <button 
                className={`btn-primary day-closing-btn ${closing ? 'loading' : ''}`}
                onClick={handleDayClosing}
                disabled={closing || items.length === 0}
              >
                {closing ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔒</span>
                    Finalize Day Closing
                  </>
                )}
              </button> */}
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{totalTransactions}</div>
                <div className="stat-label">Total Transactions</div>
              </div>
            </div>
            <div className="stat-card income-stat">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(totalInward)}</div>
                <div className="stat-label">Total Inward</div>
              </div>
            </div>
            <div className="stat-card expense-stat">
              <div className="stat-icon">💸</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(totalOutward)}</div>
                <div className="stat-label">Total Outward</div>
              </div>
            </div>
            <div className="stat-card balance-stat">
              <div className="stat-icon">⚖️</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(netBalance)}</div>
                <div className="stat-label">Net Balance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Organization Filter</label>
              <select 
                value={selectedOrgId} 
                onChange={handleOrganizationChange}
                className="filter-select"
              >
                <option value="">All Organizations</option>
                {organizations.map(org => (
                  <option 
                    key={org.id || org._links?.self?.href} 
                    value={org.id || (org._links?.self?.href.split('/').pop())}
                  >
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Items per page</label>
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

            <div className="summary-badge">
              <div className="summary-text">
                Showing {items.length} transactions for {today}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✅</div>
            <div className="alert-content">
              <strong>Success:</strong> {success}
            </div>
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading today's transactions...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="modern-table day-closing-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Branch</th>
                    <th>Amount</th>
                    
                    <th>Category</th>
                    <th>Created By</th>
                  
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        <div className="no-data-content">
                          <div className="no-data-icon">📝</div>
                          <h3>No Transactions Today</h3>
                          <p>No transactions found for {today}. Start by creating a new transaction.</p>
                          <button 
                            className="btn-primary"
                            onClick={() => navigate('/pettycash/expenses/create')}
                          >
                            <span className="btn-icon">+</span>
                            Create First Transaction
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="type-cell">
                          <span 
                            className="type-badge"
                            style={{ 
                              backgroundColor: getExpenseTypeColor(item.expenseType),
                              color: 'white'
                            }}
                          >
                            <span className="type-icon">
                              {getExpenseTypeIcon(item.expenseType)}
                            </span>
                            {item.expenseType || 'N/A'}
                          </span>
                        </td>
                        <td className="branch-cell">
                          <div className="branch-info">
                            <div className="branch-name">{item.branchName || '-'}</div>
                            <div className="organization-name">
                              {organizations.find(org => 
                                String(org.id) === String(item.organizationId) || 
                                String(org._links?.self?.href.split('/').pop()) === String(item.organizationId)
                              )?.name || 'Organization'}
                            </div>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <span 
                            className={`amount-badge ${
                              item.expenseType === 'CASH-IN' ? 'amount-in' : 'amount-out'
                            }`}
                          >
                            {item.expenseType === 'CASH-IN' ? '+' : '-'}
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                        
                        <td className="category-cell">
                          <span className="category-tag">
                            {item.expenseSubType || 'General'}
                          </span>
                        </td>
                        <td className="creator-cell">
                          <div className="creator-info">
                            <div className="creator-name">{item.createdByUser || 'System'}</div>
                            <div className="created-date">{item.createdDate}</div>
                          </div>
                        </td>
                        
                        <td className="actions-cell">
                          <button 
                            className="btn-outline view-btn"
                            onClick={() => navigate(`/pettycash/expenses/${item.id || (item._links?.self?.href.split('/').pop())}`)}
                            title="View Details"
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {items.length > 0 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing {items.length} transactions • Page {pageParam + 1}
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
                  <span className="page-indicator">
                    Page {pageParam + 1}
                  </span>
                  <button 
                    className="btn-outline"
                    disabled={!(links.next || items.length >= sizeParam)}
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

            {/* Final Summary */}
            {items.length > 0 && (
              <div className="final-summary">
                <div className="summary-card">
                  <h3>Daily Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Total Inward:</span>
                      <span className="summary-value income">{formatCurrency(totalInward)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Outward:</span>
                      <span className="summary-value expense">{formatCurrency(totalOutward)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Net Balance:</span>
                      <span className={`summary-value balance ${
                        netBalance >= 0 ? 'positive' : 'negative'
                      }`}>
                        {formatCurrency(netBalance)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Transaction Count:</span>
                      <span className="summary-value count">{totalTransactions}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  );
}

export default DayClosing;