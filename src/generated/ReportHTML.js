import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadSpinner from './../LoadSpinner';
import Sidebar from '../Sidebar';
import { APP_SERVER_URL_PREFIX } from "./../constants.js";


function ReportHTML() {

    const [isOpen, setIsOpen] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(false);
    const { state } = useLocation();
    const { jobId } = state;

    useEffect(() => {
        setLoading(true);
        const s3Url = APP_SERVER_URL_PREFIX + "/jobs/content/html/" + jobId; // Replace with your actual S3 URL

        fetch(s3Url)
            .then(response => response.text())
            .then(data => {setHtmlContent(data); setLoading(false);})
            .catch(error => { setLoading(false); console.error('Error fetching HTML:', error)});
    }, []);

    return (
        <div>
            {/* <Sidebar isOpen={true} /> */}
            {loading ? <LoadSpinner /> : <div className={`content ${true ? 'shifted' : ''}`}>
                <div>
                    < div dangerouslySetInnerHTML={{ __html: htmlContent }
                    } />
                </div>
            </div>}
        </div>
    );
}
export default ReportHTML;