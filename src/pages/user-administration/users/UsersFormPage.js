import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Alert, App as AntApp, Button, Checkbox, Col, Form, Input, Progress, Row, Select, Spin, Typography} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import * as UsersDataSource from "./UsersDataSource";
import FormUtils from "../../../_utils/FormUtils";
import * as RolesDataSource from "../roles/RolesDataSource";
import * as OrganizationDataSource from "../organizations/OrganizationDataSource";
import {checkPasswordStrength} from "./utils";

export default function UsersFormPage() {
    const params = useParams();
    const isCreateMode = params.idOrCreate === 'create';

    const navigate = useNavigate();

    const [form] = Form.useForm();
    const [roles, setRoles] = useState([]);
    const [selectedRoleMap, setSelectedRoleMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const formUtils = new FormUtils(AntApp.useApp());


    useEffect(() => {
        setLoading(true);


        (async () => {


            try {

                await fetchOrganizations();
                await fetchRoles();

                if (!isCreateMode) {
                    // Fetch current permission data
                    const roleData = await UsersDataSource.fetchUserById(params.idOrCreate);
                    form.setFieldsValue({
                        name: roleData.name
                    });

                    const userRolesData = await UsersDataSource.fetchUserRoles(params.idOrCreate);
                    const userRoleIds = userRolesData._embedded.roles.map(r => r.id);
                    setSelectedRoleMap(userRoleIds.reduce((acc, permissionId) => ({
                        ...acc,
                        [Number(permissionId)]: true
                    }), {}));
                }
            } catch (err) {
                formUtils.showErrorNotification("Failed to load permission.")
            }

            setLoading(false);
        })();


    }, []);

    const fetchRoles = async () => {
        try {
            const data = await RolesDataSource.fetchRoles(0, 1000)
            setRoles(data._embedded?.roles || []);
        } catch (err) {
            console.error("Failed to fetch roles", err);
        }
    }

    const fetchOrganizations = async () => {
        try {
            const data = await OrganizationDataSource.fetchOrganizations(0, 100);
            setOrganizations(data._embedded?.organizations || []);
        } catch (err) {
            console.error("Failed to fetch organizations", err);
        }
    };


    const handleSubmit = async (e) => {
        setLoading(true);

        const formValues = form.getFieldsValue();

        if (passwordStrength < 3) {
            formUtils.showErrorNotification('Password strength is too weak.',
                <div>
                    Include at least:
                    <ul>
                        <li>one uppercase letter</li>
                        <li>one lowercase letter</li>
                        <li>one number</li>
                        <li>one special character</li>
                    </ul>.
                </div>);
            setLoading(false);
            return;
        }

        if (formValues.password !== formValues.confirmPassword) {
            formUtils.showErrorNotification("Password and confirm password do not match.");
            setLoading(false);
            return;
        }

        const roleNames = Object.keys(selectedRoleMap).filter(roleName => selectedRoleMap[roleName]);

        if (roleNames.length === 0) {
            formUtils.showErrorNotification("Please select at least one role.");
            setLoading(false);
            return;
        }


        const payload = {
            username: formValues.username,
            email: formValues.email ? formValues.email : '',
            password: formValues.password,
            organizationId: formValues.organizationId + '',
            roleNames: roleNames
        };


        if (isCreateMode) {
            try {
                await UsersDataSource.createUser(payload);
                // await RolesDataSource.updateRolePermissions(params.idOrCreate, payload);
                formUtils.showSuccessNotification("User created successfully!");
                navigate(-1);
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification(`Failed to create user.`, err.message) ;
            }
        } else {
            try {
                await UsersDataSource.updateUser(params.idOrCreate, payload);
                /* await RolesDataSource.updateRolePermissions(params.idOrCreate, Object.keys(selectedRoleMap).filter(permissionId => selectedRoleMap[permissionId])
                     .map(permissionId => Number(permissionId)));*/
                formUtils.showSuccessNotification("User updated successfully!");
                navigate(-1);
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification("Failed to user role.");
            }
        }


        setLoading(false);
    };

    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.password) {
            const passwordStrength = checkPasswordStrength(changedValues.password);
            setPasswordStrength(passwordStrength);
        }
    }

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
                        onValuesChange={handleValueChange}
                        autoComplete="off"
                        className="form-page"
                        layout="vertical">

                        <div className='form-page-header'>


                            <div className={'page-title-section'}>


                                <Typography.Title className='page-title' level={2}>
                                    {isCreateMode ? 'Create User' : 'Edit User'}
                                </Typography.Title>
                            </div>


                            <div className={'page-actions'}></div>
                        </div>


                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">Details</Typography.Title>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="username"
                                        label="Username"
                                        rules={[{
                                            required: true,
                                            message: 'Please enter username.'
                                        }, {
                                            min: 3,
                                            message: 'Role name must be at least 3 characters long.'
                                        }]}
                                    >
                                        <Input placeholder="Please enter user name"
                                               disabled={loading || !isCreateMode}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                    >
                                        <Input placeholder="Please enter user name"
                                               disabled={loading || !isCreateMode}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        rules={[{
                                            required: true,
                                            message: 'Please enter password.'
                                        }]}
                                    >
                                        <Input.Password placeholder="Please enter password"
                                                        disabled={loading || !isCreateMode}/>
                                    </Form.Item>

                                    <div>
                                        <Progress percent={(passwordStrength / 6) * 100} steps={5}
                                                  format={() => passwordStrength > 3 ? 'Strong' : passwordStrength > 2 ? 'Medium' : 'Weak'}
                                                  strokeColor={passwordStrength > 3 ? 'green' : passwordStrength > 2 ? 'yellow' : 'red'}/>
                                    </div>

                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        rules={[{
                                            required: true,
                                            message: 'Please enter Confirm Password.'
                                        }]}
                                    >
                                        <Input.Password placeholder="Please enter Confirm Password"
                                                        disabled={loading || !isCreateMode}/>
                                    </Form.Item>
                                </Col>
                            </Row>

                        </div>

                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">Organization and
                                roles</Typography.Title>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="organizationId"
                                        label="Organization"
                                        rules={[{
                                            required: true,
                                            message: 'Select organization.'
                                        }]}
                                    >
                                        <Select
                                            placeholder="Select Organization"
                                            size={'large'}
                                            style={{width: 200}}
                                            options={organizations.map(org => ({label: org.name, value: org.id}))}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Typography.Title level={5}>Assign roles</Typography.Title>

                            <Alert title="Please select at least one role" className={'roles-alert'} type="info" showIcon />

                            <Row gutter={24}>
                                {
                                    roles.map(role => (
                                        <Col span={6}>
                                            <Checkbox
                                                className={'permission-checkbox'}
                                                checked={selectedRoleMap[role.name] ?? false}
                                                onChange={(e) => {
                                                    setSelectedRoleMap({
                                                        ...selectedRoleMap,
                                                        [role.name]: e.target.checked
                                                    })
                                                }}
                                                key={role.name}>
                                                {role.name}
                                            </Checkbox>
                                        </Col>))
                                }
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
