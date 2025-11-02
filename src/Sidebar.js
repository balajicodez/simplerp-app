import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import logo from './assets/images/logo.jpg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 900);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>          
      <div className="sidebar-logo">
  <img src={logo} alt="Logo" />
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">{collapsed ? '▸' : '◂'}</button>
      </div>
      <ul>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        </li>
        <li>
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>Employees</NavLink>
        </li>
        <li>
          <NavLink to="/employee" className={({ isActive }) => isActive ? 'active' : ''}>Payroll</NavLink>
        </li>
        {/* Payroll section kept for other payroll items */}
        <li className="group pettycash">
          <div className="group-header">Petty Cash</div>
          <ul className="sublist">
            <li className="subitem">
              <NavLink to="/pettycash/expenses-inward" className={({ isActive }) => isActive ? 'active' : ''}>Expenses - Inward</NavLink>
            </li>
            <li className="subitem">
              <NavLink to="/pettycash/expenses-outward" className={({ isActive }) => isActive ? 'active' : ''}>Expenses - Outward</NavLink>
            </li>
            <li className="subitem">
              <NavLink to="/pettycash/masters" className={({ isActive }) => isActive ? 'active' : ''}>Expenses - Masters</NavLink>
            </li>
            <li className="subitem">
              <NavLink to="/pettycash/day-closing" className={({ isActive }) => isActive ? 'active' : ''}>Day Closing</NavLink>
            </li>
          </ul>
        </li>
                <li className="group reports">
          <div className="group-header">Reports</div>
          <ul className="sublist">
            <li className="subitem">
              <NavLink to="/reports/day-closing" className={({ isActive }) => isActive ? 'active' : ''}>Day Closing Report</NavLink>
            </li>          
          </ul>
        </li>
        <li>
          <NavLink to="/organization" className={({ isActive }) => isActive ? 'active' : ''}>Organization</NavLink>
        </li>
        <li>
          <NavLink to="/holidays" className={({ isActive }) => isActive ? 'active' : ''}>Holiday Calendar</NavLink>
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
