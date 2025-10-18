import React, { useState } from 'react';
import Sidebar from './../Sidebar';
import './Dashboard.css';

function Dashboard() {

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <Sidebar isOpen={true} />
            <div className={`content ${true ? 'shifted' : ''}`}>
                <h1>Welcome user to DataSynOps - your data our insights!</h1>
                <hr />
                <div class="mycontainer">
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
            </div>
        </div>
    );
}
export default Dashboard;