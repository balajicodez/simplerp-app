import React, {useEffect, useState} from 'react';
import '../expenses/PettyCash.css';
import {useNavigate, useParams} from 'react-router-dom';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Col, Form, Input, Row, Select, Spin, Typography} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import {PRETTY_CASE_PAGE_TITLE, PRETTY_CASE_TYPES} from "../PrettyCaseConstants";
import * as DataSource from "./ExpenseMastersDataSource";
import FormUtils from "../../../_utils/FormUtils";

export default function ExpenseMasterFormPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const params = useParams();

    const isCreateMode = params.idOrCreate === 'create';

    const formUtils = new FormUtils(AntApp.useApp());


    useEffect(() => {
        if (isCreateMode) return;
        (async () => {
            const data = await DataSource.fetchExpenseMaster(params.idOrCreate);
            form.setFieldsValue({
                subtype: data.subtype,
                type: data.type,
                description: data.description
            });
        })();
    });


    const handleSubmit = async (e) => {
        setLoading(true);

        const formValues = form.getFieldsValue();

        try {
            if (!isCreateMode) {
                formValues.id = params.idOrCreate;
            }
            await DataSource.postExpenseTypeMaster(formValues);

            formUtils.showSuccessNotification(isCreateMode ? 'Created master successfully' : 'Updated master successfully');
            navigate(-1);
        } catch (err) {
            formUtils.showErrorNotification(isCreateMode ? 'Failed to create master' : 'Failed to update master');
        } finally {
            setLoading(false);
        }
    };

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
                        onFinish={handleSubmit}
                        onFinishFailed={onFinishFailed}
                        noValidate={true}
                        className="form-page"
                        layout="vertical">

                        <div className='form-page-header'>


                            <div className={'page-title-section'}>


                                <Typography.Title className='page-title' level={2}>
                                    {isCreateMode ? 'Create Expense Master' : 'Edit Expense Master'}
                                </Typography.Title>
                            </div>


                            <div className={'page-actions'}></div>
                        </div>

                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">Details</Typography.Title>


                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="subtype"
                                        label="Subtype"
                                        rules={[{required: true, message: 'Please enter subtype.'}]}
                                    >
                                        <Input placeholder="Please enter subtype"
                                               disabled={loading}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="type"
                                        label="Type"
                                        rules={[{required: true, message: 'Please select a type.'}]}
                                    >
                                        <Select
                                            style={{width: "100%"}}
                                            placeholder={'Select type'}
                                            disabled={!isCreateMode || loading}
                                            options={Object.values(PRETTY_CASE_TYPES)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="description"
                                label="Description"
                                rules={[{required: true, message: 'Please enter a description.'}]}
                            >
                                <Input placeholder="Description"
                                       disabled={loading}/>
                            </Form.Item>

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