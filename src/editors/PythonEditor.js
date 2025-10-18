import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadSpinner from '../LoadSpinner.js';
import Sidebar from '../Sidebar.js';
import { CodeiumEditor } from "@codeium/react-code-editor";
import { APP_SERVER_URL_PREFIX } from "../constants.js";


function PythonEditor() {

    const [isOpen, setIsOpen] = useState(false);
    const [codeContent, setCodeContent] = useState('');
    const [loading, setLoading] = useState(false);
    const { state } = useLocation();
    const { jobId } = state;

    useEffect(() => {
        setLoading(true);
        const s3Url = APP_SERVER_URL_PREFIX + "/jobs/content/python/" + jobId; // Replace with your actual S3 URL

        fetch(s3Url)
            .then(response => response.text())
            .then(data => { setCodeContent(data); console.log(data); setLoading(false); })
            .catch(error => { setLoading(false); console.error('Error fetching HTML:', error) });
    }, []);

    return (
        <div>
            <Sidebar isOpen={true} />
            {loading ? <LoadSpinner /> : <div className={`content ${true ? 'shifted' : ''}`}>
                <div>
                    <CodeiumEditor language="python" theme="vs-dark"  codeContent ={codeContent}/>
                </div>
            </div>}
        </div>
    );
}
export default PythonEditor;