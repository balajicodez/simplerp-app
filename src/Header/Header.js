import React, { useState } from 'react';
import './Header.css';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);

  const handleLogout = () => {
    // Add your logout logic here
    console.log('Logging out...');
    // Clear tokens, user data, etc.
    localStorage.removeItem('token'); // Example
    localStorage.removeItem('user'); // Example
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <h1>SimpleRP App</h1>
      </div>
      
      <div className="header-right">
        <span className="welcome-text">Welcome, User</span>
        
        {/* Quick Action Buttons */}
        <div className="header-actions">
          {/* Profile Button - Opens Modal */}
          <button 
            className="action-btn profile-btn"
            onClick={() => openModal('profile')}
            title="Profile"
          >
            👤
          </button>

          {/* Settings Button - Opens Modal */}
          <button 
            className="action-btn settings-btn"
            onClick={() => openModal('settings')}
            title="Settings"
          >
            ⚙️
          </button>

          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="logout-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 22V2h10v20" />
  <path d="M14 2l6 3v17l-6-3" />
  <circle cx="9" cy="12" r="1" />
</svg>
</span>
            Logout
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {activeModal === 'profile' && (
        <Modal onClose={closeModal} title="Profile">
          <ProfileContent />
        </Modal>
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <Modal onClose={closeModal} title="Settings">
          <SettingsContent />
        </Modal>
      )}
    </header>
  );
};

// Modal Component
const Modal = ({ onClose, title, children }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// Profile Content Component
const ProfileContent = () => {
  return (
    <div className="profile-content">
      <div className="user-info">
        <div className="avatar">👤</div>
        <h4>John Doe</h4>
        <p>john.doe@example.com</p>
      </div>
      <div className="profile-actions">
        <button className="btn-primary">Edit Profile</button>
        <button className="btn-secondary">Change Password</button>
      </div>
    </div>
  );
};

// Settings Content Component
const SettingsContent = () => {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');

  return (
    <div className="settings-content">
      <div className="setting-group">
        <label className="setting-label">
          <input 
            type="checkbox" 
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          Enable Notifications
        </label>
      </div>
      
      <div className="setting-group">
        <label className="setting-label">Theme</label>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          className="theme-select"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Language</label>
        <select className="language-select">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <div className="settings-actions">
        <button className="btn-primary">Save Settings</button>
        <button className="btn-secondary">Reset to Defaults</button>
      </div>
    </div>
  );
};

export default Header;