import React, { useState, useEffect } from 'react';
import Sidebar from './../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { useNavigate, useParams } from 'react-router-dom';
import './Employees.css';

function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', skill: '', region: '', age: '', migrantWorker: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/employees/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load employee');
        return res.json();
      })
      .then((json) => {
        const employeeData = {
          name: json.name || '',
          skill: json.skill || '',
          region: json.region || '',
          age: json.age || '',
          migrantWorker: !!json.migrantWorker
        };
        setForm(employeeData);
        setOriginalData(employeeData);
      })
      .catch(() => setError('Failed to load employee data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setError('');
    setSuccess('');
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!form.name || !form.skill) { 
      setError('Please fill all required fields'); 
      return; 
    }
    if (form.age && (Number(form.age) < 18 || Number(form.age) > 100)) { 
      setError('Age must be between 18 and 100'); 
      return; 
    }
    
    setSaving(true);
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: Number(form.age) })
      });
      if (!res.ok) throw new Error('Failed to update employee');
      
      setSuccess('Employee updated successfully!');
      setTimeout(() => {
        navigate(`/employees/${id}`);
      }, 1500);
    } catch (err) {
      setError('Failed to update employee. Please try again.');
    } finally { 
      setSaving(false); 
    }
  };

  const resetForm = () => {
    setForm(originalData);
    setTouched({});
    setError('');
    setSuccess('');
  };

  const hasChanges = () => {
    return JSON.stringify(form) !== JSON.stringify(originalData);
  };

  const isFormValid = () => {
    return form.name && form.skill && (!form.age || (Number(form.age) >= 18 && Number(form.age) <= 100));
  };

  const getSkillSuggestions = () => {
    const skills = ['DEVELOPER', 'DESIGNER', 'MANAGER', 'ANALYST', 'TESTER', 'ADMIN', 'ENGINEER', 'SALES'];
    return skills;
  };

  const getRegionSuggestions = () => {
    const regions = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST', 'SOUTHWEST'];
    return regions;
  };

  const getSkillColor = (skill) => {
    const skillColors = {
      'DEVELOPER': '#3b82f6',
      'DESIGNER': '#8b5cf6',
      'MANAGER': '#f59e0b',
      'ANALYST': '#10b981',
      'TESTER': '#ef4444',
      'ADMIN': '#6b7280',
      'ENGINEER': '#06b6d4',
      'SALES': '#84cc16'
    };
    return skillColors[skill] || '#6b7280';
  };

  const getRegionIcon = (region) => {
    const regionIcons = {
      'NORTH': '🧭',
      'SOUTH': '🌅',
      'EAST': '🌄',
      'WEST': '🏜️',
      'CENTRAL': '🏙️',
      'NORTHEAST': '🗻',
      'SOUTHWEST': '🌵'
    };
    return regionIcons[region] || '📍';
  };

  if (loading) {
    return (
      <div className="page-container">
        {/* <Sidebar isOpen={true} /> */}
        <PageCard title="Edit Employee">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading employee data...</p>
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* <Sidebar isOpen={true} /> */}
      <PageCard title={`Edit Employee`}>
        
        {/* Enhanced Header Section */}
        <div className="edit-employee-header">
          <div className="header-content">
            <div className="header-icon">✏️</div>
            <div className="header-text">
              <h1>Edit Employee #{id}</h1>
              <p>Update employee information and details</p>
              {hasChanges() && (
                <div className="changes-indicator">
                  <span className="changes-dot"></span>
                  Unsaved changes
                </div>
              )}
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-number">#{id}</span>
              <span className="stat-label">Employee ID</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">📝</span>
              <span className="stat-label">Edit Mode</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="edit-employee-form">
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
                    <label className="form-label required">Full Name</label>
                    <input 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      className={`form-input ${touched.name && !form.name ? 'error' : ''}`}
                      placeholder="Enter employee's full name"
                      maxLength={100}
                      required
                    />
                    {touched.name && !form.name && (
                      <div className="error-message">Name is required</div>
                    )}
                    <div className="char-count">{form.name.length}/100</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Skill/Position</label>
                    <input 
                      name="skill" 
                      value={form.skill} 
                      onChange={handleChange} 
                      className={`form-input ${touched.skill && !form.skill ? 'error' : ''}`}
                      placeholder="e.g., DEVELOPER, MANAGER"
                      list="skill-suggestions"
                      required
                    />
                    <datalist id="skill-suggestions">
                      {getSkillSuggestions().map((skill, index) => (
                        <option key={index} value={skill} />
                      ))}
                    </datalist>
                    {touched.skill && !form.skill && (
                      <div className="error-message">Skill is required</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Region</label>
                    <input 
                      name="region" 
                      value={form.region} 
                      onChange={handleChange} 
                      className="form-input"
                      placeholder="e.g., NORTH, SOUTH"
                      list="region-suggestions"
                    />
                    <datalist id="region-suggestions">
                      {getRegionSuggestions().map((region, index) => (
                        <option key={index} value={region} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <div className="age-input-wrapper">
                      <span className="input-icon">🎂</span>
                      <input 
                        name="age" 
                        type="number" 
                        value={form.age} 
                        onChange={handleChange} 
                        className={`form-input ${touched.age && form.age && (Number(form.age) < 18 || Number(form.age) > 100) ? 'error' : ''}`}
                        placeholder="18 - 100"
                        min="18"
                        max="100"
                      />
                    </div>
                    {touched.age && form.age && (Number(form.age) < 18 || Number(form.age) > 100) && (
                      <div className="error-message">Age must be between 18 and 100</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Employment Details Section */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">💼</span>
                  Employment Details
                </h3>
                <div className="employment-details">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="migrantWorker" 
                        checked={form.migrantWorker} 
                        onChange={handleChange} 
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">
                        <span className="checkbox-title">Migrant Worker</span>
                        <span className="checkbox-description">Employee is a migrant worker</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Employee Preview Section */}
              <div className="form-section preview-section">
                <h3 className="section-title">
                  <span className="section-icon">👁️</span>
                  Employee Preview
                </h3>
                <div className="preview-card">
                  <div className="preview-avatar">
                    {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="preview-details">
                    <div className="preview-name">
                      {form.name || 'Employee Name'}
                    </div>
                    <div className="preview-meta">
                      {form.skill && (
                        <span 
                          className="preview-skill"
                          style={{ backgroundColor: getSkillColor(form.skill) }}
                        >
                          {form.skill}
                        </span>
                      )}
                      {form.region && (
                        <span className="preview-region">
                          {getRegionIcon(form.region)} {form.region}
                        </span>
                      )}
                      {form.age && (
                        <span className="preview-age">
                          {form.age} years
                        </span>
                      )}
                      {form.migrantWorker && (
                        <span className="preview-migrant">
                          🌍 Migrant
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes Summary Section */}
              {hasChanges() && (
                <div className="form-section changes-section">
                  <h3 className="section-title">
                    <span className="section-icon">🔄</span>
                    Changes Summary
                  </h3>
                  <div className="changes-list">
                    {Object.keys(form).map(key => {
                      if (form[key] !== originalData[key]) {
                        return (
                          <div key={key} className="change-item">
                            <span className="change-field">{key}:</span>
                            <span className="change-from">"{originalData[key]}"</span>
                            <span className="change-arrow">→</span>
                            <span className="change-to">"{form[key]}"</span>
                          </div>
                        );
                      }
                      return null;
                    }).filter(Boolean)}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Form Actions */}
            <div className="form-actions">
              <div className="action-left">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={resetForm}
                  disabled={saving || !hasChanges()}
                >
                  <span className="btn-icon">🔄</span>
                  Reset Changes
                </button>
              </div>
              
              <div className="action-buttons">
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => navigate(`/employees/${id}`)}
                  disabled={saving}
                >
                  <span className="btn-icon">←</span>
                  View Details
                </button>
                
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => navigate('/employees')}
                  disabled={saving}
                >
                  Back to List
                </button>
                
                <button 
                  type="submit" 
                  className={`btn-primary submit-btn ${saving ? 'loading' : ''}`}
                  disabled={saving || !isFormValid() || !hasChanges()}
                >
                  {saving ? (
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
        </div>
      </PageCard>
    </div>
  );
}

export default EditEmployee;