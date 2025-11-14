import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './EditExpense.css'; 
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ description:'', amount:'', employeeId:'', organizationId:'' });
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`)
      .then(res => { if (!res.ok) throw new Error('fail'); return res.json(); })
      .then(json => {
        // Ensure organizationId is a string for dropdown matching
        let orgId = json.organizationId || '';
        if (typeof orgId !== 'string') orgId = String(orgId);
        setForm({ 
          description: json.description || '', 
          amount: json.amount || '', 
          employeeId: json.employeeId || '', 
          organizationId: orgId, 
          organizationName: '',
          expenseType: json.expenseType || '',
          expenseSubType: json.expenseSubType || ''
        });
      })
      .catch(() => setError('Unable to load expense'))
      .finally(() => setLoading(false));
      
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
      .then(res => res.json())
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => {});
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
      let temp = e.currentTarget.options[e.currentTarget.selectedIndex].text     
      setForm((f) => ({ ...f, organizationId: value, organizationName: temp }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setSuccess('');
    setLoading(true);
    
    try {
      const payload = { 
        description: form.description, 
        amount: Number(form.amount), 
        organizationId: form.organizationId || undefined,
        organizationName: form.organizationName || undefined 
      };
      if (form.employeeId) payload.employeeId = Number(form.employeeId);
      if (form.organizationId) payload.organizationId = form.organizationId;
      
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`, { 
        method: 'PATCH', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) {
        const data = await res.text();
        setError(data);
      } else {
        setSuccess('Expense updated successfully!');
        setTimeout(() => {
          navigate(`/pettycash/expenses/${id}`);
        }, 1500);
      }
    } catch (err) { 
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

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title={`Edit Expense`}>
        
        <div className={`edit-expense-header ${getExpenseTypeColor()}-header`}>
          <div className="header-content">
            <div className="header-icon">{getExpenseIcon()}</div>
             <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-number">{organizations.length}</span>
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

          {loading ? (
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
                      <label className="form-label required">Organization</label>
                      <select 
                        name="organizationId" 
                        value={form.organizationId} 
                        onChange={handleChange} 
                        className="form-select"
                        required
                      >
                        <option value="">Select organization</option>
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

                    <div className="form-group">
                      <label className="form-label required">Description</label>
                      <input 
                        name="description" 
                        value={form.description} 
                        onChange={handleChange} 
                        className="form-input"
                        placeholder="Enter expense description..."
                        maxLength={200}
                        required
                      />
                      <div className="char-count">{form.description.length}/200</div>
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
                        />
                      </div>
                    </div>

                    <div className="form-group">
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
                      <span className="summary-label">Expense ID:</span>
                      <span className="summary-value id">{id}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Organization:</span>
                      <span className="summary-value">
                        {organizations.find(org => String(org.id) === String(form.organizationId))?.name || 'Not selected'}
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