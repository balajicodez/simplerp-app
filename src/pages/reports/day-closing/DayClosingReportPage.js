import React, {useEffect, useState} from "react";

import {DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT} from "../../../constants.js";
import Utils from '../../../Utils';
import './DayClosingReportPage.css';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Alert, App as AntApp, Button, DatePicker, Form, Modal, Select, Spin, Table, Tag, Typography} from "antd";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import FormUtils from "../../../_utils/FormUtils";
import {convertDenominationsToRecords, getOrganizationAddressText} from './utils';
import {fetchAllHandLoans, fetchDayClosingData, fetchExpenseReportData} from "./dayClosingReportApiService";
import dayjs from "dayjs";
import {EyeOutlined, FilePdfOutlined} from "@ant-design/icons";
import DayClosingSummaryCardsSection from "./sections/DayClosingSummaryCardsSection";
import {fetchWithAuth} from "../../../_utils/datasource-utils";
import {formatCurrency} from '../../../_utils/CommonUtils';
import {getHomeLoadStatus} from "../../petty-cash/hand-loans/homeLoanUtils";
import createDayClosingReportPDF from "./createDayClosingReportPDF";

const tableCustomStyles = {
    header: {
        cell: {
            fontWeight: 600,
            fontSize: '0.95rem',
            color: 'white',
            padding: '12px 16px',
            backgroundColor: 'var(--primary-10)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
    }
};


export default function DayClosingReportPage() {
    const [dayClosingData, setDayClosingData] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [handloans, setHandloans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [error, setError] = useState("");

    const [filterForm] = Form.useForm();

    const [pdfUrl, setPdfUrl] = useState("");
    const [organizations, setOrganizations] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const isAdmin = Utils.isRoleApplicable('ADMIN');
    const formUtils = new FormUtils(AntApp.useApp());


    const fetchOrganizationsData = async () => {
        try {
            const data = await fetchOrganizations(0, 1000);
            setOrganizations(data._embedded ? data._embedded.organizations || [] : data);
        } catch (error) {
            console.error("Error fetching data:", error);
            formUtils.showErrorNotification("Failed to fetch organizations");
        }
    };

    async function fetchReportData(closingDate, organizationId) {
        setLoading(true);
        setError("");

        try {

            let dayClosingData;
            try {
                dayClosingData = await fetchDayClosingData(organizationId, closingDate);
                setDayClosingData(dayClosingData);
            } catch (err) {
                console.log(err);
                setError("Day Closing not found for the selected date");
                setDayClosingData(null);
                setAttachments([]);
                setExpenses([]);
                setHandloans([]);
                setLoading(false);
                return;
            }

            const attachmentData = await fetchWithAuth(dayClosingData._links.pettyCashDayClosingAttachment.href);
            setAttachments(attachmentData._embedded ? attachmentData._embedded.pettyCashDayClosingAttachments || [] : attachmentData);

            // fetch expenses data
            const expensesData = await fetchExpenseReportData(organizationId, closingDate);
            setExpenses(expensesData.content || expensesData || []);

            // Handloans
            const handLoansData = await fetchAllHandLoans(0, 1000);
            setHandloans(handLoansData.content || handLoansData || []);

        } catch (err) {
            console.error(err);
            setExpenses([]);
            setHandloans([]);
            formUtils.showErrorNotification("Failed to fetch report data");
        }
        setLoading(false);
    }

    useEffect(() => {
        filterForm.setFieldsValue({
            organizationId: !isAdmin ? parseInt(localStorage.getItem("organizationId")) : null
        });
        fetchOrganizationsData();
    }, []);

    // Date filtering for expenses
    const getExpensesForDate = (date) => {
        return expenses.filter((expense) => {
            if (!expense.createdDate && !expense.transactionDate) return false;

            const expenseDateStr = expense.createdDate || expense.transactionDate;
            if (!expenseDateStr) return false;

            try {
                const expenseDate = new Date(expenseDateStr)
                    .toISOString()
                    .split("T")[0];
                return expenseDate === date;
            } catch (error) {
                console.warn("Invalid date format for expense:", expenseDateStr);
                return false;
            }
        });
    };


    const categorizeExpenses = (expensesList) => {
        const cashInExpenses = expensesList.filter(
            (expense) => expense.expenseType === "CASH-IN"
        );
        const cashOutExpenses = expensesList.filter(
            (expense) => expense.expenseType === "CASH-OUT"
        );

        return {cashInExpenses, cashOutExpenses};
    };

    const getIssuedAndPartialLoansByOrg = () => {
        const organizationId = filterForm.getFieldValue('organizationId');
        if (!organizationId) return [];

        const loanMap = new Map();

        handloans.forEach((h) => {
            // 🔥 FILTER BY ORGANIZATION
            const loanOrgId =
                h.organizationId ||
                h.organization?.id ||
                h.organization?._links?.self?.href?.split("/").pop();

            if (String(loanOrgId) !== String(organizationId)) return;

            if (!h.handLoanNumber) return;

            const loanAmount = Number(h.loanAmount) || 0;
            const balanceAmount = Number(h.balanceAmount) || 0;
            const recoveredAmount = loanAmount - balanceAmount;

            // ❌ Remove fully recovered loans
            if (balanceAmount === 0) return;

            if (!loanMap.has(h.handLoanNumber)) {
                loanMap.set(h.handLoanNumber, {
                    handLoanNumber: h.handLoanNumber,
                    partyName: h.partyName || "N/A",
                    loanAmount,
                    recoveredAmount,
                    balanceAmount,
                });
            } else {
                const existing = loanMap.get(h.handLoanNumber);
                existing.balanceAmount = balanceAmount;
                existing.recoveredAmount = loanAmount - balanceAmount;
            }
        });

        return Array.from(loanMap.values()).map((l) => ({
            ...l,
            status: l.recoveredAmount > 0 ? "PARTIALLY_RECOVERED" : "ISSUED",
        }));
    };


    const handleGenerateReport = () => {

        formUtils.clearNotifications();
        const closingDateDayJS = filterForm.getFieldValue('closingDate');
        const organizationId = filterForm.getFieldValue('organizationId');

        if (!closingDateDayJS || !organizationId) {
            formUtils.showErrorNotification("Please select a date and organization");
            return;
        }

        if (!dayClosingData) {
            formUtils.showErrorNotification("No day closing data found");
            return;
        }


        const selectedOrganization = organizations.find(o => String(o.id) == String(organizationId));
        const selectedDate = closingDateDayJS.format(DATE_SYSTEM_FORMAT);


        try {
            const filteredExpenses = getExpensesForDate(selectedDate);

            // ✅ ALL HANDLOANS (NO DATE FILTER)
            const filteredHandloans = getIssuedAndPartialLoansByOrg();

            if (!dayClosingData) {
                formUtils.showErrorNotification("No day closing data found");
                return;
            }


            const {cashInExpenses, cashOutExpenses} =
                categorizeExpenses(filteredExpenses);


            const doc = createDayClosingReportPDF({
                closingDate: closingDateDayJS.format(DATE_DISPLAY_FORMAT),
                organizationName: selectedOrganization?.name,
                organizationAddress: getOrganizationAddressText(selectedOrganization),
                cashInExpenses,
                cashOutExpenses,
                dayClosingData,
                filteredHandLoans: filteredHandloans,
            });

            setPdfUrl(doc.output("bloburl"));
        } catch (e) {
            console.error("PDF generation error:", e);
            formUtils.showErrorNotification("Failed to generate PDF");
        }
    };

    const expensesForSelectedDate = getExpensesForDate(filterForm.getFieldValue('closingDate')?.format("YYYY-MM-DD"));
    const {cashInExpenses, cashOutExpenses} = categorizeExpenses(
        expensesForSelectedDate
    );

    // Get all handloans with balances for display
    // const allHandloansWithBalances = getAllHandloansWithBalances();
    // const allHandloansWithBalances = getIssuedAndPartialLoans();
    const allHandloansWithBalances = getIssuedAndPartialLoansByOrg();


    function onValuesChange() {
        const formValues = filterForm.getFieldsValue();
        const closingDate = formValues.closingDate?.format("YYYY-MM-DD");
        const organizationId = formValues.organizationId;

        fetchReportData(closingDate, organizationId);
    }

    const cashDenominationRecords = convertDenominationsToRecords(dayClosingData);


    return (
        <DefaultAppSidebarLayout pageTitle={'Reports'}>

            <div className="day-closing-report-page">

                <div className='report-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>
                            Day Closing Report
                        </Typography.Title>
                    </div>
                    <div className={'page-actions'}></div>
                </div>

                <Form className="report-form"
                      form={filterForm}
                      layout={'inline'}
                      onValuesChange={onValuesChange}>

                    <Form.Item
                        label={"Branch"}
                        name={"organizationId"}
                        size={'large'}
                        rules={[{required: true, message: 'Please select an branch'}]}>
                        <Select
                            placeholder="Select branch"
                            options={organizations.map((org) => ({label: org.name, value: org.id}))}
                            disabled={!isAdmin}
                        />
                    </Form.Item>


                    <Form.Item
                        label={'Select Date'}
                        name={'closingDate'}
                        size={'large'}
                        rules={[{required: true, message: 'Please select a date'}]}
                    >
                        <DatePicker
                            maxDate={dayjs()}
                            format={DATE_DISPLAY_FORMAT}
                        />
                    </Form.Item>

                    <Button
                        icon={<FilePdfOutlined/>}
                        htmlType={'submit'}
                        type="primary"
                        onClick={handleGenerateReport}
                    >
                        Generate PDF
                    </Button>
                </Form>

                {error &&
                    <Alert title={error} className={'roles-alert'} type="error" showIcon/>}


                <Spin spinning={loading} tip="Loading day closing records, expenses, and handloans..." size={'large'}>
                    {dayClosingData && <DayClosingSummaryCardsSection
                        openingBalance={dayClosingData.openingBalance}
                        cashIn={dayClosingData.cashIn}
                        cashOut={dayClosingData.cashOut}
                        closingBalance={dayClosingData.closingBalance}
                    />}

                    {/* Attachments Section */}
                    {attachments.length > 0 && (
                        <div className={'report-section-container'}>
                            <Typography.Title level={4} className={'report-section-title'}>
                                Attachments
                            </Typography.Title>
                            <Table
                                size={'large'}
                                dataSource={attachments}
                                styles={tableCustomStyles}
                                columns={[
                                    {
                                        title: 'Description',
                                        dataIndex: 'description',
                                        key: 'description',
                                        render: (text) => <span>{text || 'General'}</span>,
                                    }, {
                                        title: 'File',
                                        key: 'fileUrl',
                                        render: (item) => {
                                            if (item.imageData || item.fileUrl || item.file)
                                                return <Button
                                                    icon={<EyeOutlined/>}
                                                    onClick={() => {
                                                        setModalFile(
                                                            item.imageData || item.fileUrl || item.file
                                                        )
                                                    }}
                                                >
                                                    View
                                                </Button>;
                                            else return "(No receipt)";
                                        }
                                    }]}
                                pagination={false}>
                            </Table>
                        </div>
                    )}

                    {/* Existing Expenses Section */}
                    {(cashInExpenses.length > 0 || cashOutExpenses.length > 0) && (
                        <div className={'expenses-section'}>

                            <div className={'report-section-container'}>
                                <Typography.Title level={4} className={'report-section-title'} style={{color: "green"}}>
                                    Cash In Expenses
                                </Typography.Title>

                                <Table
                                    size={'large'}
                                    dataSource={cashInExpenses}
                                    styles={tableCustomStyles}
                                    columns={[
                                        {
                                            title: 'Amount',
                                            dataIndex: 'amount',
                                            key: 'amount',
                                            render: (amount) => <span
                                                style={{color: "green"}}>{formatCurrency(amount)}</span>,
                                        },
                                        {
                                            title: 'Description',
                                            dataIndex: 'description',
                                            key: 'description',
                                            render: (text) => <span>{text || 'General'}</span>,
                                        }, {
                                            title: 'Type',
                                            dataIndex: 'expenseSubType',
                                            key: 'expenseSubType',
                                            render: (text) => <span>{text || 'CASH-IN'}</span>,
                                        }]}
                                    pagination={false}>
                                </Table>
                            </div>
                            <div className={'report-section-container'}>
                                <Typography.Title level={4} className={'report-section-title'} style={{color: "red"}}>
                                    Cash Out Expenses
                                </Typography.Title>
                                <Table
                                    size={'large'}
                                    dataSource={cashOutExpenses}
                                    styles={tableCustomStyles}
                                    scroll={{x: 'max-content', y: 55 * 5}}
                                    columns={[
                                        {
                                            title: 'Amount',
                                            dataIndex: 'amount',
                                            key: 'amount',
                                            render: (amount) => <span
                                                style={{color: "red"}}>{formatCurrency(amount)}</span>,
                                        },
                                        {
                                            title: 'Description',
                                            dataIndex: 'description',
                                            key: 'description',
                                            render: (text) => <span>{text || 'General'}</span>,
                                        }, {
                                            title: 'Type',
                                            dataIndex: 'expenseSubType',
                                            key: 'expenseSubType',
                                            render: (text) => <span>{text || 'CASH-OUT'}</span>,
                                        }]}
                                    pagination={false}>
                                </Table>
                            </div>
                        </div>
                    )}
                    {(cashDenominationRecords.length > 0) && (
                        <div className={'report-section-container'}>
                            <Typography.Title level={4} className={'report-section-title'}>
                                Cash Denomination Summary
                            </Typography.Title>

                            <Table
                                size={'large'}
                                dataSource={cashDenominationRecords}
                                styles={tableCustomStyles}
                                scroll={{x: 'max-content', y: 55 * 5}}
                                columns={[
                                    {
                                        title: 'Denomination',
                                        key: 'denomination',
                                        render: (item) => {
                                            if (item.type === 'coin') {
                                                return `₹${item.denomination} (Coin)`
                                            } else {
                                                return `₹${item.denomination}`
                                            }
                                        }
                                    },
                                    {
                                        title: 'Good Notes',
                                        dataIndex: 'goodNotes',
                                        key: 'goodNotes'
                                    }, {
                                        title: 'Soiled Notes',
                                        dataIndex: 'soiledNotes',
                                        key: 'soiledNotes',
                                    }, {
                                        title: 'Amount',
                                        dataIndex: 'amount',
                                        key: 'amount',
                                        render: (amount) => formatCurrency(amount),
                                    }]}
                                pagination={false}
                                summary={() => {
                                    const totalAmount = cashDenominationRecords.reduce((acc, curr) => acc + curr.amount, 0);
                                    return (
                                        <>
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={3}>
                                                    <Typography.Title level={5}
                                                                      style={{margin: 0}}>Total</Typography.Title>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={1}>
                                                    <Typography.Text strong
                                                                     type="success">{formatCurrency(totalAmount)}</Typography.Text>
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        </>
                                    );
                                }}

                            >
                            </Table>


                        </div>
                    )}
                    {/* Hand Loans Section */}
                    {allHandloansWithBalances.length > 0 && (
                        <div className={'report-section-container'}>
                            <Typography.Title level={4} className={'report-section-title'}>
                                Hand Loans Details
                            </Typography.Title>

                            <Table
                                size={'large'}
                                dataSource={allHandloansWithBalances}
                                styles={tableCustomStyles}
                                scroll={{x: 'max-content', y: 55 * 5}}
                                columns={[
                                    {
                                        title: 'Loan No',
                                        dataIndex: 'handLoanNumber',
                                        key: 'handLoanNumber'
                                    },
                                    {
                                        title: 'Party',
                                        dataIndex: 'partyName',
                                        key: 'partyName'
                                    }, {
                                        title: 'Amount',
                                        dataIndex: 'loanAmount',
                                        key: 'loanAmount',
                                        render: (text) => formatCurrency(text),
                                    }, {
                                        title: 'Narration',
                                        dataIndex: 'narration',
                                        key: 'narration',
                                    }, {
                                        title: 'Recovered Amount',
                                        dataIndex: 'recoveredAmount',
                                        key: 'recoveredAmount',
                                        render: (text) => formatCurrency(text),
                                    }, {
                                        title: 'Balance Amount',
                                        dataIndex: 'balanceAmount',
                                        key: 'balanceAmount',
                                        render: (text) => formatCurrency(text),
                                    }, {
                                        title: 'Status',
                                        key: 'status',
                                        render: (item) => {

                                            const statusRecord = getHomeLoadStatus(item.status);
                                            return (
                                                <Tag color={statusRecord.color} key={item.status} variant={'solid'}>
                                                    {statusRecord.label}
                                                </Tag>
                                            );
                                        },
                                    },]}
                                pagination={false}>
                            </Table>
                        </div>
                    )}
                </Spin>


                <Modal
                    title="Day Closing PDF Report"
                    centered
                    open={pdfUrl}
                    onOk={() => setPdfUrl(null)}
                    onCancel={() => setPdfUrl(null)}
                    width={1000}
                    footer={[
                        <Button onClick={() => setPdfUrl(null)}>Cancel</Button>,
                        <Button
                            href={pdfUrl}
                            type={'primary'}
                            download={`DayClosingReport_${filterForm.getFieldValue('closingDate')?.format(DATE_SYSTEM_FORMAT)}.pdf`}>Download
                            PDF</Button>
                    ]}
                >
                    <iframe
                        src={pdfUrl}
                        title="Day Closing PDF Report"
                        style={{
                            width: "100%",
                            height: "75vh",
                            border: "none"
                        }}
                    />
                </Modal>

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

            </div>
        </DefaultAppSidebarLayout>
    );
}