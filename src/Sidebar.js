import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>          
      <div className="sidebar-logo">
        <img src={require('./assets/images/logo.jpg').default || require('./assets/images/logo.jpg')} alt="Logo" />
      </div>
      <ul>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        </li>
        <li>
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>Employees</NavLink>
        </li>
        <li className="sidebar-section">Payroll</li>
        {/* Payroll section kept for other payroll items */}
        <li className="sidebar-section">Petty Cash</li>
        <li style={{ paddingLeft: 12 }}>
          <NavLink to="/pettycash/expenses" className={({ isActive }) => isActive ? 'active' : ''}>Expenses</NavLink>
        </li>
        <li style={{ paddingLeft: 12 }}>
          <NavLink to="/pettycash/expenses/create" className={({ isActive }) => isActive ? 'active' : ''}>Create Expense</NavLink>
        </li>
        <li style={{ paddingLeft: 12 }}>
          <NavLink to="/pettycash/masters" className={({ isActive }) => isActive ? 'active' : ''}>Masters</NavLink>
        </li>
        <li>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>Reports</NavLink>
        </li>
        <li>
          <NavLink to="/download" className={({ isActive }) => isActive ? 'active' : ''}>Downloads</NavLink>
        </li>
        <li>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink>
        </li>
        <li>
          <NavLink to="/logout" className={({ isActive }) => isActive ? 'active' : ''}>Logout</NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
