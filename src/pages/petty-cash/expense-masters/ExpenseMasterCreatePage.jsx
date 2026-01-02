import React, {useState} from 'react';
import '../../../pettycash/PettyCash.css';
import {useNavigate} from 'react-router-dom';
import {APP_SERVER_URL_PREFIX} from '../../../constants.js';
import DefaultAppSidebarLayout from "../../../_components/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Button, Form, Input, notification, Select, Typography} from "antd";
import {DollarOutlined, LeftOutlined} from "@ant-design/icons";
import {PRETTY_CASE_TYPES} from "../PrettyCaseConstants";
import {createExpenseTypeMaster} from "./expenseTypeMasterApiService";

export default function ExpenseMasterCreatePage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [api, contextHolder] = notification.useNotification();

    const showErrorNotification = (message) => {
        api.error({
            title: message,
            placement: 'top',
        });
    };


    const handleSubmit = async (e) => {
        setLoading(true);

        const formValues = form.getFieldsValue();

        try {
            await createExpenseTypeMaster(formValues);
            navigate('/pettycash/masters');
        } catch (err) {
            showErrorNotification('Failed to create master');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DefaultAppSidebarLayout pageTitle={<span><DollarOutlined/> Petty Cash</span>}>


            <Form
                form={form}
                onFinish={handleSubmit}
                labelCol={{span: 4}}
                wrapperCol={{span: 14}}
                layout="horizontal">

                {contextHolder}


                <Button htmlType="submit"
                        type={'text'}
                        icon={<LeftOutlined/>}
                        size={'large'}
                        iconPlacement={'left'}
                        onClick={() => {
                            navigate("/pettycash/masters");
                        }}>
                    Back
                </Button>

                <div className='form-page-header'>


                    <div className={'page-title-section'}>


                        <Typography.Title className='page-title' level={4}>Create Expense Type Master</Typography.Title>
                    </div>


                    <div className={'page-actions'}>
                        <Button htmlType="submit"
                                size={'large'}
                                type="primary"
                                loading={loading}>
                            Save
                        </Button>

                    </div>
                </div>

                <div className="form-page-fields-section">


                    <Typography.Title level={5} className="form-section-title">Details</Typography.Title>

                    <Form.Item
                        name="subtype"
                        label="Subtype"
                        rules={[{required: true, message: 'Please enter a subtype!'}]}
                    >
                        <Input value={form.subtype}
                               placeholder="Please enter subtype"
                               disabled={loading}/>
                    </Form.Item>


                    <Form.Item
                        name="type"
                        label="Type"
                        rules={[{required: true, message: 'Please select a type!'}]}
                    >
                        <Select
                            style={{width: "100%"}}
                            placeholder={'Select type'}
                            options={Object.entries(PRETTY_CASE_TYPES).map(([value, label]) => ({
                                label,
                                value
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{required: true, message: 'Please enter a description!'}]}
                    >
                        <Input value={form.description}
                               placeholder="Description"
                               disabled={loading}/>
                    </Form.Item>


                </div>
            </Form>
        </DefaultAppSidebarLayout>
    );
}