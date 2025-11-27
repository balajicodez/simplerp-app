// import React, { useState, useEffect } from 'react';
// import Sidebar from './../Sidebar';
// import PageCard from '../components/PageCard';
// import { APP_SERVER_URL_PREFIX } from "../constants.js";
// import './Employees.css';
// import { useNavigate, useSearchParams } from 'react-router-dom';

// function Employees() {
//   const [employees, setEmployees] = useState([]);
//   const [links, setLinks] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
//   const navigate = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();
//   const pageParam = Number(searchParams.get('page') || 0);
//   const sizeParam = Number(searchParams.get('size') || 20);

//   const fetchUrl = async (url) => {
//     setLoading(true);
//     try {
//       const res = await fetch(url);
//       const json = await res.json();
//       const items = (json._embedded && json._embedded.employees) || json._embedded || [];
//       setEmployees(items);
//       setLinks(json._links || {});
//     } catch (err) {
//       console.error('Error fetching employees', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
   
//     const url = `${APP_SERVER_URL_PREFIX}/employees/search/findBySupervisorId?supervisorId=1&page=${pageParam}&size=${sizeParam}`;
//     fetchUrl(url);
//   }, [pageParam, sizeParam]);

//   const totalEmployees = employees.length;
//   const migrantCount = employees.filter(emp => emp.migrantWorker).length;
//   const averageAge = employees.length > 0 
//     ? Math.round(employees.reduce((sum, emp) => sum + (emp.age || 0), 0) / employees.length)
//     : 0;

//   const filteredEmployees = employees.filter(emp =>
//     emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     emp.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     emp.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     emp.age?.toString().includes(searchTerm)
//   );

//   // Sort employees
//   const sortedEmployees = React.useMemo(() => {
//     if (!sortConfig.key) return filteredEmployees;
    
//     return [...filteredEmployees].sort((a, b) => {
//       const aValue = a[sortConfig.key];
//       const bValue = b[sortConfig.key];
      
//       if (aValue == null && bValue == null) return 0;
//       if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
//       if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
      
//       if (typeof aValue === 'number' && typeof bValue === 'number') {
//         return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
//       }
      
//       const aString = String(aValue).toLowerCase();
//       const bString = String(bValue).toLowerCase();
      
//       if (aString < bString) {
//         return sortConfig.direction === 'ascending' ? -1 : 1;
//       }
//       if (aString > bString) {
//         return sortConfig.direction === 'ascending' ? 1 : -1;
//       }
//       return 0;
//     });
//   }, [filteredEmployees, sortConfig]);

//   const handleSort = (key) => {
//     setSortConfig(current => ({
//       key,
//       direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
//     }));
//   };

//   const getSortIcon = (key) => {
//     if (sortConfig.key !== key) return '↕️';
//     return sortConfig.direction === 'ascending' ? '↑' : '↓';
//   };

//   const getSkillColor = (skill) => {
//     const skillColors = {
//       'DEVELOPER': '#3b82f6',
//       'DESIGNER': '#8b5cf6',
//       'MANAGER': '#f59e0b',
//       'ANALYST': '#10b981',
//       'TESTER': '#ef4444',
//       'ADMIN': '#6b7280'
//     };
//     return skillColors[skill] || '#6b7280';
//   };

//   const getRegionIcon = (region) => {
//     const regionIcons = {
//       'NORTH': '🧭',
//       'SOUTH': '🌅',
//       'EAST': '🌄',
//       'WEST': '🏜️',
//       'CENTRAL': '🏙️'
//     };
//     return regionIcons[region] || '📍';
//   };

//   return (
//     <div className="page-container">
//       {/* <Sidebar isOpen={true} /> */}
//       <PageCard title="Employee Management">
        
//         <div className="employees-header">
//           <div className="header-content">
//             <div className="header-text">
//               <h1>Employee Directory</h1>
//               <p>Manage and view all employees in your organization</p>
//             </div>
//             <button 
//               className="btn-primary create-employee-btn"
//               onClick={() => navigate('/employees/create')}
//             >
//               <span className="btn-icon">+</span>
//               Add New Employee
//             </button>
//           </div>

//           <div className="stats-grid">
//             <div className="emp-stat-card employee-stat">
//               <div className="stat-icon">👥</div>
//               <div className="stat-content">
//                 <div className="stat-value">{totalEmployees}</div>
//                 <div className="stat-label">Total Employees</div>
//               </div>
//             </div>
//             <div className="emp-stat-card migrant-stat">
//               <div className="stat-icon">🌍</div>
//               <div className="stat-content">
//                 <div className="stat-value">{migrantCount}</div>
//                 <div className="stat-label">Migrant Workers</div>
//               </div>
//             </div>
//             <div className="emp-stat-card age-stat">
//               <div className="stat-icon">📊</div>
//               <div className="stat-content">
//                 <div className="stat-value">{averageAge}</div>
//                 <div className="stat-label">Average Age</div>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="filters-section">
//           <div className="filters-grid">
//             <div className="search-box">
//               <div className="search-icon">🔍</div>
//               <input
//                 type="text"
//                 placeholder="Search employees by name, skill, region, or age..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="search-input"
//               />
//               {searchTerm && (
//                 <button 
//                   className="clear-search"
//                   onClick={() => setSearchTerm('')}
//                   title="Clear search"
//                 >
//                   ×
//                 </button>
//               )}
//             </div>
            
