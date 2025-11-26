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
  const [searchParams, setSearchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  
  const navigate = useNavigate();
  const pageParam = Number(searchParams.get('page') || 0);
  const sizeParam = Number(searchParams.get('size') || 20);

  // Calculate statistics
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalTransactions = items.length;

  const fetchUrl = async (url) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      const list = json.content || json._embedded?.expenses || [];
      setItems(list.filter(e => e.expenseType === 'CASH-IN'));
      setLinks(json._links || {});
    } catch (e) { 
      console.error('Failed to fetch expenses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = (e) => {
    const value = e.target.value;
    setSelectedOrgId(value);
    
    if (value) {
      fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=0&size=${sizeParam}&expenseType=CASH-IN&organizationId=${value}`);
      setSearchParams({ page: 0, size: sizeParam });
    } else {
      fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=0&size=${sizeParam}&expenseType=CASH-IN`);
      setSearchParams({ page: 0, size: sizeParam });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Safe string conversion function
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    return String(value);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = safeToString(searchTerm).toLowerCase();
    
    return (
      safeToString(item.branchName).toLowerCase().includes(searchLower) ||
      safeToString(item.employeeId).toLowerCase().includes(searchLower) ||
      safeToString(item.expenseSubType).toLowerCase().includes(searchLower) ||
      safeToString(item.amount).includes(searchTerm) || // Direct number comparison without toLowerCase
      safeToString(item.expenseDate).toLowerCase().includes(searchLower) ||
      safeToString(item.createdDate).toLowerCase().includes(searchLower) ||
      safeToString(item.referenceNumber).toLowerCase().includes(searchLower)
    );
  });

  // Sort items
  const sortedItems = React.useMemo(() => {
    if (!sortConfig.key) return filteredItems;
    
    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
      
      // Handle date sorting
      if (sortConfig.key.includes('Date')) {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig.direction === 'ascending' ? aDate - bDate : bDate - aDate;
      }
      
      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      
      // String comparison
      const aString = safeToString(aValue).toLowerCase();
      const bString = safeToString(bValue).toLowerCase();
      
      if (aString < bString) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aString > bString) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredItems, sortConfig]);

  // Helper function to check if date is today
const isToday = (dateString) => {
  if (!dateString) return false;
  
  try {
    const itemDate = new Date(dateString);
    const today = new Date();
    
    return (
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear()
    );
  } catch (e) {
    console.error('Invalid date:', dateString, e);
    return false;
  }
};
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  useEffect(() => {
    fetchUrl(`${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}&expenseType=CASH-IN`);
  }, [pageParam, sizeParam]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`);
        const data = await response.json();
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      }
    };
    fetchOrganizations();
  }, []);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className="page-container">
      {/* <Sidebar isOpen={true} /> */}
      <PageCard title="Cash Inward Management">
        
        {/* Header Section with Stats */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Cash Inward </h1>
              <p>Manage and track all cash inflow expenses (CASH-IN)</p>
            </div>
            <button 
              className="btn-primary create-btn"
              onClick={() => navigate('/pettycash/expenses/create?type=CASH-IN')}
            >
              <span className="btn-icon">+</span>
              Create New Inward
            </button>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">₹{totalAmount.toLocaleString()}</div>
                <div className="stat-label">Total Inward</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{totalTransactions}</div>
                <div className="stat-label">Total Transactions</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <div className="stat-value">{organizations.length}</div>
                <div className="stat-label">Organizations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="search-box">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search by branch, employee ID, type, amount, or date..."
                value={searchTerm}
                onChange={handleSearch}
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
              <label>Organization Filter</label>
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

        {/* Search Results Info */}
        {searchTerm && (
          <div className="search-results-info">
            Found {filteredItems.length} transactions matching "{searchTerm}"
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </button>
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                   
                    <th 
                      onClick={() => handleSort('amount')}
                      className="sortable-header"
                    >
                      Amount {getSortIcon('amount')}
                    </th>
                    
                    <th 
                      onClick={() => handleSort('expenseSubType')}
                      className="sortable-header"
                    >
                      Type {getSortIcon('expenseSubType')}
                    </th>
                    <th 
                      onClick={() => handleSort('createdDate')}
                      className="sortable-header"
                    >
                      Created Date {getSortIcon('createdDate')}
                    </th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        <div className="no-data-content">
                          <div className="no-data-icon">📝</div>
                          <p>
                            {searchTerm 
                              ? `No transactions found for "${searchTerm}"`
                              : 'No inward transactions found'
                            }
                          </p>
                          {!searchTerm && (
                            <button 
                              className="btn-secondary"
                              onClick={() => navigate('/pettycash/expenses/create?type=CASH-IN')}
                            >
                              Create First Transaction
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
                    sortedItems.map((item, idx) => (
                      <tr key={idx} className="table-row">
                        
                        <td className="amount-cell">
                          <span className="amount-badge">₹{item.amount?.toLocaleString()}</span>
                        </td>
                        
                        <td className="type-cell">
                          <span className="type-tag">{item.expenseSubType || 'General'}</span>
                        </td>
                        
                        <td className="date-cell">
                          <div className="date-display">
                            {formatDate(item.createdDate)}
                          </div>
                        </td>
                        <td className="receipt-cell">
                          {item.imageData || item.fileUrl || item.file ? (
                            <button 
                              className="btn-outline view-btn"
                              onClick={() => setModalFile(item.imageData || item.fileUrl || item.file)}
                            >
                              👁️ View
                            </button>
                          ) : (
                            <span className="no-receipt">No receipt</span>
                          )}
                        </td>
                       <td className="actions-cell">
                        {isToday(item.createdDate) ? (
                          <button 
                            className="btn-outline edit-btn"
                            onClick={() => navigate(`/pettycash/expenses/${item.id || (item._links?.self?.href.split('/').pop())}/edit`)}
                          >
                            ✏️ Edit
                          </button>
                        ) : (
                          <span className="edit-disabled" title="Can only edit today's transactions">
                            🔒 Locked
                          </span>
                        )}
                      </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sortedItems.length > 0 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing {sortedItems.length} of many results • Page {pageParam + 1}
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
          </>
        )}

        {/* Receipt Modal */}
        {modalFile && (
          <div className="modal-overlay" onClick={() => setModalFile(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Receipt Preview</h3>
                <button 
                  className="modal-close"
                  onClick={() => setModalFile(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {modalFile.startsWith('data:image') ? (
                  <img src={modalFile} alt="Expense Receipt" className="receipt-image" />
                ) : (
                  <img src={`data:image/png;base64,${modalFile}`} alt="Expense Receipt" className="receipt-image" />
                )}
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-primary"
                  onClick={() => setModalFile(null)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </PageCard>
    </div>
  );
}

export default ExpensesInward;