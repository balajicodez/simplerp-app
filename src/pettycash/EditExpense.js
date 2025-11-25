import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './EditExpense.css'; 
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    transactionDate: new Date().toISOString().slice(0, 10), 
    amount: '', 
    employeeId: '', 
    organizationId: '', 
    organizationName: '',
    expenseType: '',
    expenseSubType: '',
    referenceNumber: '',
    expenseDate: new Date().toISOString().slice(0, 10)
  });
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Fetch expense details
    fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`)
      .then(res => { 
        if (!res.ok) throw new Error('Failed to load expense'); 
        return res.json(); 
      })
      .then(json => {
        // Ensure organizationId is a string for dropdown matching
        let orgId = json.organizationId || '';
        if (typeof orgId !== 'string') orgId = String(orgId);
        
        setForm({ 
          transactionDate: json.transactionDate || new Date().toISOString().slice(0, 10), 
          amount: json.amount || '', 
          employeeId: json.employeeId || '', 
          organizationId: orgId, 
          organizationName: json.organizationName || '',
          expenseType: json.expenseType || '',
          expenseSubType: json.expenseSubType || '',
          referenceNumber: json.referenceNumber || '',
          expenseDate: json.expenseDate || json.createdDate || new Date().toISOString().slice(0, 10)
        });
      })
      .catch((err) => {
        console.error('Error loading expense:', err);
        setError('Unable to load expense details');
      });

    // Fetch organizations
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load organizations');
        return res.json();
      })
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data || [];
        setOrganizations(Array.isArray(orgs) ? orgs : []);
      })
      .catch((err) => {
        console.error('Error loading organizations:', err);
        setOrganizations([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setError('');
    setSuccess('');
    
    if (type === 'file') {
      setForm((f) => ({ ...f, file: files[0] }));
    } else if (name === 'organizationId') {
      // Find organization name from selected dropdown value
      const selectedOrg = organizations.find(org => String(org.id) === String(value));
      const orgName = selectedOrg ? selectedOrg.name : '';
      setForm((f) => ({ ...f, organizationId: value, organizationName: orgName }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setSuccess('');
    setLoading(true);
    
    // Validation
    if (!form.organizationId) {
      setError('Please select an organization');
      setLoading(false);
      return;
    }
    if (!form.transactionDate) {
      setError('Please enter a transaction date');
      setLoading(false);
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      const payload = { 
        transactionDate: form.transactionDate,
        amount: Number(form.amount), 
        organizationId: form.organizationId || undefined,
        organizationName: form.organizationName || undefined,
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        referenceNumber: form.referenceNumber || undefined,
        expenseDate: form.expenseDate || undefined
      };
      
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`, { 
        method: 'PATCH', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || 'Failed to update expense');
      } else {
        setSuccess('Expense updated successfully!');
        setTimeout(() => {
          navigate(`/pettycash/expenses/${id}`);
        }, 1500);
      }
    } catch (err) { 
      console.error('Error updating expense:', err);
      setError('Failed to save expense. Please try again.'); 
    }
    finally { 
      setLoading(false); 
    }
  };

  const getExpenseTypeColor = () => {
    if (form.expenseType === 'CASH-IN') return 'inward';
    if (form.expenseType === 'CASH-OUT') return 'outward';
    return 'default';
  };

  const getExpenseIcon = () => {
    if (form.expenseType === 'CASH-IN') return '💰';
    if (form.expenseType === 'CASH-OUT') return '💸';
    return '📝';
  };

  // Safe organization count
  const organizationCount = Array.isArray(organizations) ? organizations.length : 0;

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title={`Edit Expense`}>
        
        <div className={`edit-expense-header ${getExpenseTypeColor()}-header`}>
          <div className="header-content">
            <div className="header-icon">{getExpenseIcon()}</div>
            <div className="header-stats">
              <div className="stat-badge">
                <span className="stat-number">{organizationCount}</span>
                <span className="stat-label">Organizations</span>
              </div>
              <div className="stat-badge">
                <span className="stat-number">{id ? '1' : '0'}</span>
                <span className="stat-label">Expense</span>
              </div>
            </div>
            <div className="header-text">
              <h1>Edit Expense #{id}</h1>
              <p>Update expense details and organization information</p>
              {form.expenseSubType && (
                <div className="expense-category">
                  <span className="category-badge">{form.expenseSubType}</span>
                  {form.expenseType && (
                    <span className={`type-badge type-${form.expenseType.toLowerCase()}`}>
                      {form.expenseType}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="edit-expense-form">
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

          {loading && !form.transactionDate ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading expense details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-sections">
                
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">🏢</span>
                    Organization & Basic Information
                  </h3>
                  <div className="form-grid enhanced-grid">
                    <div className="form-group">
                      <label className="form-label required">Branch</label>
                      <select 
                        name="organizationId" 
                        value={form.organizationId} 
                        onChange={handleChange} 
                        className="form-select"
                        required
                        disabled={loading}
                      >
                        <option value="">Select branch</option>
                        {Array.isArray(organizations) && organizations.map(org => {
                          const orgId = org.id || (org._links?.self?.href.split('/').pop());
                          return (
                            <option key={orgId} value={orgId}>
                              {org.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label required">Transaction Date</label>
                      <div className="date-input-wrapper">
                        <span className="input-icon" style={{marginLeft:"-10px"}}>📅</span>
                        <input 
                          name="transactionDate" 
                          type="date" 
                          value={form.transactionDate} 
                          onChange={handleChange} 
                          className="form-input"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label required">Amount (₹)</label>
                      <div className="amount-input-wrapper">
                        <span className="currency-symbol">₹</span>
                        <input 
                          name="amount" 
                          type="number" 
                          value={form.amount} 
                          onChange={handleChange} 
                          className="form-input amount-input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <div className="employee-input-wrapper">
                        <span className="input-icon">👤</span>
                        <input 
                          name="employeeId" 
                          type="number" 
                          value={form.employeeId} 
                          onChange={handleChange} 
                          className="form-input"
                          placeholder="Enter employee ID (optional)"
                          disabled={loading}
                        />
                      </div>
                    </div> */}

                    {/* <div className="form-group">
                      <label className="form-label">Reference Number</label>
                      <div className="reference-input-wrapper">
                        <span className="input-icon">🔢</span>
                        <input 
                          name="referenceNumber" 
                          type="text" 
                          value={form.referenceNumber} 
                          onChange={handleChange} 
                          className="form-input"
                          placeholder="Optional reference number"
                          maxLength={50}
                          disabled={loading}
                        />
                      </div>
                      <div className="char-count">{form.referenceNumber.length}/50</div>
                    </div> */}

                    <div className="form-group">
                      <label className="form-label">Expense Date</label>
                      <div className="date-input-wrapper">
                        <span className="input-icon" style={{marginLeft:"-10px"}}>📅</span>
                        <input 
                          name="expenseDate" 
                          type="date" 
                          value={form.expenseDate} 
                          onChange={handleChange} 
                          className="form-input"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section summary-section">
                  <h3 className="section-title">
                    <span className="section-icon">📊</span>
                    Expense Summary
                  </h3>
                  <div className="summary-grid">                   
                    <div className="summary-item">
                      <span className="summary-label">Organization:</span>
                      <span className="summary-value">
                        {form.organizationName || 'Not selected'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Transaction Date:</span>
                      <span className="summary-value">
                        {form.transactionDate || 'Not entered'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Amount:</span>
                      <span className="summary-value amount">
                        {form.amount ? `₹${Number(form.amount).toLocaleString()}` : 'Not entered'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Type:</span>
                      <span className={`summary-value type-${getExpenseTypeColor()}`}>
                        {form.expenseType || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  <span className="btn-icon">←</span>
                  Back to Details
                </button>
                
                <div className="action-buttons">
                  <button 
                    type="button" 
                    className="btn-outline"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className={`btn-primary submit-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner-small"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">💾</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </PageCard>
    </div>
  );
}

export default EditExpense;