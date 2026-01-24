import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Col, Divider, Form, Input, InputNumber, Row, Select, Spin, Typography} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import * as OrganizationDataSource from "./OrganizationDataSource";
import FormUtils from "../../../_utils/FormUtils";

export default function OrganizationFormPage() {
    const params = useParams();

    const isCreateMode = params.idOrCreate === 'create';

    const navigate = useNavigate();

    const [form] = Form.useForm();

    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);

    const formUtils = new FormUtils(AntApp.useApp());


    useEffect(() => {
        setLoading(true);

        (async () => {

            try {
                // Fetch All Branches for parent dropdown
                const data = await OrganizationDataSource.fetchOrganizations(0, 1000);
                const orgs = data._embedded ? data._embedded.organizations || [] : data;
                setOrganizations(orgs);

                if (isCreateMode) {
                    form.setFieldsValue({
                        status: "Active"
                    });
                }  else {

                    // Fetch current organization data
                    const organizationData = await OrganizationDataSource.fetchOrganizationById(params.idOrCreate);
                    form.setFieldsValue({
                        name: organizationData.name,
                        registrationNo: organizationData.registrationNo ,
                        gstn: organizationData.gstn,
                        pan: organizationData.pan,
                        contact: organizationData.contact,
                        fax: organizationData.fax,
                        email: organizationData.email,
                        website: organizationData.website,
                        status: organizationData.status,
                        address: organizationData.address?.address,
                        city: organizationData.address?.city,
                        pincode: organizationData.address?.pincode,
                        parentOrganizationId: organizationData.parentOrganizationId
                    })
                }
            } catch (err) {
                formUtils.showErrorNotification("Failed to load organization.")
            }
            setLoading(false);
        })();

    }, []);


    const handleSubmit = async (e) => {
        setLoading(true);

        const formValues = form.getFieldsValue();
        const payload = {
            name: formValues.name,
            registrationNo: formValues.registrationNo,
            gstn: formValues.gstn,
            pan: formValues.pan,
            contact: formValues.contact,
            fax: formValues.fax,
            email: formValues.email,
            website: formValues.website,
            status: formValues.status,
            address: {
                address: formValues.address,
                city: formValues.city,
                pincode: formValues.pincode,
            },
        };

        // Add parent organization if selected
        if (formValues.parentOrganizationId) {
            payload.parentOrganizationId = Number(formValues.parentOrganizationId);
        } else {
            // If no parent selected, ensure we don't send parentOrganizationId
            // or set it to null if your backend expects it
            payload.parentOrganizationId = null;
        }

        if (isCreateMode) {
            payload.id = null;
            try {
                await OrganizationDataSource.createOrganization(payload);
                formUtils.showSuccessNotification("Organization created successfully!");
                navigate("/user-administration/organizations");
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification("Failed to create organization.");
            }
        } else {
            try {
                await OrganizationDataSource.updateOrganization(params.idOrCreate, payload);
                formUtils.showSuccessNotification("Organization updated successfully!");
                navigate("/user-administration/organizations");
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification("Failed to update organization.");
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
                                    {isCreateMode ? 'Create Organization' : 'Edit Organization'}
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
                                        label="Organization Name"
                                        rules={[{required: true, message: 'Please enter organization name.'}]}
                                    >
                                        <Input value={form.subtype}
                                               placeholder="Please enter organization name"
                                               disabled={loading}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="status"
                                        label="Status"
                                    >
                                        <Select
                                            style={{width: "100%"}}
                                            placeholder={'Select status'}
                                            options={[{
                                                label: 'Active',
                                                value: 'Active'
                                            }, {
                                                label: 'Inactive',
                                                value: 'Inactive'
                                            }]}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="parentOrganizationId"
                                        label="Parent Organization"
                                    >
                                        <Select
                                            style={{width: "100%"}}
                                            placeholder={'Select parent organization'}
                                            options={organizations.filter(item => item.id + '' !== params.idOrCreate + '').map(item => ({
                                                label: item.name,
                                                value: item.id
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}></Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="registrationNo"
                                        label="Registration Number"
                                    >
                                        <Input placeholder="Please enter registration number"
                                               disabled={loading}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}></Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="gstn"
                                        label="GST Number"
                                    >
                                        <Input placeholder="Please enter GST number"
                                               disabled={loading}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="pan"
                                        label="PAN Number"
                                    >
                                        <Input placeholder="Please enter PAN number"
                                               disabled={loading}/>
                                    </Form.Item>
                                </Col>

                                <Divider></Divider>

                                <Col span={12}>
                                    <Form.Item
                                        name="address"
                                        label="Address"
                                    >
                                        <Input.TextArea placeholder="Please enter address"/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}/>

                                <Col span={12}>
                                    <Form.Item
                                        name="city"
                                        label="City"
                                    >
                                        <Input placeholder="Please enter city"/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="pincode"
                                        label="Pin Code"

                                    >
                                        <InputNumber minLength={6} maxLength={6} style={{width: '100%'}} placeholder="Please enter pin code"/>
                                    </Form.Item>
                                </Col>
                            </Row>

                        </div>

                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">Contact
                                Information</Typography.Title>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="contact"
                                        label="Contact Number"
                                        rules={[{required: true, message: 'Please enter contact number.'}]}
                                    >
                                        <Input value={form.contact}
                                               placeholder="Please enter contact number"
                                               disabled={loading}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="fax"
                                        label="Fax"
                                    >
                                        <Input placeholder="Please enter fax number"/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                    >
                                        <Input placeholder="Please enter email address"/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="website"
                                        label="Website"
                                    >
                                        <Input placeholder="Please enter website address"/>
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
