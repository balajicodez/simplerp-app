import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import "./pettyCashCreateExpense.css"
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_SERVER_URL_PREFIX } from "../constants.js";

function CreateExpense() {
  const [form, setForm] = useState({ 
    branchName: '', 
    amount: '', 
    employeeId: '', 
    subtype: '', 
    type: '', 
    expenseDate: new Date().toISOString().slice(0, 10), 
    referenceNumber: '', 
    file: null, 
    organizationId: '', 
    organizationName: '' 
  });
  const [organizations, setOrganizations] = useState([]);
  const [subtypes, setSubtypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

const getExpenseType = () => {
  const params = new URLSearchParams(location.search);
  let filterType = params.get('type');
  if (!filterType) {
    if (location.pathname.includes('expenses-inward') || location.pathname.includes('create') && location.search.includes('CASH-IN')) {
      filterType = 'CASH-IN';
    }
    if (location.pathname.includes('expenses-outward') || location.pathname.includes('create') && location.search.includes('CASH-OUT')) {
      filterType = 'CASH-OUT';
    }
  }
  return filterType || '';
};

  const getPageTitle = () => {
    const type = getExpenseType();
    if (type === 'CASH-IN') return 'Create Inward ';
    if (type === 'CASH-OUT') return 'Create Outward ';
    return 'Create Expense';
  };

  const getHeaderColor = () => {
    const type = getExpenseType();
    if (type === 'CASH-IN') return 'inward';
    if (type === 'CASH-OUT') return 'outward';
    return 'default';
  };

  const getExpenseIcon = () => {
    const type = getExpenseType();
    if (type === 'CASH-IN') return '💰';
    if (type === 'CASH-OUT') return '💸';
    return '📝';
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setError('');
    setSuccess('');
    
    if (type === 'file') {
      const file = files[0];
      setForm((f) => ({ ...f, file }));
      
      // Create preview for image files
      if (file && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl('');
      }
    } else if (name === 'organizationId') {
      const selectedOrg = organizations.find(org => String(org.id) === String(value));
      const orgName = e.currentTarget.options[e.currentTarget.selectedIndex].text;
      setForm((f) => ({ ...f, organizationId: value, organizationName: orgName }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };
  
useEffect(() => {
  let mounted = true;
  const expenseType = getExpenseType();
  
  // Automatically set the expense type based on the current page
  setForm(f => ({ ...f, type: expenseType }));

  fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters`)
    .then(res => {
      if (!res.ok) throw new Error('no masters');
      return res.json();
    })
    .then(json => {
      const list = (json._embedded && json._embedded.expenseTypeMasters) || json._embedded || json || [];
      // Filter subtypes based on the automatically determined expense type
      const vals = list
        .filter(m => m.type === expenseType) // Only get categories for current type
        .map(m => (m.subtype || m.subType)).filter(Boolean);
      const uniq = Array.from(new Set(vals));
      if (mounted) setSubtypes(uniq);
    })
    .catch(() => {
      // ignore failures — dropdown will be empty
    });

  // Fetch organizations for dropdown
  fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
    .then(res => res.json())
    .then(data => {
      const orgs = data._embedded ? data._embedded.organizations || [] : data;
      if (mounted) setOrganizations(orgs);
    })
    .catch(() => {});
    
  return () => { mounted = false; };
}, [location.pathname, location.search]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Enhanced validation
    if (!form.organizationId) {
      setError('Please select an organization');
      return;
    }
    if (!form.branchName.trim()) {
      setError('Please enter a branch name');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (subtypes.length > 0 && !form.subtype) {
      setError('Please select an expense category');
      return;
    }

    setLoading(true);
    try {
      let storedUser = null;
      try { 
        storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); 
      } catch (e) { 
        storedUser = null; 
      }
      
      const createdByUserId = storedUser && (storedUser.id || storedUser.userId) ? (storedUser.id || storedUser.userId) : null;
      const createdByUser = storedUser && (storedUser.name || storedUser.username || storedUser.email) ? (storedUser.name || storedUser.username || storedUser.email) : (localStorage.getItem('rememberedEmail') || '');
      const createdDate = new Date().toISOString().slice(0,10);

      const expensePayload = {
        branchName: form.branchName.trim(),
        amount: Number(form.amount),
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        expenseSubType: form.subtype,
        expenseType: form.type,
        organizationId: form.organizationId || undefined,
        organizationName: form.organizationName || undefined,
        createdByUserId,
        createdByUser,
        createdDate,
        expenseDate: form.expenseDate || undefined,
        referenceNumber: form.referenceNumber || undefined
      };

      const formData = new FormData();
      formData.append('expense', new Blob([JSON.stringify(expensePayload)], { type: 'application/json' }));
      if (form.file) formData.append('file', form.file);
      
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to create expense');
      
      setSuccess('Expense created successfully! Redirecting...');
      setTimeout(() => {
        if (form.type === 'CASH-IN') {
          navigate('/pettycash/expenses-inward');
        } else if (form.type === 'CASH-OUT') {
          navigate('/pettycash/expenses-outward');
        } else {
          navigate('/pettycash/expenses');
        }
      }, 2000);
      
    } catch (err) { 
      setError('Failed to create expense. Please try again.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const clearForm = () => {
    setForm({ 
      branchName: '', 
      amount: '', 
      employeeId: '', 
      subtype: '', 
      type: getExpenseType(), 
      expenseDate: new Date().toISOString().slice(0, 10), 
      referenceNumber: '', 
      file: null,
      organizationId: '',
      organizationName: ''
    });
    setPreviewUrl('');
    setError('');
    setSuccess('');
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'SALARY': '💼',
      'TRAVEL': '✈️',
      'OFFICE_SUPPLIES': '📦',
      'UTILITIES': '💡',
      'MAINTENANCE': '🔧',
      'MEALS': '🍽️',
      'TRANSPORT': '🚗',
      'OTHER': '📝'
    };
    return icons[category] || '💰';
  };

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title={getPageTitle()}>
        
        {/* Enhanced Header Section */}
        <div className={`create-expense-header ${getHeaderColor()}-header`}>
          <div className="header-content">
            
            <div className="header-icon">{getExpenseIcon()}</div>
             <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-number">{organizations.length}</span>
              <span className="stat-label">Organizations</span>
            </div>
            <div className="stat-badge">
              <span className="stat-number">{subtypes.length}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
            <div className="header-text">
              <h1>{getPageTitle()}</h1>
              <p>
                {getExpenseType() === 'CASH-IN' 
                  ? 'Record incoming cash transactions and receipts' 
                  : getExpenseType() === 'CASH-OUT'
                  ? 'Record outgoing cash expenses and payments'
                  : 'Create new expense record'
                }
              </p>
            </div>
          </div>
         
        </div>

        {/* Main Form */}
        <div className="create-expense-form">
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

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="form-sections">
              
              {/* Organization & Basic Info Section */}
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
                    <label className="form-label required">Branch Name</label>
                    <input 
                      name="branchName" 
                      value={form.branchName} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter branch name..."
                      maxLength={200}
                      required
                    />
                    <div className="char-count">{form.branchName.length}/200</div>
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

                 {subtypes.length > 0 && (
  <div className="form-group">
    <label className="form-label required">Expense Category</label>
    <select 
      name="subtype" 
      value={form.subtype} 
      onChange={handleChange} 
      className="form-select"
      required={subtypes.length > 0}
    >
      <option value="">Select category</option>
      {subtypes.map((s, i) => (
        <option key={i} value={s}>
          <span className="category-option">
            <span className="category-icon">{getCategoryIcon(s)}</span>
            {s}
          </span>
        </option>
      ))}
    </select>
  </div>
)}
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
                      />
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📋</span>
                  Additional Details
                </h3>
                <div className="form-grid enhanced-grid">
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
                        placeholder="Enter employee ID"
                      />
                    </div>
                  </div>

                 
                  <div className="form-group">
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
                      />
                    </div>
                    <div className="char-count">{form.referenceNumber.length}/50</div>
                  </div>
                </div>
              </div> */}

              {/* File Upload Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📎</span>
                  Receipt Attachment
                </h3>
                <div className="file-upload-section">
                  <div className={`file-upload-area ${form.file ? 'has-file' : ''}`}>
                    <input 
                      name="file" 
                      type="file" 
                      onChange={handleChange} 
                      className="file-input"
                      id="file-upload"
                      accept="image/*,.pdf,.doc,.docx,.xlsx"
                    />
                    <label htmlFor="file-upload" className="file-upload-label">
                      {form.file ? (
                        <>
                          <div className="upload-icon">✅</div>
                          <div className="upload-text">
                            <strong>File Selected</strong>
                            <span>Click to change file</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="upload-icon">📁</div>
                          <div className="upload-text">
                            <strong>Choose file</strong>
                            <span>or drag and drop here</span>
                            <small>Supports: JPG, PNG, PDF, DOC, XLSX (Max: 10MB)</small>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                  
                  {form.file && (
                    <div className="file-preview">
                      <div className="file-info">
                        <div className="file-icon">
                          {form.file.type.startsWith('image/') ? '🖼️' : '📄'}
                        </div>
                        <div className="file-details">
                          <div className="file-name">{form.file.name}</div>
                          <div className="file-meta">
                            <span className="file-size">
                              {(form.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="file-type">{form.file.type}</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="remove-file"
                          onClick={() => {
                            setForm(f => ({ ...f, file: null }));
                            setPreviewUrl('');
                          }}
                          title="Remove file"
                        >
                          ×
                        </button>
                      </div>
                      
                      {previewUrl && (
                        <div className="image-preview">
                          <div className="preview-header">
                            <span>Preview</span>
                            <button 
                              type="button"
                              className="preview-close"
                              onClick={() => setPreviewUrl('')}
                            >
                              ×
                            </button>
                          </div>
                          <img src={previewUrl} alt="Preview" className="preview-image" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="form-section summary-section">
                <h3 className="section-title">
                  <span className="section-icon">📊</span>
                  Expense Summary
                </h3>
                <div style={{display:"flex"}}>
                  <div className="summary-item">
                    <span className="summary-label">Organization:</span>
                    <span className="summary-value">
                      {form.organizationName || 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Branch:</span>
                    <span className="summary-value">
                      {form.branchName || 'Not entered'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Amount:</span>
                    <span className="summary-value amount">
                      {form.amount ? `₹${Number(form.amount).toLocaleString()}` : 'Not entered'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Category:</span>
                    <span className="summary-value">
                      {form.subtype || 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Type:</span>
                    <span className={`summary-value type-${getExpenseType().toLowerCase()}`}>
                      {getExpenseType() || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div> */}
            </div>

        
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={clearForm}
                disabled={loading}
              >
                <span className="btn-icon">🗑️</span>
                Clear Form
              </button>
              
              <div className="action-buttons">
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  <span className="btn-icon">←</span>
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
                      Creating Expense...
                    </>
                  ) : (
                    <>
                      Create Expense
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </PageCard>
    </div>
  );
}

export default CreateExpense;