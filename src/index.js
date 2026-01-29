import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {App as AntApp, ConfigProvider} from "antd";


import Employees from './pages/employees/Employees';
import CreateEmployee from './pages/employees/CreateEmployee';
import EmployeeView from './pages/employees/EmployeeView';
import EditEmployee from './pages/employees/EditEmployee';
import Expenses from './pages/petty-cash/expenses/Expenses';
import ExpensesInwardsListPage from './pages/petty-cash/expenses/ExpensesInwardsListPage';
import ExpensesOutwardListPage from './pages/petty-cash/expenses/ExpensesOutwardListPage';
import DayClosingListPage from './pages/petty-cash/day-closing/DayClosingListPage';
import CreateDayClosingFormPage from './pages/petty-cash/day-closing/CreateDayClosingFormPage';
import DayClosingReportPage from './pages/reports/day-closing/DayClosingReportPage';
import ExpenseCreateFormPage from './pages/petty-cash/expenses/ExpenseCreateFormPage';
import ExpenseViewFormPage from './pages/petty-cash/expenses/ExpenseViewFormPage';
import ExpenseEditFormPage from './pages/petty-cash/expenses/ExpenseEditFormPage';
import HolidayCalendar from './pages/holidays/HolidayCalendar';
import HandLoansListPage from './pages/petty-cash/hand-loans/HandLoansListPage';
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
import ExpenseMastersListPage from "./pages/petty-cash/expense-masters/ExpenseMastersListPage";
import ExpenseMasterFormPage from "./pages/petty-cash/expense-masters/ExpenseMasterFormPage";
import NotFoundPage from "./pages/not-found/NotFoundPage";
import HandLoansCreateFormPage from "./pages/petty-cash/hand-loans/HandLoansCreateFormPage";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                token: {
                    fontFamily: '"Google Sans", serif',
                    colorPrimary: '#2e3192',
                    colorTextDisabled: 'rgba(0, 0, 0, 0.65)'
                },
            }}
        >
            <AntApp>
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            <Route path='*' element={<NotFoundPage/>}/>
                            <Route path="/login" element={<LoginPage/>}/>
                            <Route path="/logout" element={<LogoutPage/>}/>

                            <Route path="/" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>


                            <Route path="/employees" element={<Employees/>}/>
                            <Route path="/employees/create" element={<CreateEmployee/>}/>
                            <Route path="/employees/:id" element={<EmployeeView/>}/>
                            <Route path="/employees/:id/edit" element={<EditEmployee/>}/>


                            {/* Petty Cash Routes */}
                            <Route path="/pettycash/expenses" element={<Expenses/>}/>
                            <Route path="/pettycash/expenses-inward" element={<ExpensesInwardsListPage/>}/>

                            <Route path="/pettycash/handloans" element={<HandLoansListPage/>}/>
                            <Route path="/pettycash/handloan/create" element={<HandLoansCreateFormPage/>}/>

                            <Route
                                path="/pettycash/expenses-outward"
                                element={<ExpensesOutwardListPage/>}
                            />
                            <Route path="/pettycash/day-closing" element={<DayClosingListPage/>}/>


                            <Route
                                path="/pettycash/expense-masters"
                                element={<ExpenseMastersListPage/>}/>
                            <Route
                                path="/pettycash/expense-master/:idOrCreate"
                                element={<ProtectedRoute><ExpenseMasterFormPage/></ProtectedRoute>}
                            />


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


                            <Route
                                path="/pettycash/day-closing/create"
                                element={<CreateDayClosingFormPage/>}
                            />
                            <Route path="/reports/day-closing" element={<DayClosingReportPage/>}/>
                            <Route path="/pettycash/expenses/create" element={<ExpenseCreateFormPage/>}/>
                            <Route path="/pettycash/expenses/:id" element={<ExpenseViewFormPage/>}/>
                            <Route path="/pettycash/expenses/:id/edit" element={<ExpenseEditFormPage/>}/>


                            <Route path="/holidays" element={<HolidayCalendar/>}/>

                            <Route path="/logout" element={<LoginPage/>}/>
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
