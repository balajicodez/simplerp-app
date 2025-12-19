import React, { useState } from 'react';
import Sidebar from './../Sidebar';
import './Dashboard.css';
import PageCard from '../components/PageCard';

function Dashboard() {
    const [isOpen, setIsOpen] = useState(false);
    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');
    const [organizationId, setOrganizationId] = useState(localStorage.getItem('organizationId') || '');
    return (
        <div className="dashboard-container">
            <Sidebar isOpen={true} />
            
            <PageCard title={userName ? `Welcome ${userName}, to Sri Divya Sarees - SimplERP Solution!` : "Welcome to Sri Divya Sarees - SimplERP Solution"}>
                
                <div className="dashboard-grid">
                    {/* <div className="stats-card employees-card">
                        <div className="card-icon">👥</div>
                        <h3 className="card-title">Total Employees</h3>
                        <p className="card-value">10</p>
                    </div> */}

                    {/* <div className="stats-card loans-card">
                        <div className="card-icon">💰</div>
                        <h3 className="card-title">Open Loans</h3>
                        <p className="card-value">12</p>
                    </div> */}

                    {/* <div className="stats-card cashin-card">
                        <div className="card-icon">📈</div>
                        <h3 className="card-title">Cash In</h3>
                        <p className="card-value">₹0</p>
                    </div> */}

                    {/* <div className="stats-card cashout-card">
                        <div className="card-icon">📉</div>
                        <h3 className="card-title">Cash Out</h3>
                        <p className="card-value">₹1,70,300</p>
                    </div> */}
                </div>

                <div className="insights-section">
                    <h3 className="insights-title">Quick Insights</h3>
                    <p className="insights-text">
                        Monitor your business performance at a glance. Stay updated with real-time metrics.
                    </p>
                </div>
            </PageCard>
        </div>
    );
}

export default Dashboard;