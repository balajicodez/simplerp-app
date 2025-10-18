import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>           
      <ul>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        </li>
        <li>
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>Employees</NavLink>
        </li>
          <li>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>Payroll</NavLink>
        </li>
          <li>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>Petty Cash</NavLink>
        </li>
        <li>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>Reports</NavLink>
        </li>
        <li>
          <NavLink to="/download" className={({ isActive }) => isActive ? 'active' : ''}>Downloads</NavLink>
        </li>
        <li>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About SimplERP</NavLink>
        </li>
        <li>
          <NavLink to="/logout" className={({ isActive }) => isActive ? 'active' : ''}>Logout</NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
