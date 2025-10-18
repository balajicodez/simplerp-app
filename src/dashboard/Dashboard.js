import React, { useState } from 'react';
import Sidebar from './../Sidebar';
import './Dashboard.css';
import PageCard from '../components/PageCard';

function Dashboard() {

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <Sidebar isOpen={true} />
            <PageCard title={"Welcome to Sri Divya Sarees - SimplERP solution"}>
                <div className="mycontainer">
                    <div>
                        <h2 align="center">Reports</h2>
                        <p align="center">10</p>
                    </div>
                    <div>
                        <h2 align="center">Runs</h2>
                        <p align="center"> 12</p>
                    </div>
                    <div>
                        <h2 align="center">Insights</h2>
                        <p align="center">7</p>
                    </div>
                </div>
            </PageCard>
        </div>
    );
}
export default Dashboard;