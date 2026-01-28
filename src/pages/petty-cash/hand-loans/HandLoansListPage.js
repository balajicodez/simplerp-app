import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {APP_SERVER_URL_PREFIX, DATE_DISPLAY_FORMAT} from "../../../constants.js";
import './HandLoans.css';
import Utils from '../../../Utils';
import {PRETTY_CASE_PAGE_TITLE, PRETTY_CASE_TYPES} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
    App as AntApp,
    Button,
    Card, DatePicker, Form, Input,
    Modal,
    Progress,
    Segmented, Select,
    Statistic,
    Table,
    Tag,
    Typography
} from "antd";
import {AppstoreOutlined, BarsOutlined, EyeOutlined, PlusOutlined} from "@ant-design/icons";
import FormUtils from "../../../_utils/FormUtils";
import {fetchHandLoan, fetchHandLoans} from "./HandLoansDataSource";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import {formatCurrency} from "../../../_utils/datasource-utils";
import dayjs from "dayjs";

export default function HandLoansListPage() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [viewMode, setViewMode] = useState('ISSUED'); // ISSUED, RECOVERED, ALL
    const [showRecoverForm, setShowRecoverForm] = useState(false);
    const [showLoanDetails, setShowLoanDetails] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [loanRecoveries, setLoanRecoveries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [recoveredLoansForMainLoan, setRecoveredLoansForMainLoan] = useState([]);
    const [loadingRecoveredLoans, setLoadingRecoveredLoans] = useState(false);
    const enableOrgDropDown = Utils.isRoleApplicable("ADMIN");
    const isAdmin = Utils.isRoleApplicable("ADMIN");
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const navigate = useNavigate();
    const formUtils = new FormUtils(AntApp.useApp());

    const [filterForm] = Form.useForm();

    const [modalFile, setModalFile] = useState(null);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })


    useEffect(() => {
        fetchLoans(pagination.current, pagination.pageSize);
    }, [viewMode, selectedOrgId]);


    const fetchOrganizationsData = async () => {
        try {
            const data = await fetchOrganizations(0, 1000);
            setOrganizations(data._embedded ? data._embedded.organizations || [] : data);
        } catch (error) {
            console.error("Error fetching data:", error);
            formUtils.showErrorNotification("Failed to fetch organizations");
        }
    };

    // Fetch organizations
    useEffect(() => {
        filterForm.setFieldsValue({
            organizationId: !isAdmin ? parseInt(localStorage.getItem("organizationId")) : null,
            fromDate: dayjs(new Date()).subtract(7, 'days'), // last 7 days
            toDate: dayjs(new Date()) // today
        });

        fetchOrganizationsData();
    }, []);

    const handleOrganizationChange = (e) => {
        const value = e.target.value;
        setSelectedOrgId(value);
    };

    // Fetch recovered loans for a specific main loan
    const fetchRecoveredLoansByMainLoanId = async (mainLoanId) => {
        if (!mainLoanId) {
            setRecoveredLoansForMainLoan([]);
            return;
        }

        setLoadingRecoveredLoans(true);
        try {
            const bearerToken = localStorage.getItem('token');
            const response = await fetch(`${APP_SERVER_URL_PREFIX}/handloans/getmainloanbyid/${mainLoanId}`, {
                headers: {'Authorization': `Bearer ${bearerToken}`}
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Recovered loans for main loan:', data);

                let recoveredLoansData = [];

                // Handle different response structures
                if (Array.isArray(data)) {
                    recoveredLoansData = data;
                } else if (data.content) {
                    recoveredLoansData = data.content;
                } else if (data._embedded?.handLoans) {
                    recoveredLoansData = data._embedded.handLoans;
                }

                // Process recovered loans data
                const processedRecoveredLoans = recoveredLoansData.map((loan, index) => {
                    let id = loan.id || `temp-recovered-${index}-${Date.now()}`;

                    // Process organization data
                    let processedOrg = loan.organization;
                    if (processedOrg) {
                        if (processedOrg._links?.self?.href) {
                            const orgId = processedOrg._links.self.href.split('/').pop();
                            processedOrg = {...processedOrg, id: orgId};
                        } else if (!processedOrg.id && processedOrg.name) {
                            const foundOrg = organizations.find(org => org.name === processedOrg.name);
                            if (foundOrg) {
                                processedOrg = {...processedOrg, id: foundOrg.id};
                            }
                        }
                    }

                    return {
                        ...loan,
                        id: id,
                        organization: processedOrg,
                        handLoanNumber: loan.handLoanNumber || `HL${String(loan.id || id).padStart(4, '0')}`,
                        partyName: loan.partyName || 'Unknown',
                        loanAmount: loan.loanAmount || 0,
                        balanceAmount: loan.balanceAmount || loan.loanAmount || 0,
                        createdDate: loan.createdDate || new Date().toISOString().split('T')[0],
                        status: loan.status || 'CLOSED'
                    };
                });

                setRecoveredLoansForMainLoan(processedRecoveredLoans);
            } else {
                console.log('No recovered loans found for this main loan');
                setRecoveredLoansForMainLoan([]);
            }
        } catch (err) {
            console.error('Error fetching recovered loans:', err);
            setRecoveredLoansForMainLoan([]);
        } finally {
            setLoadingRecoveredLoans(false);
        }
    };

    const fetchLoans = async (currentPage, pageSize) => {
        setLoading(true);
        setError('');
        try {
            const organizationId = filterForm.getFieldValue('organizationId');


            let data;
            if (viewMode === 'ALL') {
                data = await fetchHandLoans(currentPage - 1, pageSize, null, organizationId);
            } else if (viewMode === 'RECOVERED') {
                data = await fetchHandLoans(currentPage - 1, pageSize, ['CLOSED'], organizationId);
            } else {
                data = await fetchHandLoans(currentPage - 1, pageSize, ['ISSUED,PARTIALLY_RECOVERED'], organizationId);
            }

            const loansData = data.content || data._embedded?.handLoans || [];

            console.log('Processed loans data:', loansData);

            const processedLoans = loansData.map((loan, index) => {
                let id = loan.id || `temp-${index}-${Date.now()}`;

                let processedOrg = organizations.find(org => org.id == loan.organizationId);

                return {
                    ...loan,
                    id: id,
                    organization: processedOrg,
                    handLoanNumber: loan.handLoanNumber || `HL${String(loan.id || id).padStart(4, '0')}`,
                    partyName: loan.partyName || 'Unknown',
                    loanAmount: loan.loanAmount || 0,
                    balanceAmount: loan.balanceAmount || loan.loanAmount || 0,
                    createdDate: loan.createdDate,
                    status: loan.status || 'ISSUED'
                };
            });

            setLoans(processedLoans);
            setPagination(prev => ({
                ...prev,
                current: currentPage,
                pageSize,
                total: data.totalElements, // Total records from the API
            }));
        } catch (err) {
            console.error('Failed to load loans:', err);
            formUtils.showErrorNotification("Failed to load loans. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLoanRecoveries = async (loanId) => {
        try {
            const bearerToken = localStorage.getItem('token');
            const response = await fetch(`${APP_SERVER_URL_PREFIX}/handloans/${loanId}`, {
                headers: {'Authorization': `Bearer ${bearerToken}`}
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Recoveries API Response:', data);

                let recoveriesData = [];
                if (Array.isArray(data)) {
                    recoveriesData = data;
                } else if (data.content) {
                    recoveriesData = data.content;
                } else if (data._embedded?.handLoanRecoveries) {
                    recoveriesData = data._embedded.handLoanRecoveries;
                }

                console.log('All recovery transactions:', recoveriesData);
                setLoanRecoveries(recoveriesData);
            } else {
                console.log('No recoveries found or error fetching recoveries');
                setLoanRecoveries([]);
            }
        } catch (err) {
            console.error('Error fetching recoveries:', err);
            setLoanRecoveries([]);
        }
    };


    const handleViewLoanDetails = async (loan) => {
        setSelectedLoan(loan);
        await fetchLoanRecoveries(loan.id);
        setShowLoanDetails(true);
    };


    const handleRecoverLoan = (selectedLoan) => {
        setSelectedLoan(selectedLoan);
        setShowRecoverForm(true);
        setShowLoanDetails(false);
    };


    // Updated function to handle viewing recovered loans for selected main loan
    const handleViewRecoveredLoans = async (selectedLoan) => {

        // Fetch recovered loans for the selected main loan
        await fetchRecoveredLoansByMainLoanId(selectedLoan.id);
        setViewMode('RECOVERED');
        setPagination(prev => ({
            ...prev,
            current: 1 // Total records from the API
        }));
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setPagination(prev => ({
            ...prev,
            current: 1 // Total records from the API
        }));
        setSelectedLoan(null);
        // Clear recovered loans when changing view mode
        if (mode !== 'RECOVERED') {
            setRecoveredLoansForMainLoan([]);
        }
    };

    // Calculate summary statistics for current view
    const summaryStats = useMemo(() => {

        // Filter users based on search term
        const filteredLoans = FormUtils.searchListByFields(loans, ['partyName', 'handLoanNumber', 'phoneNo', 'narration'], searchTerm);

        const loansToCalculate = viewMode === 'RECOVERED' && recoveredLoansForMainLoan.length > 0
            ? recoveredLoansForMainLoan
            : filteredLoans;

        const totalLoans = loansToCalculate.length;
        const totalIssued = loansToCalculate.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
        const totalBalance = loansToCalculate.reduce((sum, loan) => sum + (loan.balanceAmount || 0), 0);
        const totalRecovered = totalIssued - totalBalance;

        return {
            totalLoans,
            totalIssued,
            totalBalance,
            totalRecovered,
            recoveryRate: totalIssued > 0 ? (totalRecovered / totalIssued) * 100 : 0
        };
    }, [recoveredLoansForMainLoan, viewMode]);


    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const resetPagination = () => {
        fetchLoans(1, pagination.pageSize);
    }


    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.hasOwnProperty('organizationId')
            || changedValues.hasOwnProperty('searchTerm')) {
            resetPagination();
        }
    }

    let organizationOptions = [{
        label: "All Branches",
        value: null
    }];

    organizationOptions = organizationOptions.concat(organizations.map(item => ({
        label: item.name,
        value: item.id
    })));

    // Filter users based on search term
    const filteredLoans = FormUtils.searchListByFields(loans, ['partyName', 'handLoanNumber', 'phoneNo', 'narration'], filterForm.getFieldValue('searchTerm'));


    return (
        <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>

            <div className="list-page">
                <div className='list-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>Hand Loan Management</Typography.Title>
                    </div>

                    <div className={'page-actions'}>
                        <Button type={'primary'}
                                size={'large'}
                                onClick={() => navigate('/pettycash/handloan/create')}
                                icon={<PlusOutlined/>}>
                            New Loan
                        </Button>
                    </div>
                </div>

                <div className={'list-dashboard'}>
                    <Card>
                        <Statistic
                            size={'small'}
                            title="Total Loans"
                            value={summaryStats.totalLoans}
                        />
                    </Card>

                    <Card>
                        <Statistic
                            title="Total Issued"
                            value={summaryStats.totalIssued}
                            precision={2}
                            prefix={'₹'}
                        />
                    </Card>

                    <Card>
                        <Statistic
                            styles={{
                                content: {color: '#F6BE00'},
                            }}
                            title={"Pending Balance"}
                            value={formatCurrency(summaryStats.totalBalance)}
                        />
                    </Card>

                    <Card>
                        <Statistic
                            title={"Recovery Rate"}
                            value={summaryStats.recoveryRate.toFixed(1)}
                            precision={1}
                            prefix={'%'}
                        />
                    </Card>
                </div>

                <Form className="filter-form"
                      form={filterForm}
                      onValuesChange={handleValueChange}
                      layout={'vertical'}>

                    <Form.Item
                        name="organizationId"
                        label="Branch"
                    >
                        <Select
                            style={{width: "100%"}}
                            disabled={!isAdmin}
                            placeholder={'Select branch'}
                            options={organizationOptions}
                        />
                    </Form.Item>

                    <Form.Item
                        name="searchTerm"
                        label="Search"
                    >
                        <Input
                            style={{width: "100%"}}
                            placeholder={'Search by loan number or party name or phone number or narration'}
                        />
                    </Form.Item>

                </Form>

                <Segmented
                    block
                    options={[
                        {label: 'Issued Loans', value: 'ISSUED', icon: <BarsOutlined/>},
                        {label: 'All Loans', value: 'ALL', icon: <AppstoreOutlined/>},
                    ]}
                    value={viewMode}
                    onChange={(value) => {
                        handleViewModeChange(value)
                    }}
                    styles={{
                        root: {
                            border: '1px solid var(--ant-color-border)',
                            marginBottom: '1rem'
                        }
                    }}
                />


                {/* Selected Loan Info for Recovered Loans View */}
                {viewMode === "RECOVERED" && selectedLoan && (
                    <div className="selected-main-loan-info">
                        <div
                            className="main-loan-banner"
                            style={{display: "flex", justifyContent: "space-between"}}
                        >
                            <strong style={{color: "#3b90be", paddingLeft: "0%"}}>
                                Showing recovered loans for: {selectedLoan.handLoanNumber}
                            </strong>
                            <span style={{color: "#3b90be"}}>
                Party: {selectedLoan.partyName}
              </span>
                            <span style={{color: "#3b90be"}}>
                Original Amount: {formatCurrency(selectedLoan.loanAmount)}
              </span>
                            <button
                                className="btn-primary1"
                                onClick={() => {
                                    setViewMode("ISSUED");
                                    setRecoveredLoansForMainLoan([]);
                                }}
                            >
                                Show All Loans
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="alert alert-error">
                        <div className="alert-content">
                            <strong>Error:</strong> {error}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {showRecoverForm ? (
                    <RecoverHandLoanForm
                        loan={selectedLoan}
                        organizations={organizations}
                        onSuccess={() => {
                            setShowRecoverForm(false);
                            setSelectedLoan(null);
                            fetchLoans();
                        }}
                        onCancel={() => setShowRecoverForm(false)}
                    />
                ) : showLoanDetails ? (
                    <LoanDetailsModal
                        loan={selectedLoan}
                        recoveries={loanRecoveries}
                        onClose={() => setShowLoanDetails(false)}
                        onRecover={() => {
                            setShowLoanDetails(false);
                            handleRecoverLoan();
                        }}
                        formatDate={formatDate}
                    />
                ) : (
                    <LoanDataTable
                        pagination={pagination}
                        handleViewRecoveredLoans={handleViewRecoveredLoans}
                        handleRecoverLoan={handleRecoverLoan}
                        modalFile={modalFile}
                        setModalFile={setModalFile}
                        fetchLoans={fetchLoans}
                        navigate={navigate}
                        loans={
                            viewMode === "RECOVERED" && recoveredLoansForMainLoan.length > 0
                                ? recoveredLoansForMainLoan
                                : filteredLoans
                        }
                        loading={
                            loading || (viewMode === "RECOVERED" && loadingRecoveredLoans)
                        }
                        onViewDetails={handleViewLoanDetails}
                        formatDate={formatDate}
                        viewMode={viewMode}
                        isRecoveredLoansView={
                            viewMode === "RECOVERED" && recoveredLoansForMainLoan.length > 0
                        }
                        mainLoan={selectedLoan}
                    />
                )}
            </div>
        </DefaultAppSidebarLayout>
    );
};


// Updated Loan Data Table Component
const LoanDataTable = ({
                           loans,
                           loading,
                           onViewDetails,
                           formatDate,
                           viewMode,
                           isRecoveredLoansView,
                           mainLoan,
                           pagination,
                           handleViewRecoveredLoans,
                           handleRecoverLoan,
                           modalFile,
                           setModalFile,
                           fetchLoans
                       }) => {

    // Show recovered loans in card view
    if (viewMode === 'RECOVERED' || isRecoveredLoansView) {
        return (
            <RecoveredLoansCardView
                loans={loans}
                onViewDetails={onViewDetails}
                formatDate={formatDate}
                mainLoan={mainLoan}
            />
        );
    }

    const handleTableChange = (pagination) => {
        // This function is triggered when the user changes the page
        fetchLoans(pagination.current, pagination.pageSize);
    }

    const columnConfig = [
        {
            title: 'Loan Details',
            key: 'handLoanNumber',
            render: (item) => {
                return <>
                    <Typography.Title
                        style={{margin: 0}}
                        level={5}>{item.handLoanNumber || `HL${String(item.id).padStart(4, '0')}`}</Typography.Title>
                    {item.phoneNo && <Typography.Text style={{margin: 0}}
                                                      type="secondary">{item.phoneNo}</Typography.Text>}
                </>;
            }
        },
        {
            title: 'Branch',
            dataIndex: 'organization',
            key: 'organization',
            render: (org) => org?.name || 'N/A'
        },
        {
            title: 'Party Name',
            dataIndex: 'partyName',
            key: 'partyName',
        },
        {
            title: 'Date',
            dataIndex: 'createdDate',
            key: 'createdDate',
            render: (createdDate) => formatDate(createdDate)
        },
        {
            title: 'Loan Amount',
            dataIndex: 'loanAmount',
            key: 'loanAmount',
            render: (amount) => formatCurrency(amount)
        },
        {
            title: 'Balance Amount',
            dataIndex: 'balanceAmount',
            key: 'balanceAmount',
            render: (amount) => formatCurrency(amount)
        },
        {
            title: 'Status',
            key: 'status',
            render: (item) => {
                const statusConfig = {
                    'ISSUED': {label: 'ISSUED', color: '#3b82f6'},
                    'PARTIALLY_RECOVERED': {label: 'PARTIALLY RECOVERED', color: '#f59e0b'}
                };
                const config = statusConfig[item.status] || {
                    label: item.status?.toUpperCase(),
                    color: '#6b7280',
                    bgColor: '#f3f4f6'
                };
                const {label, color} = config;

                const recoveredAmount = (item.loanAmount || 0) - (item.balanceAmount || 0);
                const percentage = item.loanAmount > 0 ? (recoveredAmount / item.loanAmount) * 100 : 0;

                return (
                    <><Tag color={color} key={item.status} variant={'solid'}>
                        {label}
                    </Tag>
                        {viewMode === 'ISSUED' && <Progress
                            percent={percentage?.toFixed(0)}
                            size="small"/>}
                    </>
                );
            },
        },
        {
            title: 'Receipt',
            dataIndex: 'hasImage',
            key: 'hasImage',
            render: (hasImage, item) => {
                if (!hasImage) return "(No receipt)";
                return (
                    <Button
                        size={'small'}
                        icon={<EyeOutlined/>}
                        onClick={async () => {
                            const json = await fetchHandLoan(item.id);
                            setModalFile(
                                json.imageData || json.fileUrl || json.file
                            )
                        }}
                    >
                        View
                    </Button>
                );
            },
        },
        {
            title: 'Actions',
            key: 'operation',
            width: 200,
            hidden: viewMode === 'ALL',
            render: (item) => {
                return <div className={'action-buttons'}><Button aria-label='Recover'
                                                                 variant={'solid'}
                                                                 onClick={() => handleRecoverLoan(item)}
                                                                 color={'primary'}>Recover</Button>
                    <Button aria-label='Recover'
                            icon={<EyeOutlined/>}
                            onClick={() => handleViewRecoveredLoans(item)}
                            color={'default'}>Recovered loans</Button>
                </div>
            },
        }
    ];


    return (
        <>
            <Table
                className={'list-page-table'}
                size={'large'}
                scroll={{ x: 'max-content' }}
                dataSource={loans}
                columns={columnConfig.filter(column => !column.hidden)}
                onChange={handleTableChange}
                pagination={{
                    ...pagination,
                    showTotal: FormUtils.listPaginationShowTotal,
                    itemRender: FormUtils.listPaginationItemRender,
                    showSizeChanger: true
                }}
                loading={loading}/>

            <Modal
                title="Receipt Preview"
                centered
                open={!!modalFile}
                width={1000}
                onCancel={() => setModalFile(null)}
                footer={[
                    <Button onClick={() => setModalFile(null)}>Close</Button>,
                ]}
            >
                <img
                    src={modalFile && modalFile.startsWith("data:image")
                        ? modalFile
                        : `data:image/png;base64,${modalFile}`
                    }
                    alt="Expense Receipt"
                    className="list-preview-image"
                />
            </Modal>
        </>
    );
};

const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};



// FIXED: Recover Hand Loan Form Component - Remove status field
const RecoverHandLoanForm = ({loan, organizations, onSuccess, onCancel}) => {

    const enableOrgDropDown = Utils.isRoleApplicable("ADMIN");

    const [form, setForm] = useState({
        organizationId: enableOrgDropDown ? "" : localStorage.getItem("organizationId"),
        recoverAmount: '',
        narration: '',
        createdDate: new Date().toISOString().split('T')[0] // Default to today
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (loan) {
            setForm(prev => ({
                ...prev,
                organizationId: loan.organizationId || ''
            }));
        }
    }, [loan]);


    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.organizationId || !form.recoverAmount) {
            setError('Please fill all required fields');
            return;
        }

        const recoverAmount = parseInt(form.recoverAmount);
        if (recoverAmount <= 0) {
            setError('Recovery amount must be greater than 0');
            return;
        }

        if (recoverAmount > loan.balanceAmount) {
            setError(`Cannot recover more than pending balance of ${formatCurrency(loan.balanceAmount)}`);
            return;
        }

        setLoading(true);
        try {
            // FIXED: Remove status field from request data
            const requestData = {
                organizationId: parseInt(form.organizationId),
                mainHandLoanId: loan.id,
                loanAmount: recoverAmount,
                balanceAmount: 0,
                partyName: loan.partyName,
                phoneNo: loan.phoneNo || '',
                narration: form.narration || `Recovery for ${loan.handLoanNumber}`,
                handLoanType: 'RECOVER',
                createdDate: form.createdDate || new Date().toISOString()
            };

            const formData = new FormData();
            formData.append(
                "handloan",
                new Blob([JSON.stringify(requestData)], {type: "application/json"})
            );
            if (form.file) formData.append("file", form.file);

            const bearerToken = localStorage.getItem('token');
            const response = await fetch(`${APP_SERVER_URL_PREFIX}/handloans`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`
                },
                body: formData
            });

            if (response.ok) {
                const recoveredLoan = await response.json();
                console.log('Loan recovery recorded successfully:', recoveredLoan);
                onSuccess();
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to recover loan');
            }
        } catch (err) {
            setError(err.message || 'Failed to recover loan');
        } finally {
            setLoading(false);
        }
    };

    if (!loan) {
        return (
            <div className="alert alert-error">
                No loan selected for recovery
            </div>
        );
    }

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>Recover Loan</h2>
                <button className="btn-close" onClick={onCancel}>×</button>
            </div>

            <div className="loan-summary">
                <div className="summary-item">
                    <span>Loan:</span>
                    <strong>{loan.handLoanNumber}</strong>
                </div>
                <div className="summary-item">
                    <span>Party:</span>
                    <span>{loan.partyName}</span>
                </div>
                <div className="summary-item">
                    <span>Pending Balance:</span>
                    <strong className="pending">{formatCurrency(loan.balanceAmount)}</strong>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Branch *</label>
                        <select
                            name="organizationId"
                            value={
                                enableOrgDropDown
                                    ? form.organizationId
                                    : localStorage.getItem("organizationId")
                            }
                            onChange={handleChange}
                            required
                            disabled={true}>
                            <option value="">Select Branch</option>
                            {organizations.map((org) => (
                                <option
                                    key={org.id || org._links?.self?.href}
                                    value={org.id || org._links?.self?.href.split("/").pop()}
                                >
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Recovery Date *</label>
                        <input
                            type="date"
                            name="createdDate"
                            value={form.createdDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Recovery Amount (₹) *</label>
                        <input
                            type="number"
                            name="recoverAmount"
                            value={form.recoverAmount}
                            onChange={handleChange}
                            placeholder={`Max: ${formatCurrency(loan.balanceAmount)}`}
                            min="1"
                            max={loan.balanceAmount}
                            required
                        />
                        <div className="input-hint">
                            Maximum: {formatCurrency(loan.balanceAmount)}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>Notes</label>
                        <textarea
                            name="narration"
                            value={form.narration}
                            onChange={handleChange}
                            placeholder="Recovery details"
                            rows="2"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : 'Record Recovery'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Updated Recovered Loans Card View Component
const RecoveredLoansCardView = ({loans, onViewDetails, formatDate, mainLoan}) => {
    if (loans.length === 0) {
        return (
            <div className="no-data">
                <div className="no-data-content">
                    <div className="no-data-icon">✅</div>
                    <p>
                        {mainLoan
                            ? `No recovered loans found for ${mainLoan.handLoanNumber}`
                            : 'No recovered loans found'
                        }
                    </p>
                    {mainLoan && (
                        <p className="no-data-subtitle">This main loan has no recovery transactions yet.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="recovered-loans-container">
            <div className="recovered-loans-header">
                <h3 style={{color: "#3b90be"}}>
                    {mainLoan
                        ? `Recovered Loans for ${mainLoan.handLoanNumber}`
                        : "Recovered Loans"}
                </h3>
                <div className="recovered-count">
                    Total: {loans.length} recovery transactions
                </div>
            </div>
            <div className="recovered-loans-grid">
                {loans.map((loan) => (
                    <RecoveredLoanCard
                        key={loan.id}
                        loan={loan}
                        onViewDetails={onViewDetails}
                        formatDate={formatDate}
                        mainLoan={mainLoan}
                    />
                ))}
            </div>
        </div>
    );
};

// Updated Individual Recovered Loan Card Component
const RecoveredLoanCard = ({loan, onViewDetails, formatDate, mainLoan}) => {
    const totalRecovered = (loan.loanAmount || 0) - (loan.balanceAmount || 0);
    const recoveryPercentage = loan.loanAmount > 0 ? (totalRecovered / loan.loanAmount) * 100 : 100;

    return (
        <div className="recovered-loan-card">
            {/* Header Section */}
            <div className="card-header">
                <div className="loan-number">{loan.handLoanNumber}</div>
                <div className="loan-type">MPOCKET</div>
                <div className="loan-reference">{loan.id}</div>
            </div>

            {/* Recovery Info */}
            <div className="recovery-info">
                Recovery for {mainLoan ? mainLoan.handLoanNumber : loan.handLoanNumber}
            </div>

            {/* Organization Section */}
            <div className="card-org-section">
                <div className="org-label">Organization</div>
                <div className="org-name">
                    {loan.organization?.name || 'Unknown Organization'}
                </div>
                <div className="loan-date">
                    {formatDate(loan.createdDate)}
                </div>
            </div>

            {/* Amount Section */}
            <div className="card-amount-section">
                <div className="amount-display">
                    {formatCurrency(loan.loanAmount)}
                </div>
                <div className="balance-info">
                    Balance: {formatCurrency(loan.balanceAmount)}
                </div>
            </div>

            {/* <div className="card-progress-section">
        <div className="progress-label">Progress</div>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill recovered"
              style={{ width: `${recoveryPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text">{recoveryPercentage.toFixed(0)}%</div>
        </div>
      </div> */}

            {/* Status Section */}
            <div className="card-status-section">
                <div className="status-badge recovered">
                    RECOVERED
                </div>
            </div>
        </div>
    );
};

// Loan Details Modal Component
const LoanDetailsModal = ({loan, recoveries, onClose, onRecover, formatDate}) => {
    const [activeTab, setActiveTab] = useState('details');

    if (!loan) return null;

    // Calculate total recovered from all recovery transactions
    const totalRecovered = recoveries.reduce((sum, recovery) => sum + (recovery.loanAmount || 0), 0);
    const recoveryPercentage = loan.loanAmount > 0 ? (totalRecovered / loan.loanAmount) * 100 : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Loan Details</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={activeTab === 'details' ? 'active' : ''}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    {/* <button
            className={activeTab === 'recoveries' ? 'active' : ''}
            onClick={() => setActiveTab('recoveries')}
          >
            Recoveries ({recoveries.length})
          </button> */}
                </div>

                <div className="modal-content">
                    {activeTab === 'details' && (
                        <div className="loan-details">
                            <div className="detail-section">
                                <h3>Loan Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Loan ID:</label>
                                        <span>{loan.handLoanNumber || `Loan-${loan.id}`}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Party Name:</label>
                                        <span>{loan.partyName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Organization:</label>
                                        <span>{loan.organization?.name || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Phone:</label>
                                        <span>{loan.phoneNo || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Loan Date:</label>
                                        <span>{formatDate(loan.createdDate)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Status:</label>
                                        <span className={`status ${loan.status.toLowerCase()}`}>{loan.status}</span>
                                    </div>
                                </div>
                            </div>

                            {loan.narration && (
                                <div className="detail-section">
                                    <h3>Notes</h3>
                                    <div className="narration">
                                        {loan.narration}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'recoveries' && (
                        <div className="recoveries-list">
                            <div className="recoveries-header">
                                <h4>All Recovery Transactions</h4>
                                <div className="recovery-summary">
                                    Total
                                    Recovered: <strong>{formatCurrency(totalRecovered)}</strong> across {recoveries.length} transactions
                                </div>
                            </div>

                            {recoveries.length === 0 ? (
                                <div className="empty-state">
                                    <p>No recovery transactions found</p>
                                    {loan.balanceAmount > 0 && (
                                        <button className="btn-primary" onClick={onRecover}>
                                            Record Recovery
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="recovery-items">
                                    <div className="recovery-table-header">
                                        <div className="recovery-amount-header">Amount</div>
                                        <div className="recovery-date-header">Date</div>
                                        <div className="recovery-notes-header">Notes</div>
                                        <div className="recovery-type-header">Type</div>
                                    </div>
                                    {recoveries.map((recovery, index) => (
                                        <div key={index} className="recovery-item">
                                            <div className="recovery-amount">
                                                {formatCurrency(recovery.loanAmount)}
                                                {recovery.loanAmount < 100 && (
                                                    <span className="small-amount-badge">Small</span>
                                                )}
                                            </div>
                                            <div className="recovery-date">{formatDate(recovery.createdDate)}</div>
                                            <div className="recovery-notes">{recovery.narration || 'No notes'}</div>
                                            <div className="recovery-type">
                        <span className={`type-badge ${recovery.handLoanType?.toLowerCase() || 'recover'}`}>
                          {recovery.handLoanType || 'RECOVER'}
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    {/* {loan.balanceAmount > 0 && (
            <button className="btn-primary" onClick={onRecover}>
              Record Recovery
            </button>
          )} */}
                </div>
            </div>
        </div>
    );
};