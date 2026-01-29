import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT} from "../../../constants.js";
import './HandLoans.css';
import Utils from '../../../Utils';
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
    Alert,
    App as AntApp,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Form,
    Input, InputNumber,
    Modal,
    Progress,
    Row,
    Segmented,
    Select,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography
} from "antd";
import {AppstoreOutlined, BarsOutlined, EyeOutlined, PlusOutlined} from "@ant-design/icons";
import FormUtils from "../../../_utils/FormUtils";
import {fetchHandLoan, fetchHandLoans, fetchMainLoadByID, postHomeLoanFormData} from "./HandLoansDataSource";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import {formatCurrency} from "../../../_utils/datasource-utils";
import dayjs from "dayjs";
import HandLoanDetailsView from "./HandLoanDetailsView";

const statusConfig = {
    'ISSUED': {label: 'ISSUED', color: '#3b82f6'},
    'PARTIALLY_RECOVERED': {label: 'PARTIALLY RECOVERED', color: '#f59e0b'}
};

export default function HandLoansListPage() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState([]);


    const [modalLoanDetails, setModalLoanDetails] = useState(null);
    const [modalFile, setModalFile] = useState(null);
    const [modalRecoveryForm, setModalRecoveryForm] = useState(null);

    const [loadingRecoveredLoans, setLoadingRecoveredLoans] = useState(false);

    const isAdmin = Utils.isRoleApplicable("ADMIN");
    const navigate = useNavigate();
    const formUtils = new FormUtils(AntApp.useApp());
    const [filterForm] = Form.useForm();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })


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
            viewMode: 'ISSUED'
        });

        fetchOrganizationsData();
        fetchLoans(pagination.current, pagination.pageSize);
    }, []);

    // Fetch recovered loans for a specific main loan
    const fetchRecoveredLoansByMainLoanId = async (selectedLoan) => {

        setLoadingRecoveredLoans(true);
        try {

            const data = await fetchMainLoadByID(selectedLoan.id);
            let recoveredLoansData = data._embedded ? data._embedded.handLoans || [] : data;

            // Process recovered loans data
            const processedRecoveredLoans = recoveredLoansData.map((loan, index) => {
                let id = loan.id || `temp-recovered-${index}-${Date.now()}`;

                const processedOrg = organizations.find(org => org.id === loan.organizationId);

                return {
                    ...loan,
                    id: id,
                    organization: processedOrg,
                    handLoanNumber: loan.handLoanNumber || `HL${String(loan.id || id).padStart(4, '0')}`,
                    partyName: loan.partyName || 'Unknown',
                    loanAmount: loan.loanAmount || 0,
                    balanceAmount: loan.balanceAmount || loan.loanAmount || 0,
                    createdDate: dayjs(loan.createdDate),
                    status: loan.status || 'CLOSED'
                };
            });

            setModalLoanDetails({
                selectedLoan: selectedLoan,
                recoveredLoans: processedRecoveredLoans,
            })
        } catch (err) {
            console.error('Error fetching recovered loans:', err);
            formUtils.showErrorNotification("Failed to fetch recovered loans. Please try again later.");
            setModalLoanDetails(null);
        } finally {
            setLoadingRecoveredLoans(false);
        }
    };

    const fetchLoans = async (currentPage, pageSize) => {
        setLoading(true);
        try {
            const organizationId = filterForm.getFieldValue('organizationId');
            const viewMode = filterForm.getFieldValue('viewMode');


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
                const id = loan.id || `temp-${index}-${Date.now()}`;

                const processedOrg = organizations.find(org => org.id === loan.organizationId);

                return {
                    ...loan,
                    id: id,
                    organization: processedOrg,
                    handLoanNumber: loan.handLoanNumber || `HL${String(loan.id || id).padStart(4, '0')}`,
                    partyName: loan.partyName || 'Unknown',
                    loanAmount: loan.loanAmount || 0,
                    balanceAmount: loan.balanceAmount || loan.loanAmount || 0,
                    createdDate: dayjs(loan.createdDate),
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


    const handleRecoverLoan = (selectedLoan) => {
        setModalRecoveryForm({
            selectedLoan,
            state: 'READY'
        });
    };


    // Updated function to handle viewing recovered loans for selected main loan
    const handleViewLoadDetails = async (selectedLoan) => {
        await fetchRecoveredLoansByMainLoanId(selectedLoan);
    };

    const resetPagination = () => {
        fetchLoans(1, pagination.pageSize);
    }

    const handleViewModeChange = (mode) => {
        filterForm.setFieldValue('viewMode', mode);
        resetPagination();
    };


    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.hasOwnProperty('organizationId')
            || changedValues.hasOwnProperty('searchTerm')) {
            resetPagination();
        }
    }

    const handleTableChange = (pagination) => {
        // This function is triggered when the user changes the page
        fetchLoans(pagination.current, pagination.pageSize);
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


    // Calculate summary statistics for current view
    const summaryStats = (() => {

        const loansToCalculate = filteredLoans;

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
    })();

    const columnConfig = [
        {
            title: 'Loan Details',
            key: 'handLoanNumber',
            fixed: true,
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
            render: (createdDate) => dayjs(createdDate).format(DATE_DISPLAY_FORMAT)
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
                        {filterForm.getFieldValue('viewMode') === 'ISSUED' && <Progress
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
            hidden: filterForm.getFieldValue('viewMode') === 'ALL',
            render: (item) => {
                return <div className={'action-buttons'}><Button aria-label='Recover'
                                                                 variant={'solid'}
                                                                 onClick={() => handleRecoverLoan(item)}
                                                                 color={'primary'}>Recover</Button>
                    <Button aria-label='Recover'
                            icon={<EyeOutlined/>}
                            onClick={() => handleViewLoadDetails(item)}
                            color={'default'}>View details</Button>
                </div>
            },
        }
    ];

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
                            value={`${summaryStats.recoveryRate.toFixed(1)}%`}
                            precision={1}
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
                    value={filterForm.getFieldValue('viewMode')}
                    onChange={(value) => {
                        handleViewModeChange(value)
                    }}
                    styles={{
                        root: {
                            marginBottom: '1rem'
                        }
                    }}
                />

                <Table
                    className={'list-page-table'}
                    size={'large'}
                    scroll={{x: 'max-content'}}
                    dataSource={filteredLoans}
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

                <Modal
                    title="Loan Details"
                    centered
                    open={!!modalLoanDetails || loadingRecoveredLoans}
                    width={1000}
                    loading={loadingRecoveredLoans}
                    onCancel={() => setModalLoanDetails(null)}
                    footer={[
                        <Button onClick={() => setModalLoanDetails(null)}>Close</Button>,
                    ]}>
                    {modalLoanDetails && <HandLoanDetailsView
                        loan={modalLoanDetails.selectedLoan}
                        recoveredLoans={modalLoanDetails.recoveredLoans}
                    />}
                </Modal>

                <Modal
                    title="Recover Loan"
                    centered
                    open={modalRecoveryForm}
                    width={600}
                    footer={[]}
                    closable={false}
                >
                    {modalRecoveryForm && <RecoverHandLoanForm
                        modalState={modalRecoveryForm.state}
                        loan={modalRecoveryForm.selectedLoan}
                        onOpen={() => {
                            setModalRecoveryForm((prev) => {
                                return {
                                    ...prev,
                                    state: 'OPEN'
                                }
                            });
                        }}
                        organizations={organizations}
                        onSuccess={() => {
                            setModalRecoveryForm(null);
                            resetPagination();
                        }}
                        onCancel={() => {
                            setModalRecoveryForm(null);
                        }}
                    />}
                </Modal>
            </div>
        </DefaultAppSidebarLayout>
    );
};


// FIXED: Recover Hand Loan Form Component - Remove status field
const RecoverHandLoanForm = ({loan, modalState, organizations, onSuccess, onCancel, onOpen}) => {


    const [recoveryForm] = Form.useForm();
    const [recoveryFormError, setRecoveryFormError] = useState(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (modalState === 'READY') {
            recoveryForm.setFieldsValue({
                organizationId: loan.organizationId,
                createdDate: dayjs(new Date()),
                recoverAmount: null,
                narration: null
            });
            setRecoveryFormError('');
            onOpen();
        }
    }, [modalState]);



    const handleSubmit = async (e) => {

        setRecoveryFormError('');


        setLoading(true);
        try {
            // FIXED: Remove status field from request data
            const requestData = {
                organizationId: parseInt(recoveryForm.getFieldValue('organizationId')),
                mainHandLoanId: loan.id,
                loanAmount: recoveryForm.getFieldValue('recoverAmount'),
                balanceAmount: 0,
                partyName: loan.partyName,
                phoneNo: loan.phoneNo || '',
                narration: recoveryForm.getFieldValue('narration') || `Recovery for ${loan.handLoanNumber}`,
                handLoanType: 'RECOVER',
                createdDate: recoveryForm.getFieldValue('createdDate').format(DATE_SYSTEM_FORMAT)
            };

            const formData = new FormData();
            formData.append(
                "handloan",
                new Blob([JSON.stringify(requestData)], {type: "application/json"})
            );

            await postHomeLoanFormData(formData);
            onSuccess();

        } catch (err) {
            console.error('Failed to recover loan:', err);
            setRecoveryFormError("Failed to recover loan. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = (errorInfo) => {
        setRecoveryFormError(errorInfo.message);
    }


    return (
        <div>

            <Descriptions bordered size={'small'} style={{marginBottom: '1rem'}}>
                <Descriptions.Item span={3}
                                   label="Loan ID">{loan.handLoanNumber || `HL${String(loan.id).padStart(4, '0')}`}</Descriptions.Item>

                <Descriptions.Item span={3}
                                   label="Party Name">{loan.partyName}</Descriptions.Item>
                <Descriptions.Item
                    label="Pending Balance" span={2}>{formatCurrency(loan.balanceAmount)}</Descriptions.Item>
            </Descriptions>

            {recoveryFormError && (
                <Alert title={recoveryFormError} className={'roles-alert'} type="error" showIcon/>
            )}

            <Spin spinning={loading} tip="Loading..." size={'large'}>
                <Form
                    className="form-page"
                    form={recoveryForm}
                    onFinish={handleSubmit}
                    onFinishFailed={onFinishFailed}
                    noValidate={true}
                    autoComplete="off"
                    layout="vertical"
                   >

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="organizationId"
                                label="Branch"
                                rules={[{required: true, message: 'Please select branch.'}]}
                            >
                                <Select
                                    style={{width: "100%"}}
                                    disabled={true}
                                    placeholder={'Select branch'}
                                    options={organizations.map((org) => ({value: org.id, label: org.name}))}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="createdDate"
                                label="Recovery Date"
                            >
                                <DatePicker
                                    disabled={true}
                                    style={{width: "100%"}}
                                    format={DATE_DISPLAY_FORMAT}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={18}>
                            <Form.Item
                                name="recoverAmount"
                                label="Recovery Amount"
                                rules={[{required: true, message: 'Please enter amount.'},
                                    {
                                        validator: (_, value) => {
                                            if (value && loan.balanceAmount < value) return Promise.reject(new Error("Amount cannot exceed pending loan balance"))
                                            if (value <= 0) return Promise.reject(new Error("Amount cannot be zero or negative"));
                                            return Promise.resolve();
                                        }
                                    }]}
                            >
                                <InputNumber
                                    style={{width: "100%"}}
                                    formatter={(value) => {
                                        if (!value) return "";
                                        return `₹ ${new Intl.NumberFormat("en-IN").format(value)}`;
                                    }}
                                    parser={(value) => value?.replace(/₹\s?|(,*)/g, "")}
                                    placeholder={`Max amount ${formatCurrency(loan.balanceAmount)}`}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item

                                name={"narration"}
                                label="Notes"
                            >
                                <Input.TextArea
                                    rows="4"
                                    placeholder={'Enter narration / Notes'}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className='form-page-footer'>
                        <div className={'page-actions'}>
                            <Button onClick={() => {
                                setRecoveryFormError(null);
                                onCancel();
                            }}>
                                Cancel
                            </Button>
                            <Button htmlType="submit"
                                    type="primary"
                                    loading={loading}>
                                Record Recovery
                            </Button>
                        </div>
                    </div>
                </Form>
            </Spin>
        </div>
    );
};