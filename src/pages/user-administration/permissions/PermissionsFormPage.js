import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Col, Divider, Form, Input, InputNumber, Row, Select, Spin, Typography} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import * as DataSource from "./DataSource";
import FormUtils from "../../../_utils/FormUtils";

export default function PermissionsFormPage() {
    const params = useParams();
    const isCreateMode = params.idOrCreate === 'create';

    const navigate = useNavigate();

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const formUtils = new FormUtils(AntApp.useApp());


    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                if (!isCreateMode) {
                    // Fetch current permission data
                    const permissionData = await DataSource.fetchPermissionById(params.idOrCreate);
                    form.setFieldsValue({
                        name: permissionData.name
                    })
                }
            } catch (err) {
                formUtils.showErrorNotification("Failed to load permission.")
            }
            setLoading(false);
        })();

    }, []);


    const handleSubmit = async (e) => {
        setLoading(true);

        const formValues = form.getFieldsValue();
        const payload = {
            name: formValues.name
        };

        if (isCreateMode) {
            payload.id = null;
            try {
                await DataSource.createPermission(payload);
                formUtils.showSuccessNotification("Organization permission successfully!");
                navigate(-1);
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification("Failed to permission organization.");
            }
        } else {
            try {
                await DataSource.updatePermission(params.idOrCreate, payload);
                formUtils.showSuccessNotification("Organization permission successfully!");
                navigate(-1);
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification("Failed to update permission.");
            }
        }


        setLoading(false);
    };

    const onFinishFailed = (errorInfo) => {
        formUtils.showErrorNotification(errorInfo.message);
    }


    return (
        <DefaultAppSidebarLayout pageTitle={"User Administration"}>

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
                        autoComplete="off"
                        className="form-page"
                        layout="vertical">

                        <div className='form-page-header'>


                            <div className={'page-title-section'}>


                                <Typography.Title className='page-title' level={2}>
                                    {isCreateMode ? 'Create Permission' : 'Edit Permission'}
                                </Typography.Title>
                            </div>


                            <div className={'page-actions'}></div>
                        </div>




                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">Details</Typography.Title>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="name"
                                        label="Permission Name"
                                        rules={[{
                                            required: true,
                                            message: 'Please enter permission name.'
                                        }, {
                                            pattern: /^[a-zA-Z0-9_\- ]+$/,
                                            message: 'Only alphanumeric characters, spaces and hyphens are allowed.'
                                        }, {
                                            min: 3,
                                            message: 'Permission name must be at least 3 characters long.'
                                        }]}
                                    >
                                        <Input placeholder="Please enter permission name"
                                               disabled={loading}/>
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
