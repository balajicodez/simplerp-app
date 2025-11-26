import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import axios from 'axios';
import LoadSpinner from './../LoadSpinner';
import './../App.css';
import { APP_SERVER_URL_PREFIX } from "./../constants.js";
import PageCard from '../components/PageCard';

function JobDetail() {

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState(null);
    const history = useNavigate();
    const [selectedFile, setSelectedFile] = useState([]);
    const { state } = useLocation();
    const { jobId } = state;


    const handleFileChange = (e) => {
        const file = e.target.files;
        console.log(file);
        setSelectedFile(file);
        // setFormData({ ...formData, [selectedFile]: file });
    };

    const handleExcelUpload = () => {
        if (!selectedFile) {
            alert("Please select a file");
            return;
        }

        setLoading(true);
        const formData = new FormData();

        Array.from(selectedFile).forEach((file, index) => {
            formData.append('file', file); // Use 'files[]' if server expects an array of files
        });


        const url = APP_SERVER_URL_PREFIX + "/jobs/file-uploads/" + jobId;
        axios
            .post(url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then((response) => {
                console.log(response.data);
                refreshJobDetail(jobId);
                setLoading(false);
                // Handle success, e.g., show a success message to the user
            })
            .catch((error) => {
                refreshJobDetail(jobId);
                setLoading(false);
                console.error("Error uploading file:", error);
                // Handle error, e.g., show an error message to the user
            });
    };

    const viewReport = async (jobId) => {
        history('/reportgen', { state: { jobId: jobId } })
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
            refreshJobDetail(responseData.id);
            setLoading(false);
            // Add any further actions after successful submission
        } catch (error) {
            refreshJobDetail(jobId);
            setLoading(false);
            console.error("Error making PUT request:", error.message);
        }
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
            refreshJobDetail(responseData.id);
            setLoading(false);
            // Add any further actions after successful submission
        } catch (error) {
            refreshJobDetail(jobId);
            setLoading(false);
            console.error("Error making PUT request:", error.message);
        }
    }

    const editSchema = async (jobId) => {
        history('/schemaeditor', { state: { jobId: jobId } })
    }

    const editCode = async (jobId) => {
        history('/pythoneditor', { state: { jobId: jobId } })
    }

    useEffect(() => {
        setLoading(true);
        refreshJobDetail(jobId);
    }, []);

    const refreshJobDetail = (jobId) => {
        fetch(APP_SERVER_URL_PREFIX + "/jobs/" + jobId)
            .then(
                (response) => response.json()
            )
            .then((json) => {
                setTableData(json);
                setLoading(false);
            });
    }

    return (
        <div>
            {/* <Sidebar isOpen={true} /> */}
            {loading ? <LoadSpinner /> :
                <PageCard title="Job Detail">
                    <div>
                        {
                            tableData ? (
                                <div>
                                    <table>
                                        <tr>
                                            <td>
                                                <h3>Job Name</h3>
                                                <p>{tableData.jobName}</p>
                                            </td>

                                            <td>
                                                <h3>Job Description</h3>
                                                <p>{tableData.description}</p>
                                            </td>

                                            <td>
                                                <h3>Job Status</h3>
                                                <p>{tableData.status}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <h3>Created At</h3>
                                                <p>{tableData.startedAt}</p>
                                            </td>

                                            <td>
                                                <h3>Created By</h3>
                                                <p>{tableData.createdBy}</p>
                                            </td>

                                            <td>
                                                <h3>Platform</h3>
                                                <p>{tableData.platform}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <hr />
                                        </tr>
                                        <tr>
                                            {
                                                    tableData.status === 'DATA_UPLOADED' ? (
                                                    <button class="button" onClick={() => generateSchema(tableData.id)} >
                                                        Generate
                                                    </button>) : (
                                                    tableData.status === 'SCHEMA_GENERATED' ? (
                                                        <button class="button" onClick={() => runSchema(tableData.id)} >
                                                            Run
                                                        </button>) : tableData.status === 'RUN_COMPLETED' ? (
                                                            <div>
                                                                <td>
                                                                    <button class="button" onClick={() => viewReport(tableData.id)} >
                                                                        Data Validation Report
                                                                    </button>
                                                                </td>
                                                                <td>
                                                                    <button class="button" onClick={() => editSchema(tableData.id)} >
                                                                        Edit Schema
                                                                    </button> 
                                                                </td>
                                                                <td>
                                                                    <button class="button" onClick={() => editCode(tableData.id)} >
                                                                        Edit Validation Code
                                                                    </button>
                                                                </td>
                                                            </div>
                                                        ) : (<div />
                                                    )
                                                )
                                            }
                                        </tr>
                                    </table>
                                </div>
                            ) : <div />
                        }
                    </div>
                    <hr />
                    <table>
                        <tr>
                            <th>Upload </th>
                            <th>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".xls,.xlsx,.csv,.txt"
                                    multiple
                                />
                                <button class="button" onClick={handleExcelUpload}>Upload</button>
                            </th>
                        </tr>
                    </table>
                </PageCard>}
        </div >
    );
}
export default JobDetail;