import React, {useState, useEffect} from "react";
import "./pettyCashCreateExpense.css";
import {useNavigate, useLocation} from "react-router-dom";
import {DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT} from "../../../constants.js";
import Utils from '../../../Utils';
import CameraCapture from '../../../_components/camera-capture/CameraCapture';
import {PRETTY_CASE_PAGE_TITLE, PRETTY_CASE_TYPES} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
    Alert,
    App as AntApp,
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber, Modal,
    Row,
    Select,
    Spin,
    Tag,
    Typography
} from "antd";
import {InboxOutlined, LeftOutlined} from "@ant-design/icons";
import FormUtils from "../../../_utils/FormUtils";
import dayjs from "dayjs";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import Dragger from "antd/lib/upload/Dragger";
import {fetchExpenseMasters} from "../expense-masters/ExpenseMastersDataSource";
import {fetchCurrentBalance, postExpenseFormData} from "./ExpensesDataSource";
import {getBase64} from "../../../_utils/datasource-utils";


function ExpenseCreateFormPage() {

    const [form] = Form.useForm();
    const [transactionDate, setTransactionDate] = useState(null);
    const [modalFile, setModalFile] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [subTypes, setSubTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchedBalance, setFetchedBalance] = useState(0);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = Utils.isRoleApplicable("ADMIN");


    const params = new URLSearchParams(location.search);
    const expenseType = params.get("type");
    const formUtils = new FormUtils(AntApp.useApp());

    // Check if current balance section should be shown
    const showCurrentBalanceSection = expenseType === "CASH-OUT";


    const fetchCurrentBalanceData = async (organizationId, expenseDate) => {

        if (expenseType !== "CASH-OUT") {
            return;
        }

        if (!organizationId || !expenseDate) {
            setFetchedBalance(0);
            return;
        }

        setBalanceLoading(true);
        try {

            const balanceData = await fetchCurrentBalance(organizationId, expenseDate.format(DATE_SYSTEM_FORMAT));
            let balance = 0;
            if (balanceData.totalBalance != null) {
                balance = balanceData.totalBalance;
            } else if (
                balanceData.cashInAmt != null &&
                balanceData.cashOutAmt != null
            ) {
                balance = balanceData.cashInAmt - balanceData.cashOutAmt;
            } else if (balanceData.balance != null) {
                balance = balanceData.balance;
            }

            balance = Number(balance) || 0;
            setFetchedBalance(balance);
        } catch (err) {
            setFetchedBalance(0);
            formUtils.showErrorNotification("Failed to fetch current balance");
        } finally {
            setBalanceLoading(false);
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

    const fetchExpenseMastersData = async () => {
        try {
            const data = await fetchExpenseMasters(0, 1000);
            const subTypes = data._embedded ? data._embedded.expenseTypeMasters || [] : data;
            setSubTypes(subTypes.filter((s) => s.type === expenseType));
        } catch (error) {
            console.error("Error fetching data:", error);
            formUtils.showErrorNotification("Failed to fetch organizations");
        }
    };

    useEffect(() => {

        setTransactionDate(dayjs(new Date()));

        form.setFieldsValue({
            organizationId: !isAdmin ? parseInt(localStorage.getItem("organizationId")) : null,
            gstapplicable: false
        });

        fetchOrganizationsData();
        fetchExpenseMastersData();
    }, []);


    const handleAntSubmit = async (values) => {
        setLoading(true);

        const formValues = form.getFieldsValue();

        try {

            let storedUser = null;
            try {
                storedUser = JSON.parse(localStorage.getItem("currentUser") || "null");
            } catch (e) {
                storedUser = null;
            }

            const createdByUserId =
                storedUser && (storedUser.id || storedUser.userId)
                    ? storedUser.id || storedUser.userId
                    : null;
            const createdByUser =
                storedUser &&
                (storedUser.name || storedUser.username || storedUser.email)
                    ? storedUser.name || storedUser.username || storedUser.email
                    : localStorage.getItem("rememberedEmail") || "";



            const expensePayload = {
                transactionDate: transactionDate.format(DATE_SYSTEM_FORMAT),
                amount: Number(formValues.amount),
                employeeId: formValues.employeeId ? Number(formValues.employeeId) : undefined,
                expenseSubType: formValues.subtype,
                expenseType: expenseType,
                organizationId: formValues.organizationId,
                gstapplicable: formValues.gstapplicable,
                createdByUser,
                createdByUserId,
                createdDate: formValues.expenseDate.format(DATE_SYSTEM_FORMAT),
                description: formValues.description,
            }

            const formData = new FormData();
            formData.append(
                "expense",
                new Blob([JSON.stringify(expensePayload)], {type: "application/json"})
            );
            if (formValues.file && formValues.file.file) formData.append("file", formValues.file.file);


            await postExpenseFormData(formData);

            formUtils.showSuccessNotification('Created expense successfully');
            navigate(-1); // Redirect to previous page

        } catch (error) {
            formUtils.showErrorNotification('Failed to create expense', error.message);
            console.error('Error creating expense:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.hasOwnProperty('organizationId')
            || changedValues.hasOwnProperty('expenseDate')) {
            fetchCurrentBalanceData(allValues.organizationId, allValues.expenseDate);
        }
    }



    const onFinishFailed = (errorInfo) => {
        formUtils.showErrorNotification(errorInfo.message);
    }


    return (
        <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>

            <div className="form-page">

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
                        onFinish={handleAntSubmit}
                        onFinishFailed={onFinishFailed}
                        className="form-page"
                        encType="multipart/form-data"
                        layout="vertical">

                        <div className='form-page-header'>


                            <div className={'page-title-section'}>


                                <Typography.Title className='page-title' level={2}>
                                    {(() => {
                                        if (expenseType === PRETTY_CASE_TYPES.CASH_IN.value) return "Create Inward ";
                                        else if (expenseType === PRETTY_CASE_TYPES.CASH_OUT.value) return "Create Outward ";
                                        return "Create Expense";
                                    })()}
                                </Typography.Title>
                            </div>


                            <div className={'page-actions'}></div>
                        </div>

                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">
                                Details
                                <Tag className={'title-tag'}>Transaction
                                    date: {transactionDate?.format(DATE_DISPLAY_FORMAT)}</Tag>
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
                                        name="expenseDate"
                                        label="Expense Date"
                                        rules={[{required: true, message: 'Please select expense date'}]}
                                    >
                                        <DatePicker
                                            style={{width: "100%"}}
                                            format={DATE_DISPLAY_FORMAT}
                                        />
                                    </Form.Item>
                                </Col>
                                {showCurrentBalanceSection && (
                                    <Col span={24}>


                                        <Spin spinning={balanceLoading} tip="Loading..." size={'small'}>
                                            <Alert title={`Available Balance (Selected branch & date): ${fetchedBalance}`} className={'balance-alert'} type="info" showIcon />
                                        </Spin>
                                    </Col>
                                )}

                                <Col span={12}>
                                    <Form.Item
                                        name="amount"
                                        label="Amount"
                                        rules={[{required: true, message: 'Please enter amount.'},
                                            {
                                                validator: (_, value) =>
                                                    (showCurrentBalanceSection && value && fetchedBalance < value)
                                                        ? Promise.reject(new Error("Amount cannot exceed current balance"))
                                                        : Promise.resolve(),
                                            }]}
                                    >
                                        <InputNumber
                                            style={{width: "100%"}}
                                            formatter={(value) => {
                                                if (!value) return "";
                                                return `₹ ${new Intl.NumberFormat("en-IN").format(value)}`;
                                            }}
                                            parser={(value) => value?.replace(/₹\s?|(,*)/g, "")}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}></Col>



                                {subTypes.length > 0 && <Col span={12}>
                                    <Form.Item
                                        name={"subtype"}
                                        label="Expense category"
                                        rules={[{
                                            required: true, message: 'Please select expense category.'
                                        }]}
                                    >
                                        <Select
                                            style={{width: "100%"}}
                                            placeholder={'Select expense category'}
                                            options={subTypes.map((sub) => ({value: sub.subtype, label: sub.subtype}))}
                                        />
                                    </Form.Item>
                                </Col>}

                                <Col span={12}>
                                    <Form.Item
                                        name={"gstapplicable"}
                                        label="Book"
                                        rules={[{required: true, message: 'Please select book.'}]}
                                    >
                                        <Select
                                            style={{width: "100%"}}
                                            placeholder={'Select book'}
                                            options={[
                                                {value: true, label: 'Yes'},
                                                {value: false, label: 'No'}
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item
                                        name={"file"}
                                        label="Upload receipt">
                                        <Dragger
                                            maxCount={1}
                                            onPreview={async (file) => {
                                                setModalFile(await getBase64(file.originFileObj));
                                            }}
                                            accept="image/*,.pdf,.doc,.docx,.xlsx"
                                            beforeUpload={(file) => {
                                              //  antForm.setFieldsValue({file: file});
                                                return false;
                                            }}
                                        >
                                            <p className="ant-upload-drag-icon">
                                                <InboxOutlined/>
                                            </p>
                                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                            <p className="ant-upload-hint">
                                                Strictly prohibited from uploading
                                                company data or other
                                                banned files.
                                            </p>
                                        </Dragger>

                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item
                                        rows="10"
                                        name={"description"}
                                        label="Narration"
                                    >
                                        <Input.TextArea
                                            placeholder={'Enter narration / Notes'}
                                        />
                                    </Form.Item>
                                </Col>

                                {/* <div className="flex wrap gap-4 w-full">
                     <div className="w-1/2">
                      <label className="">File/Image Capture</label>

                      <button
                            type="button"
                            onClick={() => {
                              return <CameraCapture />;
                            }}
                          >
                            Open Camera
                       </button>

                     </div>
                  </div>   */}
                            </Row>
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

export default ExpenseCreateFormPage;
