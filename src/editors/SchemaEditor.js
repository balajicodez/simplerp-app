import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadSpinner from '../LoadSpinner.js';
import Sidebar from '../Sidebar.js';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import { APP_SERVER_URL_PREFIX } from "../constants.js";


function SchemaEditor() {

    const [isOpen, setIsOpen] = useState(false);
    const [jsonContent, setJsonContent] = useState('');
    const [loading, setLoading] = useState(false);
    const { state } = useLocation();
    const { jobId } = state;

    useEffect(() => {
        setLoading(true);
        const s3Url = APP_SERVER_URL_PREFIX + "/jobs/content/schema/" + jobId; // Replace with your actual S3 URL

        fetch(s3Url)
            .then(response => response.text())
            .then(data => { setJsonContent(JSON.parse(data)); console.log(data);console.log(JSON.parse(data)); setLoading(false); })
            .catch(error => { setLoading(false); console.error('Error fetching HTML:', error) });
    }, []);

    return (
        <div>
            <Sidebar isOpen={true} />
            {loading ? <LoadSpinner /> : <div className={`content ${true ? 'shifted' : ''}`}>
                <div>
                    <Editor
                        value={jsonContent}
                    />
                </div>
            </div>}
        </div>
    );
}
export default SchemaEditor;