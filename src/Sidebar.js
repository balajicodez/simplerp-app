import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>           
      <ul>
        <li>
          <Link to="/dashboard">Home</Link>
        </li>
        <li>
          <Link to="/upload" >New Job</Link>
        </li>
        <li>
          <Link to="/reports">Job History</Link>
        </li>
        <li>
          <Link to="/download">Downloads</Link>
        </li>      
        <li>
          <Link to="/about">About DataSynOps</Link>
        </li>
        <li>
          <Link to="/logout">Logout</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
