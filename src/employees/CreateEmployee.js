import React, { useState } from 'react';
import Sidebar from './../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { useNavigate } from 'react-router-dom';
import './Employees.css';

function CreateEmployee() {
  const [form, setForm] = useState({ name: '', skill: '', region: '', age: '', migrantWorker: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

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
    
    setLoading(true);
    try {
      const res = await fetch(APP_SERVER_URL_PREFIX + '/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: Number(form.age) })
      });
       console.log(res)
      if (!res.ok) throw new Error('Failed to create employee');
      
      setSuccess('Employee created successfully!');
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (err) {
      setError('Failed to create employee. Please try again.');
    } finally { 
      setLoading(false); 
    }
  };

  const clearForm = () => {
    setForm({ name: '', skill: '', region: '', age: '', migrantWorker: false });
    setTouched({});
    setError('');
    setSuccess('');
  };

  const getSkillSuggestions = () => {
    const skills = ['DEVELOPER', 'DESIGNER', 'MANAGER', 'ANALYST', 'TESTER', 'ADMIN', 'ENGINEER', 'SALES'];
    return skills;
  };

  const getRegionSuggestions = () => {
    const regions = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST', 'SOUTHWEST'];
    return regions;
  };

  const isFormValid = () => {
    return form.name && form.skill && (!form.age || (Number(form.age) >= 18 && Number(form.age) <= 100));
  };

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Create Employee">
        <div className="create-employee-form">
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
              <div className="form-section1">
                <h3 className="section-title">
                  <span className="section-icon">📋</span>
                  Basic Information
                </h3>
                <div className="form-grid1">
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
                     
                      <input 
                        name="age" 
                        type="number" 
                        value={form.age} 
                        onChange={handleChange} 
                        className={`form-input ${touched.age && form.age && (Number(form.age) < 18 || Number(form.age) > 100) ? 'error' : ''}`}
                        placeholder="EG:18 - 100"
                        min="18"
                        max="100"
                      />
                    </div>
                    {touched.age && form.age && (Number(form.age) < 18 || Number(form.age) > 100) && (
                      <div className="error-message">Age must be between 18 and 100</div>
                    )}
                  </div>
                  
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
             
            </div>
            <div className="form-actions2" >  
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => navigate('/employees')}
                  disabled={loading}
                >
                  <span className="btn-icon">←</span>
                  Back to List
                </button>
                <button 
                  type="submit" 
                  className={`btn-primary submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading || !isFormValid()}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Creating Employee...
                    </>
                  ) : (
                    <>
                      
                      Create Employee
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

  // Helper functions for styling
  function getSkillColor(skill) {
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
  }

  function getRegionIcon(region) {
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
  }
}

export default CreateEmployee;