import ViewOrganization from './organization/ViewOrganization';
import CreateOrganization from './organization/CreateOrganization';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login/Login';
import Signup from "./login/Signup";
import Dashboard from './dashboard/Dashboard';
import Upload from './uploads/Upload';
import Download from './download/Download';
import About from './About';
import Report from './reports/Report';
import JobDetail from './jobdetail/JobDetail';
import ReportHTML from './generated/ReportHTML';
import SchemaEditor from './editors/SchemaEditor';
import PythonEditor from './editors/PythonEditor';
import Employees from './employees/Employees';
import CreateEmployee from './employees/CreateEmployee';
import EmployeeView from './employees/EmployeeView';
import EditEmployee from './employees/EditEmployee';
import Expenses from './pettycash/Expenses';
import ExpensesInward from './pettycash/ExpensesInward';
import ExpensesOutward from './pettycash/ExpensesOutward';
import DayClosing from './pettycash/DayClosing';
import CreateDayClosing from './pettycash/CreateDayClosing';
import DayClosingReport from './reports/DayClosingReport';
import CreateExpense from './pettycash/CreateExpense';
import ExpenseMasters from './pettycash/ExpenseMasters';
import ExpenseView from './pettycash/ExpenseView';
import EditExpense from './pettycash/EditExpense';
import CreateExpenseMaster from './pettycash/CreateExpenseMaster';
import HolidayCalendar from './holidays/HolidayCalendar';
import HandLoanManagement from './HandloanManagement/HandloanManagement';

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
        <Route path="/employees" element={<Employees />} />
        <Route path="/employees/create" element={<CreateEmployee />} />
        <Route path="/employees/:id" element={<EmployeeView />} />
        <Route path="/employees/:id/edit" element={<EditEmployee />} />
        <Route path="/pettycash/expenses" element={<Expenses />} />
        <Route path="/pettycash/expenses-inward" element={<ExpensesInward />} />
        <Route
          path="/pettycash/expenses-outward"
          element={<ExpensesOutward />}
        />
        <Route path="/pettycash/day-closing" element={<DayClosing />} />
        <Route
          path="/pettycash/day-closing/create"
          element={<CreateDayClosing />}
        />
        <Route path="/reports/day-closing" element={<DayClosingReport />} />
        <Route path="/pettycash/expenses/create" element={<CreateExpense />} />
        <Route path="/pettycash/expenses/:id" element={<ExpenseView />} />
        <Route path="/pettycash/expenses/:id/edit" element={<EditExpense />} />
        <Route path="/pettycash/masters" element={<ExpenseMasters />} />
        <Route
          path="/pettycash/masters/create"
          element={<CreateExpenseMaster />}
        />
        <Route path="/organization" element={<ViewOrganization />} />
        <Route path="/organization/create" element={<CreateOrganization />} />
        <Route path="/holidays" element={<HolidayCalendar />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="handloans" element={<HandLoanManagement />} />

        <Route path="/logout" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