//             <div className="filter-group">
//               <label>Items per page</label>
//               <select 
//                 value={sizeParam}
//                 onChange={(e) => setSearchParams({ page: 0, size: e.target.value })}
//                 className="filter-select"
//               >
//                 <option value={10}>10</option>
//                 <option value={20}>20</option>
//                 <option value={50}>50</option>
//                 <option value={100}>100</option>
//               </select>
//             </div>
//           </div>
//         </div>
//         {searchTerm && (
//           <div className="search-results-info">
//             Found {filteredEmployees.length} employees matching "{searchTerm}"
//             <button 
//               className="clear-search-btn"
//               onClick={() => setSearchTerm('')}
//             >
//               Clear search
//             </button>
//           </div>
//         )}

//         {loading ? (
//           <div className="loading-state">
//             <div className="loading-spinner"></div>
//             <p>Loading employees...</p>
//           </div>
//         ) : (
//           <>
//             <div className="table-container">
//               <table className="modern-table employees-table">
//                 <thead>
//                   <tr>
//                     <th 
//                       onClick={() => handleSort('name')}
//                       className="sortable-header"
//                     >
//                       <div className="th-content">
//                         <span>Employee</span>
//                         {getSortIcon('name')}
//                       </div>
//                     </th>
//                     <th 
//                       onClick={() => handleSort('skill')}
//                       className="sortable-header"
//                     >
//                       <div className="th-content">
//                         <span>Skill</span>
//                         {getSortIcon('skill')}
//                       </div>
//                     </th>
//                     <th 
//                       onClick={() => handleSort('region')}
//                       className="sortable-header"
//                     >
//                       <div className="th-content">
//                         <span>Region</span>
//                         {getSortIcon('region')}
//                       </div>
//                     </th>
//                     <th 
//                       onClick={() => handleSort('age')}
//                       className="sortable-header"
//                     >
//                       <div className="th-content">
//                         <span>Age</span>
//                         {getSortIcon('age')}
//                       </div>
//                     </th>
//                     <th 
//                       onClick={() => handleSort('migrantWorker')}
//                       className="sortable-header"
//                     >
//                       <div className="th-content">
//                         <span>Migrant</span>
//                         {getSortIcon('migrantWorker')}
//                       </div>
//                     </th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {sortedEmployees.length === 0 ? (
//                     <tr>
//                       <td colSpan="6" className="no-data">
//                         <div className="no-data-content">
//                           <div className="no-data-icon">👥</div>
//                           <p>
//                             {searchTerm 
//                               ? `No employees found for "${searchTerm}"`
//                               : 'No employees found'
//                             }
//                           </p>
//                           {!searchTerm && (
//                             <button 
//                               className="btn-primary"
//                               onClick={() => navigate('/employees/create')}
//                             >
//                               Add First Employee
//                             </button>
//                           )}
//                           {searchTerm && (
//                             <button 
//                               className="btn-secondary"
//                               onClick={() => setSearchTerm('')}
//                             >
//                               Clear Search
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     sortedEmployees.map((emp, idx) => (
//                       <tr key={idx} className="table-row employee-row">
//                         <td className="employee-cell">
//                           <div className="employee-info">
//                             <div className="employee-avatar">
//                               {emp.name?.charAt(0)?.toUpperCase() || 'E'}
//                             </div>
//                             <div className="employee-details">
//                               <div className="employee-name">{emp.name || 'Unknown'}</div>
//                               <div className="employee-id">ID: {emp.id || 'N/A'}</div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="skill-cell">
//                           <span 
//                             className="skill-badge"
//                             style={{ backgroundColor: getSkillColor(emp.skill) }}
//                           >
//                             {emp.skill || 'Not specified'}
//                           </span>
//                         </td>
//                         <td className="region-cell">
//                           <div className="region-info">
//                             <span className="region-icon">{getRegionIcon(emp.region)}</span>
//                             <span className="region-text">{emp.region || 'Unknown'}</span>
//                           </div>
//                         </td>
//                         <td className="age-cell">
//                           <div className="age-display">
//                             <span className="age-value">{emp.age || 'N/A'}</span>
//                             <span className="age-label">years</span>
//                           </div>
//                         </td>
//                         <td className="migrant-cell">
//                           <div className={`migrant-status ${emp.migrantWorker ? 'migrant-yes' : 'migrant-no'}`}>
//                             <span className="status-dot"></span>
//                             {emp.migrantWorker ? 'Yes' : 'No'}
//                           </div>
//                         </td>
//                         <td className="actions-cell">
//                           <button 
//                             className="btn-outline view-btn"
//                             onClick={() => navigate(`/employees/${emp.id || emp._links.self.href.split('/').pop()}`)}
//                           >
//                             <span className="btn-icon">👁️</span>
//                             View
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Enhanced Pagination */}
//             {sortedEmployees.length > 0 && (
//               <div className="pagination-section">
//                 <div className="pagination-info">
//                   <div className="pagination-stats">
//                     Showing <strong>{sortedEmployees.length}</strong> of many employees
//                   </div>
//                   <div className="pagination-summary">
//                     Page {pageParam + 1} • {migrantCount} migrant workers
//                   </div>
//                 </div>
//                 <div className="pagination-controls">
//                   <button 
//                     className="btn-outline"
//                     disabled={!(links.prev || pageParam > 0)}
//                     onClick={() => {
//                       if (links.prev) return fetchUrl(links.prev.href);
//                       const prev = Math.max(0, pageParam - 1);
//                       setSearchParams({ page: prev, size: sizeParam });
//                     }}
//                   >
//                     ← Previous
//                   </button>
//                   <div className="page-indicator">
//                     Page {pageParam + 1}
//                   </div>
//                   <button 
//                     className="btn-outline"
//                     disabled={!(links.next || employees.length >= sizeParam)}
//                     onClick={() => {
//                       if (links.next) return fetchUrl(links.next.href);
//                       const next = pageParam + 1;
//                       setSearchParams({ page: next, size: sizeParam });
//                     }}
//                   >
//                     Next →
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </PageCard>
//     </div>
//   );
// }

// export default Employees;


import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from './../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import './Employees.css';

// Static Data for Testing
const STATIC_EMPLOYEES = [
  {
    id: 1,
    employeeNo: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Michael',
    employmentType: { id: 1, name: 'FULL_TIME' },
    status: { id: 1, name: 'ACTIVE' },
    organization: { id: 1, name: 'Tech Corp' },
    otherInfo: {
      skill: 'DEVELOPER',
      region: 'NORTH',
      age: '28',
      migrantWorker: 'false'
    }
  },
  {
    id: 2,
    employeeNo: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    middleName: 'Elizabeth',
    employmentType: { id: 2, name: 'PART_TIME' },
    status: { id: 1, name: 'ACTIVE' },
    organization: { id: 1, name: 'Tech Corp' },
    otherInfo: {
      skill: 'DESIGNER',
      region: 'SOUTH',
      age: '32',
      migrantWorker: 'true'
    }
  },
  {
    id: 3,
    employeeNo: 'EMP003',
    firstName: 'Mike',
    lastName: 'Johnson',
    middleName: 'Robert',
    employmentType: { id: 1, name: 'FULL_TIME' },
    status: { id: 2, name: 'INACTIVE' },
    organization: { id: 1, name: 'Tech Corp' },
    otherInfo: {
      skill: 'MANAGER',
      region: 'CENTRAL',
      age: '45',
      migrantWorker: 'false'
    }
  },
  {
    id: 4,
    employeeNo: 'EMP004',
    firstName: 'Sarah',
    lastName: 'Williams',
    middleName: 'Anne',
    employmentType: { id: 3, name: 'CONTRACT' },
    status: { id: 1, name: 'ACTIVE' },
    organization: { id: 1, name: 'Tech Corp' },
    otherInfo: {
      skill: 'ANALYST',
      region: 'EAST',
      age: '29',
      migrantWorker: 'true'
    }
  },
  {
    id: 5,
    employeeNo: 'EMP005',
    firstName: 'David',
    lastName: 'Brown',
    middleName: 'James',
    employmentType: { id: 1, name: 'FULL_TIME' },
    status: { id: 1, name: 'ACTIVE' },
    organization: { id: 1, name: 'Tech Corp' },
    otherInfo: {
      skill: 'DEVELOPER',
      region: 'WEST',
      age: '35',
      migrantWorker: 'false'
    }
  }
];

// Constants
const SKILL_COLORS = {
  'DEVELOPER': '#3b82f6',
  'DESIGNER': '#8b5cf6',
  'MANAGER': '#f59e0b',
  'ANALYST': '#10b981',
  'TESTER': '#ef4444',
  'ADMIN': '#6b7280',
  'ENGINEER': '#06b6d4',
  'SALES': '#84cc16'
};

const REGION_ICONS = {
  'NORTH': '🧭',
  'SOUTH': '🌅',
  'EAST': '🌄',
  'WEST': '🏜️',
  'CENTRAL': '🏙️',
  'NORTHEAST': '🗻',
  'SOUTHWEST': '🌵'
};

const EMPLOYMENT_TYPES = [
  { id: 1, name: 'FULL_TIME', label: 'Full Time' },
  { id: 2, name: 'PART_TIME', label: 'Part Time' },
  { id: 3, name: 'CONTRACT', label: 'Contract' },
  { id: 4, name: 'INTERN', label: 'Intern' }
];

const EMPLOYEE_STATUS = [
  { id: 1, name: 'ACTIVE', label: 'Active' },
  { id: 2, name: 'INACTIVE', label: 'Inactive' },
  { id: 3, name: 'SUSPENDED', label: 'Suspended' }
];

const SKILL_SUGGESTIONS = ['DEVELOPER', 'DESIGNER', 'MANAGER', 'ANALYST', 'TESTER', 'ADMIN', 'ENGINEER', 'SALES'];
const REGION_SUGGESTIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST', 'SOUTHWEST'];
const PAGE_SIZES = [5, 10, 20, 50];

// Utility Functions
const EmployeeUtils = {
  getSkillColor: (skill) => SKILL_COLORS[skill] || '#6b7280',
  
  getRegionIcon: (region) => REGION_ICONS[region] || '📍',
  
  getEmploymentTypeLabel: (typeName) => {
    const type = EMPLOYMENT_TYPES.find(t => t.name === typeName);
    return type ? type.label : typeName;
  },
  
  getStatusLabel: (statusName) => {
    const status = EMPLOYEE_STATUS.find(s => s.name === statusName);
    return status ? status.label : statusName;
  },
  
  getStatusColor: (statusName) => {
    const colors = {
      'ACTIVE': '#10b981',
      'INACTIVE': '#6b7280',
      'SUSPENDED': '#ef4444'
    };
    return colors[statusName] || '#6b7280';
  },
  
  calculateStats: (employees) => ({
    total: employees.length,
    activeCount: employees.filter(emp => emp.status?.name === 'ACTIVE').length,
    migrantCount: employees.filter(emp => 
      emp.otherInfo?.migrantWorker === 'true' || emp.otherInfo?.migrantWorker === true
    ).length,
    averageAge: employees.length > 0 
      ? Math.round(employees.reduce((sum, emp) => {
          const age = parseInt(emp.otherInfo?.age) || 0;
          return sum + age;
        }, 0) / employees.length)
      : 0
  }),

  getFullName: (employee) => {
    return `${employee.firstName} ${employee.middleName ? employee.middleName + ' ' : ''}${employee.lastName}`.trim();
  },

  validateEmployee: (form) => {
    const errors = [];
    if (!form.firstName) errors.push('First name is required');
    if (!form.lastName) errors.push('Last name is required');
    if (!form.employeeNo) errors.push('Employee number is required');
    if (!form.employmentType) errors.push('Employment type is required');
    if (!form.status) errors.push('Status is required');
    
    if (form.otherInfo?.age && (Number(form.otherInfo.age) < 18 || Number(form.otherInfo.age) > 100)) {
      errors.push('Age must be between 18 and 100');
    }
    return errors;
  }
};

// Custom Hooks
const useEmployeeData = (url) => {
  const [data, setData] = useState({ employees: [], links: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async (fetchUrl) => {
    setLoading(true);
    setError('');
    try {
      // For now, using static data. Replace with actual API call when backend is ready
      // const res = await fetch(fetchUrl);
      // if (!res.ok) throw new Error('Failed to fetch data');
      // const json = await res.json();
      // const items = (json._embedded && json._embedded.employees) || json._embedded || [];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use static data for now
      const items = STATIC_EMPLOYEES;
      setData({ employees: items, links: {} });
    } catch (err) {
      setError('Error fetching data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
};

const useSortableData = (items, config = { key: '', direction: '' }) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;
    
    return [...items].sort((a, b) => {
      let aValue, bValue;

      // Handle nested properties
      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      } else if (sortConfig.key === 'name') {
        aValue = EmployeeUtils.getFullName(a);
        bValue = EmployeeUtils.getFullName(b);
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (aString < bString) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  return { items: sortedItems, sortConfig, requestSort };
};

// Common Components
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="loading-state">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

const Alert = ({ type, message, onClose }) => (
  <div className={`alert alert-${type}`}>
    <div className="alert-icon">
      {type === 'error' ? '⚠️' : '✅'}
    </div>
    <div className="alert-content">
      <strong>{type === 'error' ? 'Error:' : 'Success:'}</strong> {message}
    </div>
    {onClose && (
      <button className="alert-close" onClick={onClose}>×</button>
    )}
  </div>
);

const EmployeeForm = ({ 
  mode, 
  employee, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [form, setForm] = useState({
    employeeNo: '',
    firstName: '',
    lastName: '',
    middleName: '',
    employmentType: '',
    status: '',
    otherInfo: {
      skill: '',
      region: '',
      age: '',
      migrantWorker: false
    }
  });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (employee) {
      setForm({
        employeeNo: employee.employeeNo || '',
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        middleName: employee.middleName || '',
        employmentType: employee.employmentType?.name || '',
        status: employee.status?.name || '',
        otherInfo: {
          skill: employee.otherInfo?.skill || '',
          region: employee.otherInfo?.region || '',
          age: employee.otherInfo?.age || '',
          migrantWorker: employee.otherInfo?.migrantWorker === 'true' || employee.otherInfo?.migrantWorker === true || false
        }
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    setError('');
    setSuccess('');

    if (name.startsWith('otherInfo.')) {
      const field = name.split('.')[1];
      setForm(f => ({
        ...f,
        otherInfo: {
          ...f.otherInfo,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = EmployeeUtils.validateEmployee(form);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setError('');
    
    // Prepare data for submission
    const submitData = {
      ...form,
      employmentType: { name: form.employmentType },
      status: { name: form.status },
      organization: { id: 1 }, // Static org ID for now
      otherInfo: {
        ...form.otherInfo,
        migrantWorker: form.otherInfo.migrantWorker.toString()
      }
    };

    await onSubmit(submitData);
  };

  const clearForm = () => {
    setForm({
      employeeNo: '',
      firstName: '',
      lastName: '',
      middleName: '',
      employmentType: '',
      status: '',
      otherInfo: {
        skill: '',
        region: '',
        age: '',
        migrantWorker: false
      }
    });
    setTouched({});
    setError('');
    setSuccess('');
  };

  const isFormValid = () => {
    return form.firstName && form.lastName && form.employeeNo && 
           form.employmentType && form.status &&
           (!form.otherInfo.age || (Number(form.otherInfo.age) >= 18 && Number(form.otherInfo.age) <= 100));
  };

  return (
    <div className="employee-form-container">
      {/* Header Section */}
      <div className="employee-form-header">
        <div className="header-content">
          <div className="header-icon">{mode === 'create' ? '👤' : '✏️'}</div>
          <div className="header-text">
            <h1>{mode === 'create' ? 'Add New Employee' : `Edit Employee #${employee?.employeeNo}`}</h1>
            <p>
              {mode === 'create' 
                ? 'Create a new employee record in the system' 
                : 'Update employee information and details'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="employee-form-content">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit}>
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📋</span>
                Employee Information
              </h3>
              <div className="form-grid enhanced-grid">
                <div className="form-group">
                  <label className="form-label required">Employee Number</label>
                  <input 
                    name="employeeNo" 
                    value={form.employeeNo} 
                    onChange={handleChange} 
                    className={`form-input ${touched.employeeNo && !form.employeeNo ? 'error' : ''}`}
                    placeholder="EMP001"
                    required
                  />
                  {touched.employeeNo && !form.employeeNo && (
                    <div className="error-message">Employee number is required</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">First Name</label>
                  <input 
                    name="firstName" 
                    value={form.firstName} 
                    onChange={handleChange} 
                    className={`form-input ${touched.firstName && !form.firstName ? 'error' : ''}`}
                    placeholder="John"
                    required
                  />
                  {touched.firstName && !form.firstName && (
                    <div className="error-message">First name is required</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <input 
                    name="middleName" 
                    value={form.middleName} 
                    onChange={handleChange} 
                    className="form-input"
                    placeholder="Michael"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Last Name</label>
                  <input 
                    name="lastName" 
                    value={form.lastName} 
                    onChange={handleChange} 
                    className={`form-input ${touched.lastName && !form.lastName ? 'error' : ''}`}
                    placeholder="Doe"
                    required
                  />
                  {touched.lastName && !form.lastName && (
                    <div className="error-message">Last name is required</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">Employment Type</label>
                  <select 
                    name="employmentType" 
                    value={form.employmentType} 
                    onChange={handleChange}
                    className={`form-input ${touched.employmentType && !form.employmentType ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select Type</option>
                    {EMPLOYMENT_TYPES.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {touched.employmentType && !form.employmentType && (
                    <div className="error-message">Employment type is required</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">Status</label>
                  <select 
                    name="status" 
                    value={form.status} 
                    onChange={handleChange}
                    className={`form-input ${touched.status && !form.status ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select Status</option>
                    {EMPLOYEE_STATUS.map(status => (
                      <option key={status.id} value={status.name}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {touched.status && !form.status && (
                    <div className="error-message">Status is required</div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">💼</span>
                Additional Information
              </h3>
              <div className="form-grid enhanced-grid">
                <div className="form-group">
                  <label className="form-label">Skill/Position</label>
                  <input 
                    name="otherInfo.skill" 
                    value={form.otherInfo.skill} 
                    onChange={handleChange} 
                    className="form-input"
                    placeholder="e.g., DEVELOPER, MANAGER"
                    list="skill-suggestions"
                  />
                  <datalist id="skill-suggestions">
                    {SKILL_SUGGESTIONS.map((skill, index) => (
                      <option key={index} value={skill} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label className="form-label">Region</label>
                  <input 
                    name="otherInfo.region" 
                    value={form.otherInfo.region} 
                    onChange={handleChange} 
                    className="form-input"
                    placeholder="e.g., NORTH, SOUTH"
                    list="region-suggestions"
                  />
                  <datalist id="region-suggestions">
                    {REGION_SUGGESTIONS.map((region, index) => (
                      <option key={index} value={region} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input 
                    name="otherInfo.age" 
                    type="number" 
                    value={form.otherInfo.age} 
                    onChange={handleChange} 
                    className={`form-input ${touched.age && form.otherInfo.age && (Number(form.otherInfo.age) < 18 || Number(form.otherInfo.age) > 100) ? 'error' : ''}`}
                    placeholder="18 - 100"
                    min="18"
                    max="100"
                  />
                  {touched.age && form.otherInfo.age && (Number(form.otherInfo.age) < 18 || Number(form.otherInfo.age) > 100) && (
                    <div className="error-message">Age must be between 18 and 100</div>
                  )}
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="otherInfo.migrantWorker" 
                      checked={form.otherInfo.migrantWorker} 
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

            {/* Preview Section */}
            <div className="form-section preview-section">
              <h3 className="section-title">
                <span className="section-icon">👁️</span>
                Employee Preview
              </h3>
              <div className="preview-card">
                <div className="preview-avatar">
                  {form.firstName ? form.firstName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="preview-details">
                  <div className="preview-name">
                    {EmployeeUtils.getFullName(form) || 'Employee Name'}
                  </div>
                  <div className="preview-id">
                    {form.employeeNo || 'EMP000'}
                  </div>
                  <div className="preview-meta">
                    {form.employmentType && (
                      <span className="preview-type">
                        {EmployeeUtils.getEmploymentTypeLabel(form.employmentType)}
                      </span>
                    )}
                    {form.status && (
                      <span 
                        className="preview-status"
                        style={{ color: EmployeeUtils.getStatusColor(form.status) }}
                      >
                        {EmployeeUtils.getStatusLabel(form.status)}
                      </span>
                    )}
                    {form.otherInfo.skill && (
                      <span 
                        className="preview-skill"
                        style={{ backgroundColor: EmployeeUtils.getSkillColor(form.otherInfo.skill) }}
                      >
                        {form.otherInfo.skill}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            {mode === 'create' ? (
              <>
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
                    onClick={onCancel}
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
                        <span className="btn-icon">👤</span>
                        Create Employee
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="action-buttons">
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => onCancel('view')}
                  disabled={loading}
                >
                  <span className="btn-icon">←</span>
                  View Details
                </button>
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={onCancel}
                  disabled={loading}
                >
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
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Components
export const EmployeeList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  
  const pageParam = Number(searchParams.get('page') || 0);
  const sizeParam = Number(searchParams.get('size') || 5);

  const url = `${APP_SERVER_URL_PREFIX}/employees/search/findBySupervisorId?supervisorId=1&page=${pageParam}&size=${sizeParam}`;
  const { data, loading, error, fetchData } = useEmployeeData(url);
  
  const filteredEmployees = data.employees.filter(emp =>
    EmployeeUtils.getFullName(emp).toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.otherInfo?.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.otherInfo?.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employmentType?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { items: sortedEmployees, requestSort, sortConfig } = useSortableData(filteredEmployees);

  const stats = EmployeeUtils.calculateStats(data.employees);

  useEffect(() => {
    fetchData(url);
  }, [pageParam, sizeParam]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  if (error) {
    return (
      <div className="page-container">
        <PageCard title="Employee Management">
          <Alert type="error" message={error} />
        </PageCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageCard title="Employee Management">
        {/* Header Section */}
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

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="emp-stat-card employee-stat">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Employees</div>
              </div>
            </div>
            <div className="emp-stat-card migrant-stat">
              <div className="stat-icon">🌍</div>
              <div className="stat-content">
                <div className="stat-value">{stats.migrantCount}</div>
                <div className="stat-label">Migrant Workers</div>
              </div>
            </div>
            <div className="emp-stat-card active-stat">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.activeCount}</div>
                <div className="stat-label">Active Employees</div>
              </div>
            </div>
            {/* <div className="emp-stat-card age-stat">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.averageAge}</div>
                <div className="stat-label">Average Age</div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="search-box">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search by name, employee number, skill, region..."
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
                {PAGE_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
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
          <LoadingSpinner message="Loading employees..." />
        ) : (
          <>
            {/* Employees Table */}
            <div className="table-container">
              <table className="modern-table employees-table">
                <thead>
                  <tr>
                    {[
                      { key: 'name', label: 'Employee' },
                      { key: 'employeeNo', label: 'Employee No' },
                      { key: 'employmentType.name', label: 'Employment Type' },
                      { key: 'otherInfo.skill', label: 'Skill' },
                      { key: 'otherInfo.region', label: 'Region' },
                      { key: 'otherInfo.age', label: 'Age' },
                      { key: 'status.name', label: 'Status' },
                      { key: 'actions', label: 'Actions', sortable: false }
                    ].map(({ key, label, sortable = true }) => (
                      <th 
                        key={key}
                        onClick={sortable ? () => requestSort(key) : undefined}
                        className={sortable ? 'sortable-header' : ''}
                      >
                        <div className="th-content">
                          <span>{label}</span>
                          {sortable && getSortIcon(key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
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
                    sortedEmployees.map((emp) => (
                      <tr key={emp.id} className="table-row employee-row">
                        <td className="employee-cell">
                          <div className="employee-info">
                            <div className="employee-avatar">
                              {emp.firstName?.charAt(0)?.toUpperCase() || 'E'}
                            </div>
                            <div className="employee-details">
                              <div className="employee-name">
                                {EmployeeUtils.getFullName(emp)}
                              </div>
                              <div className="employee-position">
                                {emp.employmentType && EmployeeUtils.getEmploymentTypeLabel(emp.employmentType.name)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="employee-no-cell">
                          <div className="employee-no">
                            {emp.employeeNo}
                          </div>
                        </td>
                        <td className="type-cell">
                          <span className="employment-type">
                            {emp.employmentType && EmployeeUtils.getEmploymentTypeLabel(emp.employmentType.name)}
                          </span>
                        </td>
                        <td className="skill-cell">
                          {emp.otherInfo?.skill && (
                            <span 
                              className="skill-badge"
                              style={{ backgroundColor: EmployeeUtils.getSkillColor(emp.otherInfo.skill) }}
                            >
                              {emp.otherInfo.skill}
                            </span>
                          )}
                        </td>
                        <td className="region-cell">
                          {emp.otherInfo?.region && (
                            <div className="region-info">
                              <span className="region-icon">
                                {EmployeeUtils.getRegionIcon(emp.otherInfo.region)}
                              </span>
                              <span className="region-text">{emp.otherInfo.region}</span>
                            </div>
                          )}
                        </td>
                        <td className="age-cell">
                          {emp.otherInfo?.age && (
                            <div className="age-display">
                              <span className="age-value">{emp.otherInfo.age}</span>
                              <span className="age-label">years</span>
                            </div>
                          )}
                        </td>
                        <td className="status-cell">
                          {emp.status && (
                            <div 
                              className="status-badge"
                              style={{ 
                                backgroundColor: EmployeeUtils.getStatusColor(emp.status.name) + '20',
                                color: EmployeeUtils.getStatusColor(emp.status.name)
                              }}
                            >
                              {EmployeeUtils.getStatusLabel(emp.status.name)}
                            </div>
                          )}
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="btn-outline view-btn"
                            onClick={() => navigate(`/employees/${emp.id}`)}
                          >
                            <span className="btn-icon">👁️</span>
                            View
                          </button>
                          <button 
                            className="btn-outline edit-btn"
                            onClick={() => navigate(`/employees/${emp.id}/edit`)}
                          >
                            <span className="btn-icon">✏️</span>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sortedEmployees.length > 0 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  <div className="pagination-stats">
                    Showing <strong>{sortedEmployees.length}</strong> of <strong>{data.employees.length}</strong> employees
                  </div>
                  <div className="pagination-summary">
                    Page {pageParam + 1} • {stats.activeCount} active • {stats.migrantCount} migrant workers
                  </div>
                </div>
                <div className="pagination-controls">
                  <button 
                    className="btn-outline"
                    disabled={pageParam === 0}
                    onClick={() => {
                      const prev = Math.max(0, pageParam - 1);
                      setSearchParams({ page: prev, size: sizeParam });
                    }}
                  >
                    ← Previous
                  </button>
                  <div className="page-indicator">
                    Page {pageParam + 1} of {Math.ceil(data.employees.length / sizeParam)}
                  </div>
                  <button 
                    className="btn-outline"
                    disabled={pageParam >= Math.ceil(data.employees.length / sizeParam) - 1}
                    onClick={() => {
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
};

export const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useEmployeeData(
    id ? `${APP_SERVER_URL_PREFIX}/employees/${id}` : ''
  );

  const employee = data.employees.find(emp => emp.id === parseInt(id)) || data.employees[0];

  if (loading) {
    return (
      <div className="page-container">
        <PageCard title="Employee Details">
          <LoadingSpinner message="Loading employee data..." />
        </PageCard>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="page-container">
        <PageCard title="Employee Details">
          <Alert type="error" message={error || "Employee not found"} />
          <button 
            className="btn-primary"
            onClick={() => navigate('/employees')}
          >
            Back to List
          </button>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageCard title={`Employee Details - ${employee.employeeNo}`}>
        <div className="employee-details-container">
          <div className="employee-header">
            <div className="employee-avatar large">
              {employee.firstName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="employee-header-info">
              <h1>{EmployeeUtils.getFullName(employee)}</h1>
              <p className="employee-id">Employee ID: {employee.employeeNo}</p>
              <div className="employee-tags">
                <span 
                  className="status-tag"
                  style={{ 
                    backgroundColor: EmployeeUtils.getStatusColor(employee.status?.name) + '20',
                    color: EmployeeUtils.getStatusColor(employee.status?.name)
                  }}
                >
                  {EmployeeUtils.getStatusLabel(employee.status?.name)}
                </span>
                <span className="type-tag">
                  {EmployeeUtils.getEmploymentTypeLabel(employee.employmentType?.name)}
                </span>
              </div>
            </div>
          </div>

          <div className="details-grid">
            <div className="details-section">
              <h3>Personal Information</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <th>First Name</th>
                    <td>{employee.firstName}</td>
                  </tr>
                  <tr>
                    <th>Middle Name</th>
                    <td>{employee.middleName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Last Name</th>
                    <td>{employee.lastName}</td>
                  </tr>
                  <tr>
                    <th>Employee Number</th>
                    <td>{employee.employeeNo}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="details-section">
              <h3>Employment Details</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <th>Employment Type</th>
                    <td>{EmployeeUtils.getEmploymentTypeLabel(employee.employmentType?.name)}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span 
                        style={{ color: EmployeeUtils.getStatusColor(employee.status?.name) }}
                      >
                        {EmployeeUtils.getStatusLabel(employee.status?.name)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Organization</th>
                    <td>{employee.organization?.name || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {employee.otherInfo && (
              <div className="details-section">
                <h3>Additional Information</h3>
                <table className="details-table">
                  <tbody>
                    {employee.otherInfo.skill && (
                      <tr>
                        <th>Skill</th>
                        <td>
                          <span 
                            className="skill-badge"
                            style={{ backgroundColor: EmployeeUtils.getSkillColor(employee.otherInfo.skill) }}
                          >
                            {employee.otherInfo.skill}
                          </span>
                        </td>
                      </tr>
                    )}
                    {employee.otherInfo.region && (
                      <tr>
                        <th>Region</th>
                        <td>
                          <div className="region-info">
                            <span className="region-icon">
                              {EmployeeUtils.getRegionIcon(employee.otherInfo.region)}
                            </span>
                            {employee.otherInfo.region}
                          </div>
                        </td>
                      </tr>
                    )}
                    {employee.otherInfo.age && (
                      <tr>
                        <th>Age</th>
                        <td>{employee.otherInfo.age} years</td>
                      </tr>
                    )}
                    <tr>
                      <th>Migrant Worker</th>
                      <td>
                        <span className={`migrant-status ${employee.otherInfo.migrantWorker === 'true' ? 'migrant-yes' : 'migrant-no'}`}>
                          <span className="status-dot"></span>
                          {employee.otherInfo.migrantWorker === 'true' ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="employee-actions">
            <button 
              className="btn-outline"
              onClick={() => navigate('/employees')}
            >
              ← Back to List
            </button>
            <button 
              className="btn-primary"
              onClick={() => navigate(`/employees/${id}/edit`)}
            >
              ✏️ Edit Employee
            </button>
          </div>
        </div>
      </PageCard>
    </div>
  );
};

export const CreateEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just show success and redirect
      console.log('Creating employee:', formData);
      setSuccess('Employee created successfully!');
      
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (err) {
      throw new Error('Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageCard title="Create Employee">
        <EmployeeForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/employees')}
          loading={loading}
        />
        {success && <Alert type="success" message={success} />}
      </PageCard>
    </div>
  );
};

export const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const { data, loading: fetchLoading } = useEmployeeData(
    id ? `${APP_SERVER_URL_PREFIX}/employees/${id}` : ''
  );

  const employee = data.employees.find(emp => emp.id === parseInt(id)) || data.employees[0];

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just show success and redirect
      console.log('Updating employee:', formData);
      setSuccess('Employee updated successfully!');
      
      setTimeout(() => {
        navigate(`/employees/${id}`);
      }, 1500);
    } catch (err) {
      throw new Error('Failed to update employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (mode = 'list') => {
    if (mode === 'view') {
      navigate(`/employees/${id}`);
    } else {
      navigate('/employees');
    }
  };

  if (fetchLoading) {
    return (
      <div className="page-container">
        <PageCard title="Edit Employee">
          <LoadingSpinner message="Loading employee data..." />
        </PageCard>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="page-container">
        <PageCard title="Edit Employee">
          <Alert type="error" message="Employee not found" />
          <button 
            className="btn-primary"
            onClick={() => navigate('/employees')}
          >
            Back to List
          </button>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageCard title={`Edit Employee - ${employee.employeeNo}`}>
        <EmployeeForm
          mode="edit"
          employee={employee}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
        {success && <Alert type="success" message={success} />}
      </PageCard>
    </div>
  );
};

// Main export for routing compatibility
const Employees = EmployeeList;
export default Employees;