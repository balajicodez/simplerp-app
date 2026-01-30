import React, {useEffect, useState} from "react";
import "./CreateDayClosing.css";
import {DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT, DAY_CLOSING_WHATSAPP_NUMBERS_CSV} from "../../../constants.js";
import {useNavigate} from "react-router-dom";
import Utils from "../../../Utils";
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
    Alert,
    App as AntApp,
    Button,
    Col,
    DatePicker,
    Descriptions,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Spin,
    Table,
    Typography
} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import createDayClosingReportPDF from "../../reports/day-closing/createDayClosingReportPDF";
import {getOrganizationAddressText} from "../../reports/day-closing/utils";
import {
    fetchDayClosingData,
    fetchExpenseReportData,
    fetchHandLoans
} from "../../reports/day-closing/dayClosingReportApiService";
import dayjs from "dayjs";
import {fetchInitBalanceDate, postDayClosingFormData, postWhatsappReport} from "./DayClosingDataSource";
import FormUtils from "../../../_utils/FormUtils";
import {formatCurrency} from "../../../_utils/CommonUtils";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import {DENOMINATION_OPTIONS, getDenominationTotals, parseDenominations} from "./utils";

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


export default function CreateDayClosingFormPage() {
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [balanceData, setBalanceData] = useState(null);

    // Simplified denomination state
    const [denominationForm, setDenominationForm] = useState({});
    const [denominationEntries, setDenominationEntries] = useState([]);


    const navigate = useNavigate();

    const [denominationError, setDenominationError] = useState("");


    const [fileUploads, setFileUploads] = useState([]);

    const isAdmin = Utils.isRoleApplicable("ADMIN");

    const formUtils = new FormUtils(AntApp.useApp());
    const [form] = Form.useForm();

    // Handle file input change
    const handleFileChange = (index, event) => {
        const updatedFiles = [...fileUploads];
        updatedFiles[index] = {
            ...updatedFiles[index],
            file: event.target.files[0],
        }; // Store the selected file
        setFileUploads(updatedFiles);
    };

    // Handle file description change
    const handleFileDescriptionChange = (index, description) => {
        const updatedFiles = [...fileUploads];
        updatedFiles[index] = {
            ...updatedFiles[index],
            description,
        }; // Store the selected file
        setFileUploads(updatedFiles);
    };

    // Add a new file upload input
    const addFileUpload = () => {
        setFileUploads([...fileUploads, {}]); // Add an empty file slot to the array
    };

    // Remove a file upload input
    const removeFileUpload = (index) => {
        const updatedFiles = fileUploads.filter((_, i) => i !== index); // Remove the file input by index
        setFileUploads(updatedFiles);
    };


    const handleGenerateReport = async () => {
        try {
            const organizationId = form.getFieldValue('organizationId');
            const closingDate = form.getFieldValue('closingDate')?.format(DATE_SYSTEM_FORMAT);

            const selectedOrganization = organizations.find(o => String(o.id) == String(organizationId));

            const dayClosingData = await fetchDayClosingData(organizationId, closingDate);

            // Expenses
            const expensesData = await fetchExpenseReportData(organizationId, closingDate) || [];

            // Hand loans
            const handLoansData = await fetchHandLoans(0, 1000, ['ISSUED,PARTIALLY_RECOVERED'], organizationId);
            const handLoans = handLoansData.content || handLoansData || [];
            handLoans?.forEach(loan => loan.recoveredAmount = (loan.loanAmount || 0) - (loan.balanceAmount || 0));

            if (!dayClosingData &&
                expensesData.length === 0 &&
                handLoans.length === 0
            ) {
                return;
            }

            const cashInExpenses = expensesData.filter(
                (expense) => expense.expenseType === "CASH-IN"
            );
            const cashOutExpenses = expensesData.filter(
                (expense) => expense.expenseType === "CASH-OUT"
            );

            const doc = createDayClosingReportPDF({
                closingDate: dayjs(closingDate).format(DATE_DISPLAY_FORMAT),
                organizationName: selectedOrganization?.name,
                organizationAddress: getOrganizationAddressText(selectedOrganization),
                cashInExpenses,
                cashOutExpenses,
                dayClosingData,
                handLoans,
            });

            return doc.output("datauristring").split(",")[1];
        } catch (e) {
            console.error("PDF generation error:", e);
        }
    };


    const fetchOrganizationsData = async () => {
        try {
            const data = await fetchOrganizations(0, 1000);
            setOrganizations(data._embedded ? data._embedded.organizations || [] : data);
        } catch (error) {
            console.error("Error fetching data:", error);
            formUtils.showErrorNotification("Failed to fetch organizations");
        }
    };

    useEffect(() => {

        form.setFieldsValue({
            organizationId: !isAdmin ? parseInt(localStorage.getItem("organizationId")) : null,
            description: "Day closing",
            closingDate: dayjs(new Date())
        })

        fetchOrganizationsData();
        fetchBalanceData(form.getFieldValue('organizationId'), form.getFieldValue('closingDate'));
    }, []);


    const fetchBalanceData = async (organizationId, closingDate) => {
        if (!closingDate || !organizationId) {
            return;
        }

        try {
            const balanceData = await fetchInitBalanceDate(closingDate?.format(DATE_SYSTEM_FORMAT), organizationId);
            setBalanceData(balanceData);
        } catch (error) {
            console.error("Error fetching balance data:", error);
            setBalanceData(null);
        }
    };

    const addDenominationEntry = () => {
        setDenominationError("")
        if (!denominationForm.denominationId) {
            setDenominationError("Please select a denomination");
            return;
        }

        // Check if this denomination already exists
        const existingEntry = denominationEntries.find((e) => e.id === denominationForm.denominationId);
        if (existingEntry) {
            setDenominationError("This denomination has already been added");
            return;
        }

        const goodCount = denominationForm.goodCount || 0;
        const badCount = denominationForm.badCount || 0;

        if (goodCount + badCount === 0) {
            setDenominationError("Please provide good or bad count for this denomination");
            return;
        }

        setDenominationEntries([...denominationEntries, {
            id: denominationForm.denominationId,
            denominationRecord: DENOMINATION_OPTIONS.find((e) => e.id === denominationForm.denominationId),
            goodCount,
            badCount
        }]);

        // Reset form
        setDenominationForm({});
    };

    const removeDenominationEntry = (id) => {
        setDenominationEntries(
            denominationEntries.filter((entry) => entry.id !== id)
        );
    };


    const handleSubmit = async (e) => {
        setLoading(true);
        setDenominationError("");
        formUtils.clearNotifications();

        if (denominationEntries.length === 0) {
            setDenominationError("Please add denomination entries");
            formUtils.showErrorNotification("Please add denomination entries");
            setLoading(false);
            return;
        }

        const {totalAmount} = getDenominationTotals(denominationEntries);


        if (Math.abs(totalAmount - balanceData.closingBalance) > 0.01) {
            setDenominationError(
                `Closing balance mismatch! Denomination total: ${formatCurrency(totalAmount)} vs API closing balance: ${formatCurrency(balanceData.closingBalance)}`
            );
            formUtils.showErrorNotification("Closing balance mismatch", `Denomination total: ${formatCurrency(totalAmount)} vs API closing balance: ${formatCurrency(balanceData.closingBalance)}`);
            setLoading(false);
            return;
        }

        try {

            const organizationId = form.getFieldValue('organizationId');
            const selectedOrganization = organizations.find(o => String(o.id) == String(organizationId));
            const description = form.getFieldValue('description')?.trim() || "Day Closing";
            const closingDate = form.getFieldValue('closingDate')?.format(DATE_SYSTEM_FORMAT);
            const comment = form.getFieldValue('comment')?.trim() || "";
            const currentUser = localStorage.getItem("username") || localStorage.getItem("user") || "";

            const {
                totalAmount: closingBalanceCalc,
            } = getDenominationTotals(denominationEntries);

            const parsedDenominationMap = parseDenominations(denominationEntries);

            // Create payload exactly matching your original working structure
            const payload = {
                closingDate,
                description,
                createdBy: currentUser,
                comment,
                createdTime: new Date().toISOString(),
                organizationId,
                closingBalance:
                    closingBalanceCalc || (balanceData.closingBalance ? Number(balanceData.closingBalance) : 0),
                openingBalance: balanceData.openingBalance,
                cashIn: balanceData.cashIn,
                cashOut: balanceData.cashOut,

                tenNoteCount: parsedDenominationMap.tenNoteCount,
                twentyNoteCount: parsedDenominationMap.twentyNoteCount,
                fiftyNoteCount: parsedDenominationMap.fiftyNoteCount,
                hundredNoteCount: parsedDenominationMap.hundredNoteCount,
                twoHundredNoteCount: parsedDenominationMap.twoHundredNoteCount,
                fiveHundredNoteCount: parsedDenominationMap.fiveHundredNoteCount,
                tenSoiledNoteCount: parsedDenominationMap.tenSoiledNoteCount,
                twentySoiledNoteCount: parsedDenominationMap.twentySoiledNoteCount,
                fiftySoiledNoteCount: parsedDenominationMap.fiftySoiledNoteCount,
                hundredSoiledNoteCount: parsedDenominationMap.hundredSoiledNoteCount,
                twoHundredSoiledNoteCount: parsedDenominationMap.twoHundredSoiledNoteCount,
                fiveHundredSoiledNoteCount: parsedDenominationMap.fiveHundredSoiledNoteCount,
                oneCoinCount: parsedDenominationMap.oneCoinCount,
                fiveCoinCount: parsedDenominationMap.fiveCoinCount,
                tenCoinCount: parsedDenominationMap.tenCoinCount,
                twentyCoinCount: parsedDenominationMap.twentyCoinCount
            };

            const formData = new FormData();
            formData.append(
                "pettycashdayclosing",
                new Blob([JSON.stringify(payload)], {type: "application/json"})
            );

            fileUploads.forEach((fileUpload, idx) => {
                if (fileUpload.file) {
                    formData.append(`files`, fileUpload.file);
                    formData.append("fileDescriptions", fileUpload.description || "");
                }
            });

            await postDayClosingFormData(formData);

            // Send PDF report to WhatsApp
            try {
                const pdfReportBase64 = await handleGenerateReport();
                const messagePayload = {};
                messagePayload.media = pdfReportBase64;
                messagePayload.medianame = `Day_Closing_Report_${closingDate}.pdf`;
                messagePayload.mobile = DAY_CLOSING_WHATSAPP_NUMBERS_CSV;
                messagePayload.templatename = "day_closing_report";
                messagePayload.dvariables = [selectedOrganization?.name || "Organization", closingDate, balanceData.cashIn, balanceData.cashOut, balanceData.closingBalance];
                await postWhatsappReport([messagePayload]);
            } catch (error) {
                console.error("Error:", error);
            }

            formUtils.showSuccessNotification("Day closing created successfully!");
            navigate(-1); // Previous page
        } catch (e) {
            formUtils.showErrorNotification(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.hasOwnProperty('organizationId')
            || changedValues.hasOwnProperty('closingDate')) {
            fetchBalanceData(allValues.organizationId, allValues.closingDate);
        }
    }


    const onFinishFailed = (errorInfo) => {
        formUtils.showErrorNotification(errorInfo.message);
    }

    return (
        <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>

            <div className="form-page day-closing-form-page">

                <Button variant="filled"
                        color={'default'}
                        icon={<LeftOutlined/>}
                        size={'large'}
                        iconPlacement={'left'}
                        onClick={() => {
                            navigate(-1);
                        }}>
                    Back
                </Button>

                <Spin spinning={loading} tip="Loading..." size={'large'}>

                    <Form
                        form={form}
                        noValidate={true}
                        onValuesChange={handleValueChange}
                        onFinish={handleSubmit}
                        onFinishFailed={onFinishFailed}
                        className="form-page"
                        encType="multipart/form-data"
                        layout="vertical">

                        <div className='form-page-header'>


                            <div className={'page-title-section'}>


                                <Typography.Title className='page-title' level={2}>
                                    Create Day Closing Report
                                </Typography.Title>
                            </div>


                            <div className={'page-actions'}></div>
                        </div>

                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">
                                Details
                            </Typography.Title>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="organizationId"
                                        label="Branch"
                                        rules={[{required: true, message: 'Please select branch.'}]}
                                    >
                                        <Select
                                            style={{width: "100%"}}
                                            disabled={!isAdmin}
                                            placeholder={'Select branch'}
                                            options={organizations.map((org) => ({value: org.id, label: org.name}))}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="closingDate"
                                        label="Closing Date"
                                        rules={[{required: true, message: 'Please select closing date'}]}
                                    >
                                        <DatePicker
                                            style={{width: "100%"}}
                                            format={DATE_DISPLAY_FORMAT}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="description"
                                        label="Description"
                                        rules={[{required: true, message: 'Please provide description'}]}
                                    >
                                        <Input
                                            style={{width: "100%"}}
                                        />
                                    </Form.Item>
                                </Col>


                                <Col span={12}></Col>


                                <Col span={24}>
                                    <Form.Item
                                        rows="10"
                                        name={"comment"}
                                        label="Comments"
                                    >
                                        <Input.TextArea
                                            placeholder={'Enter comments / Notes'}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">
                                Balance Summary
                            </Typography.Title>

                            <Table styles={tableCustomStyles}
                                   dataSource={[balanceData]}
                                   bordered={true}
                                   columns={[{
                                       title: "Opening Balance",
                                       dataIndex: "openingBalance",
                                       key: "openingBalance",
                                       render: (item) => formatCurrency(item)
                                   }, {
                                       title: "Cash In",
                                       dataIndex: "cashIn",
                                       key: "cashIn",
                                       render: (item) => formatCurrency(item)
                                   }, {
                                       title: "Cash Out",
                                       dataIndex: "cashOut",
                                       key: "cashOut",
                                       render: (item) => formatCurrency(item)
                                   }, {
                                       title: "Closing Balance",
                                       dataIndex: "closingBalance",
                                       key: "closingBalance",
                                       render: (item) => formatCurrency(item)
                                   }]}
                                pagination={false}
                            >
                            </Table>
                        </div>

                        <div className="form-page-fields-section">

                            <Typography.Title level={4} className="form-section-title">
                                Attachments
                            </Typography.Title>


                            {fileUploads.map((fileUpload, index) => (
                                <Row gutter={24} style={{marginTop: '1rem'}}>

                                    <Col span={8}>
                                        <Typography.Text>Upload Bills/Receipts</Typography.Text>
                                        <input
                                            type="file"
                                            name="fileUpload"
                                            onChange={(e) => handleFileChange(index, e)}
                                            accept="image/*,.pdf,.doc,.docx,.xlsx"
                                        />
                                    </Col>


                                    <Col span={8}>
                                        <Form.Item label={'Description'}>
                                            <Input
                                                value={fileUpload.description || ""}
                                                onChange={(e) => handleFileDescriptionChange(index, e.target.value)}>
                                            </Input>
                                        </Form.Item>
                                    </Col>

                                    <Col span={8}>
                                        <Form.Item label={' '}>
                                            <Button
                                                variant="solid"
                                                color="danger"
                                                onClick={() => removeFileUpload(index)}
                                            >
                                                Remove
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            ))}

                            <Button
                                onClick={addFileUpload}
                                variant="filled"
                                color="blue"
                            >
                                Add File
                            </Button>
                        </div>


                        <div className="form-page-fields-section">

                            <Typography.Title level={4} className="form-section-title">
                                Add Denomination
                            </Typography.Title>

                            {denominationError && (
                                <Alert title={denominationError} className={'denomination-alert'} type="error"
                                       showIcon/>)}

                            <Row gutter={24}>
                                <Col span={6}>
                                    <Form.Item
                                        label="Denomination"
                                        rules={[{required: true, message: 'Please select denomination.'}]}
                                    >
                                        <Select
                                            virtual={false}
                                            style={{width: "100%"}}
                                            placeholder={'Select denomination'}
                                            value={denominationForm.denominationId}
                                            onChange={(value) => setDenominationForm({
                                                ...denominationForm,
                                                denominationId: value
                                            })}
                                            options={DENOMINATION_OPTIONS.filter(
                                                (option) =>
                                                    !denominationEntries.some((entry) => entry.id === option.id)
                                            ).map((option) => ({
                                                value: option.id,
                                                label: option.label
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        label="Good Count"
                                    >
                                        <InputNumber
                                            value={denominationForm.goodCount}
                                            onChange={(value) => setDenominationForm({
                                                ...denominationForm,
                                                goodCount: value
                                            })}
                                            style={{width: "100%"}}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>

                                {(!denominationForm.denominationId || DENOMINATION_OPTIONS.find(d => d.id === denominationForm.denominationId).type == "note") &&
                                    <Col span={6}>
                                        <Form.Item
                                            label="Bad Count"
                                        >
                                            <InputNumber
                                                value={denominationForm.badCount}
                                                onChange={(value) => setDenominationForm({
                                                    ...denominationForm,
                                                    badCount: value
                                                })}
                                                style={{width: "100%"}}
                                                min={0}
                                            />
                                        </Form.Item>
                                    </Col>}
                                <Col span={6}>
                                    <Form.Item label={' '}>
                                        <Button variant="filled" color="blue" onClick={addDenominationEntry}>
                                            Add Denomination
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>

                            {denominationEntries.length > 0 && (
                                <>
                                    <Typography.Title level={4} className="denomination-title"
                                                      style={{textAlign: 'center'}}>Cash Denomination
                                        Slip</Typography.Title>
                                    <Table dataSource={denominationEntries}
                                           rowKey="id"
                                           styles={tableCustomStyles}
                                           bordered={true}
                                           columns={[{
                                               title: "Denomination",
                                               key: "label",
                                               render: (item) => <Typography.Text
                                                   strong>{item.denominationRecord.label}</Typography.Text>
                                           }, {
                                               title: "Good Count",
                                               dataIndex: "goodCount",
                                               key: "goodCount",
                                           }, {
                                               title: "Bad Count",
                                               dataIndex: "badCount",
                                               key: "badCount",
                                           }, {
                                               title: "Amount",
                                               key: "totalAmount",
                                               render: (item) => <Typography.Text
                                                   strong>{formatCurrency(item.denominationRecord.denominationValue * (item.goodCount + item.badCount))}</Typography.Text>
                                           }, {
                                               title: "Action",
                                               key: "action",
                                               render: (text, record) => (
                                                   <Button
                                                       onClick={() => removeDenominationEntry(record.id)}
                                                       color="danger"
                                                       variant="solid"
                                                   >
                                                       Remove
                                                   </Button>
                                               )
                                           }
                                           ]}
                                           summary={() => {
                                               const {
                                                   totalGood,
                                                   totalBad,
                                                   totalAmount
                                               } = getDenominationTotals(denominationEntries);
                                               return (
                                                   <>
                                                       <Table.Summary.Row>
                                                           <Table.Summary.Cell index={0}
                                                                               colSpan={1}></Table.Summary.Cell>
                                                           <Table.Summary.Cell index={1}>
                                                               <Typography.Text strong
                                                                                style={{color: 'blue'}}>Good: {formatCurrency(totalGood)}</Typography.Text>
                                                           </Table.Summary.Cell>
                                                           <Table.Summary.Cell index={2}>
                                                               <Typography.Text strong
                                                                                style={{color: 'blue'}}>Bad: {formatCurrency(totalBad)}</Typography.Text>
                                                           </Table.Summary.Cell>
                                                           <Table.Summary.Cell index={3}>
                                                               <Typography.Text strong
                                                                                style={{color: 'green'}}>Total: {formatCurrency(totalAmount)}</Typography.Text>
                                                           </Table.Summary.Cell>
                                                           <Table.Summary.Cell index={4}></Table.Summary.Cell>
                                                       </Table.Summary.Row>
                                                   </>
                                               );
                                           }}
                                           pagination={false}></Table></>
                            )}

                        </div>

                        <div className='form-page-footer'>
                            <div className={'page-actions'}>
                                <Button htmlType="submit"
                                        size={'large'}
                                        type="primary"
                                        loading={loading}>
                                    Save
                                </Button>
                            </div>
                        </div>

                    </Form>
                </Spin>
            </div>
        </DefaultAppSidebarLayout>
    );
}