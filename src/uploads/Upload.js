import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Sidebar from './../Sidebar';
import './../App.css';
import { APP_SERVER_URL_PREFIX } from "./../constants.js";
import LoadSpinner from './../LoadSpinner';
import axios from "axios";

var jobId;

const Upload = () => {
  const history = useNavigate();

  const [textInput, setTextInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log(file);
    setSelectedFile(file);
    setFormData({ ...formData, [selectedFile]: file });
  };

  const [formData, setFormData] = useState({
    // Define your form fields
    jobName: "",
    createdBy: "",
    optionalTextString: "",
    id: -1,
    platform: "",
    dataFileName: ""
    // ... other fields
  });

  const handleInputChange = (e) => {   
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const response = await fetch(APP_SERVER_URL_PREFIX + "/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
      console.error("Error making POST request:", error.message);
    }
    history('/reports');
  };

  const handleExcelUpload = () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    const url = APP_SERVER_URL_PREFIX + "/jobs/file-uploads/" + jobId;
    axios
      .post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log(response.data);
        // Handle success, e.g., show a success message to the user
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        // Handle error, e.g., show an error message to the user
      });
  };

  return (
    <div >
      <div>
        <Sidebar isOpen={true} />
      </div>
      {loading ? <LoadSpinner /> :
        <div className={`content ${true ? 'shifted' : ''}`} >
          <h1> MR Upload - Create a new Job </h1>
          <hr />
          <form onSubmit={handleFormSubmit}>
            <table align="left">
              <tr>
                <th>Title</th>
                <th>
                  <input
                    type="text"
                    name="jobName"
                    value={formData.jobName}
                    onChange={handleInputChange}
                    size="53"
                    required
                  />
                </th>
              </tr>
              <tr>
                <th>Description</th>
                <th>
                  <textarea rows="5" cols="50"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </th>
              </tr>
              <tr>
                <th>Data File Name</th>
                <th>
                  <input
                    type="text"
                    name="dataFileName"
                    value={formData.dataFileName}
                    onChange={handleInputChange}
                    size="53"                 
                    required
                  />
                </th>
              </tr>
              <tr>
                <th>Run Configuration</th>
                <th>
                  <select name="platform" id="platform" onChange={handleInputChange} required>
                    <option value="" selected disabled>Select a platform</option>
                    <option value="confirmit">confirmit</option>
                    <option value="decipher">decipher</option>
                    <option value="cmix">cmix</option>
                  </select>
                </th>
              </tr>              
              <tr><button class="button" type="submit">Create Job</button></tr>
            </table>
          </form>
        </div>}
    </div>
  );
};

export default Upload;
