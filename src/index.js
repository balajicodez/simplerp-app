import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {App as AntApp, ConfigProvider} from "antd";


import Upload from './uploads/Upload';
import Download from './download/Download';
import Report from './reports/Report';
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
import LoginPage from "./pages/login/LoginPage";
import {AuthProvider} from "./hooks/useAuth";
import LogoutPage from "./pages/logout/LogoutPage";
import {ProtectedRoute} from "./_components/protected/ProtectedRoute";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersListPage from "./pages/user-administration/users/UsersListPage";
import UsersFormPage from "./pages/user-administration/users/UsersFormPage";
import RolesListPage from "./pages/user-administration/roles/RolesListPage";
import RolesFormPage from "./pages/user-administration/roles/RolesFormPage";
import OrganizationListPage from "./pages/user-administration/organizations/OrganizationListPage";
import OrganizationFormPage from "./pages/user-administration/organizations/OrganizationFormPage";
import PermissionsListPage from "./pages/user-administration/permissions/PermissionsListPage";
import PermissionsFormPage from "./pages/user-administration/permissions/PermissionsFormPage";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                token: {
                    fontFamily: '"Google Sans", serif',
                },
            }}
        >
            <AntApp>
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage/>}/>
                            <Route path="/logout" element={<LogoutPage/>}/>

                            <Route path="/" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>

                            {/* User Administration Routes */}
                            <Route path="/user-administration/users"
                                   element={<ProtectedRoute><UsersListPage/></ProtectedRoute>}/>

                            <Route path="/user-administration/user/:idOrCreate"
                                   element={<ProtectedRoute><UsersFormPage/></ProtectedRoute>}/>


                            <Route path="/user-administration/roles"
                                   element={<ProtectedRoute><RolesListPage/></ProtectedRoute>}/>
                            <Route path="/user-administration/role/:idOrCreate"
                                   element={<ProtectedRoute><RolesFormPage/></ProtectedRoute>}/>
                            <Route path="/user-administration/organizations"
                                   element={<ProtectedRoute><OrganizationListPage/></ProtectedRoute>}/>
                            <Route path="/user-administration/organization/:idOrCreate"
                                   element={<ProtectedRoute><OrganizationFormPage/></ProtectedRoute>}/>


                            <Route
                                path="/user-administration/permissions"
                                element={<ProtectedRoute><PermissionsListPage/></ProtectedRoute>}
                            />
                            <Route path="/user-administration/permission/:idOrCreate"
                                   element={<ProtectedRoute><PermissionsFormPage/></ProtectedRoute>}
                            />

                            <Route path="/upload" element={<Upload/>}/>
                            <Route path="/reports" element={<Report/>}/>
                            <Route path="/download" element={<Download/>}/>
                            <Route path="/employees" element={<Employees/>}/>
                            <Route path="/employees/create" element={<CreateEmployee/>}/>
                            <Route path="/employees/:id" element={<EmployeeView/>}/>
                            <Route path="/employees/:id/edit" element={<EditEmployee/>}/>
                            <Route path="/pettycash/expenses" element={<Expenses/>}/>
                            <Route path="/pettycash/expenses-inward" element={<ExpensesInward/>}/>

                            <Route
                                path="/pettycash/expenses-outward"
                                element={<ExpensesOutward/>}
                            />
                            <Route path="/pettycash/day-closing" element={<DayClosing/>}/>
                            <Route
                                path="/pettycash/day-closing/create"
                                element={<CreateDayClosing/>}
                            />
                            <Route path="/reports/day-closing" element={<DayClosingReport/>}/>
                            <Route path="/pettycash/expenses/create" element={<CreateExpense/>}/>
                            <Route path="/pettycash/expenses/:id" element={<ExpenseView/>}/>
                            <Route path="/pettycash/expenses/:id/edit" element={<EditExpense/>}/>
                            <Route path="/pettycash/masters" element={<ExpenseMasters/>}/>
                            <Route
                                path="/pettycash/masters/create"
                                element={<CreateExpenseMaster/>}
                            />

                            <Route path="/holidays" element={<HolidayCalendar/>}/>
                            <Route path="handloans" element={<HandLoanManagement/>}/>


                        </Routes>
                    </AuthProvider>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
