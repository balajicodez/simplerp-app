import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate } from 'react-router-dom';
import "./Organization.css"

function ViewOrganization() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const bearerToken = localStorage.getItem('token');
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    })
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

  const filteredOrgs = orgs.filter(org => 
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.gstn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === 'Active' ? '#10b981' : '#ef4444';
  };

  const getStatusIcon = (status) => {
    return status === 'Active' ? '🟢' : '';
  };

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Organizations Management">
        
        {/* Header Section */}
        <div className="dashboard-header organizations-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Organizations</h1>
              <p>Manage all registered organizations and their details</p>
            </div>
            <button 
              className="btn-primary create-btn"
              onClick={() => navigate('/organization/create')}
            >
              <span className="btn-icon">🏢</span>
              Create Organization
            </button>
          </div>
          
          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <div className="stat-value">{orgs.length}</div>
                <div className="stat-label">Total Organizations</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🟢</div>
              <div className="stat-content">
                <div className="stat-value">
                  {orgs.filter(org => org.status === 'Active').length}
                </div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔴</div>
              <div className="stat-content">
                <div className="stat-value">
                  {orgs.filter(org => org.status === 'Inactive').length}
                </div>
                <div className="stat-label">Inactive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-box">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search organizations by name, email, GSTN, or status..."
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
        </div>

        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading organizations...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="modern-table organizations-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Registration</th>
                    <th>Tax Details</th>
                    <th>Contact Info</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        <div className="no-data-content">
                          <div className="no-data-icon">🏢</div>
                          <h3>
                            {searchTerm 
                              ? `No organizations found for "${searchTerm}"`
                              : 'No organizations found'
                            }
                          </h3>
                          <p>
                            {searchTerm 
                              ? 'Try adjusting your search criteria'
                              : 'Get started by creating your first organization'
                            }
                          </p>
                          {!searchTerm && (
                            <button 
                              className="btn-primary"
                              onClick={() => navigate('/organization/create')}
                            >
                              <span className="btn-icon">+</span>
                              Create First Organization
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="org-info-cell">
                          <div className="org-main-info">
                            <div className="org-name">{org.name}</div>
                            <div className="org-parent">
                              {org.parentOrganization ? (
                                <span className="parent-badge">
                                  Parent: {org.parentOrganization}
                                </span>
                              ) : (
                                <span className="no-parent">Root Organization</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="registration-cell">
                          <div className="registration-info">
                            <div className="reg-number">
                              {org.registrationNo || (
                                <span className="empty-field">Not provided</span>
                              )}
                            </div>
                            {org.website && (
                              <a 
                                href={org.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="website-link"
                              >
                                🌐 Website
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="tax-cell">
                          <div className="tax-details">
                            {org.gstn && (
                              <div className="tax-item">
                                <span className="tax-label">GSTN:</span>
                                <span className="tax-value">{org.gstn}</span>
                              </div>
                            )}
                            {org.pan && (
                              <div className="tax-item">
                                <span className="tax-label">PAN:</span>
                                <span className="tax-value">{org.pan}</span>
                              </div>
                            )}
                            {!org.gstn && !org.pan && (
                              <span className="empty-field">No tax details</span>
                            )}
                          </div>
                        </td>
                        <td className="contact-cell">
                          <div className="contact-details">
                            {org.contact && (
                              <div className="contact-item">
                                <span className="contact-icon">📞</span>
                                <span className="contact-value">{org.contact}</span>
                              </div>
                            )}
                            {org.email && (
                              <div className="contact-item">
                                <span className="contact-icon">✉️</span>
                                <a href={`mailto:${org.email}`} className="contact-value">
                                  {org.email}
                                </a>
                              </div>
                            )}
                            {org.fax && (
                              <div className="contact-item">
                                <span className="contact-icon">📠</span>
                                <span className="contact-value">{org.fax}</span>
                              </div>
                            )}
                            {!org.contact && !org.email && !org.fax && (
                              <span className="empty-field">No contact info</span>
                            )}
                          </div>
                        </td>
                        <td className="status-cell">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(org.status) }}
                          >
                            <span className="status-icon">
                              {getStatusIcon(org.status)}
                            </span>
                            {org.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Results Info */}
            {filteredOrgs.length > 0 && (
              <div className="results-info">
                Showing {filteredOrgs.length} of {orgs.length} organizations
                {searchTerm && (
                  <span className="search-info"> for "{searchTerm}"</span>
                )}
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  );
}

export default ViewOrganization;