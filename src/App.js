import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login/Login';
import Dashboard from './dashboard/Dashboard';
import Upload from './uploads/Upload';
import Download from './download/Download';
import About from './About';
import Report from './reports/Report';
import JobDetail from './jobdetail/JobDetail';
import ReportHTML from './generated/ReportHTML';
import SchemaEditor from './editors/SchemaEditor';
import PythonEditor from './editors/PythonEditor';

function App() {
  return (
    <Router>
      <Routes> 
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/reports" element={<Report />} />
        <Route path="/download" element={<Download />} />
        <Route path="/about" element={<About />} />
        <Route path="/jobdetail" element={<JobDetail />} />
        <Route path="/reportgen" element={<ReportHTML />} />
        <Route path="/schemaeditor" element={<SchemaEditor />} />
        <Route path="/pythoneditor" element={<PythonEditor />} />
        <Route path="/logout" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
