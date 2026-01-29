import React, {useState, useEffect} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import './EditExpense.css';
import {APP_SERVER_URL_PREFIX, DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT} from '../../../constants.js';
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
    Alert,
    App as AntApp,
    Button,
    Col,
    DatePicker,
    Form, Input,
    InputNumber,
    Row,
    Select,
    Spin,
    Tag,
    Typography
} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import dayjs from "dayjs";
import Utils from "../../../Utils";
import FormUtils from "../../../_utils/FormUtils";
import {fetchExpense, updateExpense} from "./ExpensesDataSource";

export default function ExpenseEditFormPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [form] =  Form.useForm();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const formUtils = new FormUtils(AntApp.useApp());
    const isAdmin = Utils.isRoleApplicable("ADMIN");

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
        fetchOrganizationsData();
    }, []);


    const fetchExpenseData = async () => {
        setLoading(true);
        try {
            const json = await fetchExpense(id);

            form.setFieldsValue({
                transactionDate: dayjs(json.transactionDate || new Date()),
                amount: json.amount || '',
                employeeId: json.employeeId || '',
                organizationId: json.organizationId ? parseInt(json.organizationId) : null,
                organizationName: json.organizationName || '',
                expenseType: json.expenseType || '',
                expenseSubType: json.expenseSubType || '',
                referenceNumber: json.referenceNumber || '',
                createdDate: dayjs(json.createdDate || new Date())
            });
        } catch (error) {
            console.error("Error fetching expense:", error);
            formUtils.showErrorNotification("Failed to fetch expense");
        }
        setLoading(false);
    }


    useEffect(() => {
        fetchExpenseData();
    }, [id]);

    const handleSubmit = async (e) => {
        setLoading(true);


        try {

            await updateExpense(id, {
                transactionDate: form.getFieldValue('transactionDate')?.format(DATE_SYSTEM_FORMAT),
                amount: String(form.getFieldValue('amount')) || '',
                employeeId: form.getFieldValue('employeeId') || '',
                organizationId: String(form.getFieldValue('organizationId')),
                organizationName: form.getFieldValue('organizationName') || '',
                expenseType: form.getFieldValue('expenseType') || '',
                expenseSubType: form.getFieldValue('expenseSubType') || '',
                referenceNumber: form.getFieldValue('referenceNumber') || '',
                createdDate: form.getFieldValue('createdDate')?.format(DATE_SYSTEM_FORMAT),
            });

            formUtils.showSuccessNotification('Updated expense successfully');
            navigate(`/pettycash/expenses/${id}`, { replace: true });

        } catch (err) {
            console.error('Error updating expense:', err);
            formUtils.showErrorNotification('Failed to update expense. ' + (err.message ? ` ${err.message}` : ''));
        } finally {
            setLoading(false);
        }
    };


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
                        className="form-page"
                        onFinish={handleSubmit}
                        layout="vertical">

                        <div className='form-page-header'>


                            <div className={'page-title-section'}>


                                <Typography.Title className='page-title' level={2}>
                                    Edit Expense
                                </Typography.Title>
                            </div>


                            <div className={'page-actions'}></div>
                        </div>

                        <div className="form-page-fields-section">
                            <Typography.Title level={4} className="form-section-title">
                                Details
                                <Tag className={'title-tag'}>Transaction
                                    date: {form.getFieldValue('transactionDate')?.format(DATE_DISPLAY_FORMAT)}</Tag>
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
                                        name="createdDate"
                                        label="Expense Date"
                                        rules={[{required: true, message: 'Please select expense date'}]}
                                    >
                                        <DatePicker
                                            style={{width: "100%"}}
                                            format={DATE_DISPLAY_FORMAT}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="amount"
                                        label="Amount"
                                        rules={[{required: true, message: 'Please enter amount.'}, {
                                            validator: (_, value) => {
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
                                        />
                                    </Form.Item>
                                </Col>


                            </Row>
                        </div>

                        <div className="form-page-fields-section">
                            <Typography.Title level={4} className="form-section-title">
                                Summary
                            </Typography.Title>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="expenseSubType"
                                        label="Expense category"
                                    >
                                        <Input
                                            style={{width: "100%"}}
                                            disabled={true}
                                        />
                                    </Form.Item>
                                </Col>
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
            </div>
        </DefaultAppSidebarLayout>
    );
}
