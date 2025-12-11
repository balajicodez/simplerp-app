import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate } from 'react-router-dom';
import "./Organization.css"

function CreateOrganization({ onCreated }) {
  
  const [form, setForm] = useState({
    name: '',
    registrationNo: '',
    gstn: '',
    pan: '',
    contact: '',
    fax: '',
    email: '',
    website: '',
    status: 'Active',
  });
  const [parentOrganizationId, setParentOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleParentOrganizationChange = (e) => {
    setParentOrganizationId(e.target.value);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validation
    if (!form.name.trim()) {
      setError('Organization name is required');
      setLoading(false);
      return;
    }
    if (!form.contact.trim()) {
      setError('Contact information is required');
      setLoading(false);
      return;
    }

    try {
      // Prepare payload with parentOrganizationId as number
      const payload = {
        ...form
      };

      // Only add parentOrganizationId if one is selected
      if (parentOrganizationId) {
        payload.parentOrganizationId = Number(parentOrganizationId);
      }

      console.log('Sending payload:', payload);

      const res = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create organization');
      }
      
      setSuccess('Organization created successfully!');
      setTimeout(() => {
        if (onCreated) onCreated();
        navigate('/organization');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setForm({
      name: '',
      registrationNo: '',
      gstn: '',
      pan: '',
      contact: '',
      fax: '',
      email: '',
      website: '',
      status: 'Active',
    });
    setParentOrganizationId('');
    setError('');
    setSuccess('');
  };

  // Get the display name for the selected parent organization
  const getSelectedParentName = () => {
    if (!parentOrganizationId) return 'None';
    const selectedOrg = organizations.find(org => 
      String(org.id) === String(parentOrganizationId)
    );
    return selectedOrg ? selectedOrg.name : 'None';
  };

  // Extract organization ID from URI or use direct ID
  const getOrganizationId = (org) => {
    // If org has direct ID, use it
    if (org.id) return org.id;
    // Otherwise extract from URI
    if (org._links?.self?.href) {
      const parts = org._links.self.href.split('/');
      return parts[parts.length - 1];
    }
    return null;
  };

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Create Organization">
        
        {/* Header Section */}
        <div className="create-org-header">
          <div className="header-content">
            <div className="header-icon">🏢</div>
            <div className="header-text">
              <h1>Create New Organization</h1>
              <p>Add a new organization to the system with complete details</p>
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

        {/* Main Form */}
        <div className="create-org-form">
          <form onSubmit={handleSubmit}>
            <div className="form-sections">
              
              {/* Basic Information Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📋</span>
                  Basic Information
                </h3>
                <div className="form-grid enhanced-grid">
                  <div className="form-group">
                    <label className="form-label required">Organization Name</label>
                    <input 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter organization name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parent Organization</label>
                    <select 
                      value={parentOrganizationId} 
                      onChange={handleParentOrganizationChange} 
                      className="form-select"
                    >
                      <option value="">No Parent Organization</option>
                      {organizations.map(org => {
                        const orgId = getOrganizationId(org);
                        return orgId ? (
                          <option key={orgId} value={orgId}>
                            {org.name}
                          </option>
                        ) : null;
                      }).filter(Boolean)}
                    </select>
                    <div className="form-hint">
                      Select an existing organization as parent (optional)
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration Number</label>
                    <input 
                      name="registrationNo" 
                      value={form.registrationNo} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter registration number"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Status</label>
                    <select 
                      name="status" 
                      value={form.status} 
                      onChange={handleChange} 
                      className="form-select"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tax Information Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">💰</span>
                  Tax Information
                </h3>
                <div className="form-grid enhanced-grid">
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input 
                      name="gstn" 
                      value={form.gstn} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input 
                      name="pan" 
                      value={form.pan} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter PAN number"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📞</span>
                  Contact Information
                </h3>
                <div className="form-grid enhanced-grid">
                  <div className="form-group">
                    <label className="form-label required">Contact Number</label>
                    <input 
                      name="contact" 
                      value={form.contact} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter contact number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fax Number</label>
                    <input 
                      name="fax" 
                      value={form.fax} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter fax number"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      name="email" 
                      type="email"
                      value={form.email} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input 
                      name="website" 
                      value={form.website} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="form-section summary-section">
                <h3 className="section-title">
                  <span className="section-icon">📊</span>
                  Organization Summary
                </h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Name:</span>
                    <span className="summary-value">{form.name || 'Not entered'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Parent Organization:</span>
                    <span className="summary-value">{getSelectedParentName()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Status:</span>
                    <span className={`summary-value status-${form.status.toLowerCase()}`}>
                      {form.status}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Contact:</span>
                    <span className="summary-value">{form.contact || 'Not entered'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
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
                  onClick={() => navigate('/organization')}
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
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🏢</span>
                      Create Organization
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

export default CreateOrganization;