import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './../Sidebar';
import { APP_SERVER_URL_PREFIX } from "./../constants.js";
import LoadSpinner from './../LoadSpinner';
import './../App.css';

function Report() {

    const history = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);

    // Function to collect data
    const getApiData = async () => {
        setLoading(true);
        const response = await fetch(APP_SERVER_URL_PREFIX + "/jobs").then(
            (response) => response.json()
        );
        setTableData(response);
        setLoading(false);
    };

    useEffect(() => {
        getApiData();
        console.log(' in useeffect');
    }, []);

    const openJobDetail = (jobId) => {
        history('/jobdetail', { state: { jobId: jobId } });
    }

    const generateSchema = async (jobId) => {
        setLoading(true);
        try {
            const response = await fetch(APP_SERVER_URL_PREFIX + "/jobs/generate/" + jobId, {
                method: "PUT",
                body: JSON.stringify(tableData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log("POST request successful:", responseData.id);
            jobId = responseData.jobName + '_' + responseData.id;
            setLoading(false);
            // Add any further actions after successful submission
        } catch (error) {
            setLoading(false);
            console.error("Error making PUT request:", error.message);
        }
        const response = await fetch(APP_SERVER_URL_PREFIX + "/jobs").then(
            (response) => response.json()
        );
        setTableData(response);
        
    }

    const runSchema = async (jobId) => {
        setLoading(true);
        try {
            const response = await fetch(APP_SERVER_URL_PREFIX + "/jobs/run/" + jobId, {
                method: "PUT",
                body: JSON.stringify(tableData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log("POST request successful:", responseData.id);
            jobId = responseData.jobName + '_' + responseData.id;
            setLoading(false);
            // Add any further actions after successful submission
        } catch (error) {
            setLoading(false);
            console.error("Error making PUT request:", error.message);
        }
        const response = await fetch(APP_SERVER_URL_PREFIX + "/jobs").then(
            (response) => response.json()
        );
        setTableData(response);
        
    }

    return (
        <div>
            <Sidebar isOpen={true} />
            {loading ? <LoadSpinner /> :
                <div className={`content ${true ? 'shifted' : ''}`}>
                    <h1>Job History</h1>
                    <hr />
                    <table >
                        <tr>
                            <th>Job Name</th>
                            <th>Description</th>
                            <th>Job Status</th>
                        </tr>
                        {tableData.map((val, key) => {
                            return (
                                <tr key={key}>
                                    <td>{val.jobName}</td>
                                    <td>{val.description}</td>
                                    <td>{val.status}</td>
                                    <td> <button class="button" onClick={() => openJobDetail(val.id)} >
                                        View
                                    </button></td>
                                    <td>
                                        {
                                            val.status === 'DATA_UPLOADED' ? (
                                                <button class="button" onClick={() => generateSchema(val.id)} >
                                                    Generate
                                                </button>) : (
                                                (val.status === 'SCHEMA_GENERATED' || val.status === 'RUN_COMPLETED' || val.status === 'RUNNING') ? (
                                                    <button class="button" onClick={() => runSchema(val.id)} >
                                                        Run
                                                    </button>) : <div />
                                            )
                                        
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </table>
                </div>}
        </div>
    );
}
export default Report;