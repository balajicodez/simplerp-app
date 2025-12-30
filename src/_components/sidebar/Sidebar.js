import React, {useEffect, useState} from 'react';
import {NavLink} from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/images/logo_clear.jpg';
import {useAuth} from "../../hooks/useAuth";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const { logout } = useAuth();

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 900);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function getUserRoles() {
    const token = localStorage.getItem("token");
    if (!token) return [];

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.authorities || payload.roles || [];
    } catch {
      return [];
    }
  }

  const roles = getUserRoles();
  const isAdmin = roles.includes("ADMIN");


  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <div
      className={`sidebar ${isOpen ? "open" : ""} ${
        collapsed ? "collapsed" : ""
      }`}
    >
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" />
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <ul>
        <li>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
            data-icon="🏠"
          >
            <span>🏠 Home</span>
          </NavLink>
        </li>
        {/* <li>
          <NavLink 
            to="/employees" 
            className={({ isActive }) => isActive ? 'active' : ''}
            data-icon="👥"
          >
            <span>👥 Employees</span>
          </NavLink>
        </li>
       <li>
      <NavLink 
    to="/employee"
    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''} disabled`}
    data-icon="💰"
    onClick={(e) => e.preventDefault()}
  >
    <span>💰 Payroll</span>
  </NavLink>
       </li> */}

        <li className="group1">
          <div
            className={`group-header ${
              expandedGroups.pettycash ? "expanded" : ""
            }`}
            onClick={() => toggleGroup("pettycash")}
            data-icon="💵"
          >
            <span>💵 Petty Cash</span>
          </div>
          <ul
            className="sublist"
            style={{ maxHeight: expandedGroups.pettycash ? "500px" : "0" }}
          >
            <li className="subitem">
              <NavLink
                to="/pettycash/expenses-inward"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-icon="📥"
              >
                📥 Cash Flow - Inward
              </NavLink>
            </li>
            <li className="subitem">
              <NavLink
                to="/pettycash/expenses-outward"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-icon="📤"
              >
                📤 Cash Flow- Outward
              </NavLink>
            </li>
            <li className="subitem">
              <NavLink
                to="/handloans"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-icon="🏢"
              >
                <span>🏢 Hand Loans</span>
              </NavLink>
            </li>
            <li className="subitem">
              <NavLink
                to="/pettycash/day-closing"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-icon="📊"
              >
                📊 Day Closing
              </NavLink>
            </li>
            <li className="subitem">
              <NavLink
                to="/pettycash/masters"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-icon="⚙️"
              >
                ⚙️ Expenses - Masters
              </NavLink>
            </li>
          </ul>
        </li>

        <li className="group">
          <div
            className={`group-header ${
              expandedGroups.reports ? "expanded" : ""
            }`}
            onClick={() => toggleGroup("reports")}
            data-icon="📈"
          >
            <span>📈 Reports</span>
          </div>
          <ul
            className="sublist"
            style={{ maxHeight: expandedGroups.reports ? "500px" : "0" }}
          >
            <li className="subitem">
              <NavLink
                to="/reports/day-closing"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-icon="📋"
              >
                📋 Day Closing Report
              </NavLink>
            </li>
          </ul>
        </li>

      {isAdmin && (
        <li>
          <NavLink
            to="/organization"
            className={({ isActive }) => (isActive ? "active" : "")}
            data-icon="🏢"
          >
            <span>🏢 Organization</span>
          </NavLink>
        </li>)}

        {/* <li>
          <NavLink 
            to="/holidays" 
            className={({ isActive }) => isActive ? 'active' : ''}
            data-icon="📅"
          >
            <span>📅 Holiday Calendar</span>
          </NavLink>
        </li> */}

        {isAdmin && (
          <>
            <li>
              <NavLink to="/login/users" data-icon="➕">
                <span>➕ Create User</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/login/roles" data-icon="🛡">
                <span>🛡 Manage Roles</span>
              </NavLink>
            </li>
          </>
        )}

        <li>
          <NavLink to="/logout"
            onClick={(e) => {e.preventDefault(); logout()}}
                   className={({ isActive }) => (isActive ? "active" : "")}
            data-icon="🚪"
          >
            <span>🚪 Logout</span>
          </NavLink>
        </li>
      </ul>

      <div className="user-info">
        <span className="username">
          {localStorage.getItem("userName") || "Guest User"}{" "}
          {/* Or from context or state */}
        </span>
      </div>
    </div>
  );
};

export default Sidebar;