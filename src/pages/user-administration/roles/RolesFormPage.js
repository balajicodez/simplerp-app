import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Checkbox, Col, Form, Input, Row, Spin, Typography} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import * as RolesDataSource from "./RolesDataSource";
import FormUtils from "../../../_utils/FormUtils";
import * as PermissionsDataSource from "../permissions/PermissionsDataSource";

export default function RolesFormPage() {
    const params = useParams();
    const isCreateMode = params.idOrCreate === 'create';

    const navigate = useNavigate();

    const [form] = Form.useForm();
    const [permissions, setPermissions] = useState([]);
    const [selectedPermissionMap, setSelectedPermissionMap] = useState({});
    const [loading, setLoading] = useState(false);

    const formUtils = new FormUtils(AntApp.useApp());


    useEffect(() => {
        setLoading(true);


        (async () => {
            try {
                const data = await PermissionsDataSource.fetchPermissions(0, 1000)
                setPermissions(data._embedded?.permissions || []);

                if (!isCreateMode) {
                    // Fetch current permission data
                    const roleData = await RolesDataSource.fetchRoleById(params.idOrCreate);
                    form.setFieldsValue({
                        name: roleData.name
                    });

                    const rolePermissionsData = await RolesDataSource.fetchRolePermissions(params.idOrCreate);
                    const rolePermissionIds = rolePermissionsData._embedded.permissions.map(permission => permission.id);
                    setSelectedPermissionMap(rolePermissionIds.reduce((acc, permissionId) => ({...acc, [Number(permissionId)]: true}), {}));
                }
            } catch (err) {
                formUtils.showErrorNotification("Failed to load permission.")
            }

            setLoading(false);
        })();


    }, []);

    const validateRoleName = (roleName) => {
        if (roleName.length < 6) {
            return "Role name must be at least 6 characters";
        }
        return null;
    };


    const handleSubmit = async (e) => {
        setLoading(true);

        const formValues = form.getFieldsValue();

        const validationResult = validateRoleName(formValues.name)
        if (isCreateMode && validationResult) {
            formUtils.showErrorNotification(validationResult);
            setLoading(false);
            return;
        }

        console.log(Object.keys(selectedPermissionMap).filter(permissionId => selectedPermissionMap[permissionId] ?? false))

        const payload = {
            name: formValues.name,
            permissionIds: Object.keys(selectedPermissionMap).filter(permissionId => selectedPermissionMap[permissionId])
                .map(permissionId => Number(permissionId))
        };



        if (isCreateMode) {
            payload.id = null;
            try {
                await RolesDataSource.createRole(payload);
              // await RolesDataSource.updateRolePermissions(params.idOrCreate, payload);
                formUtils.showSuccessNotification("Role created successfully!");
                navigate(-1);
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification("Failed to create role.");
            }
        } else {
            try {
                await RolesDataSource.updateRole(params.idOrCreate, payload);
                await RolesDataSource.updateRolePermissions(params.idOrCreate, Object.keys(selectedPermissionMap).filter(permissionId => selectedPermissionMap[permissionId])
                    .map(permissionId => Number(permissionId)));
                formUtils.showSuccessNotification("Role updated successfully!");
                navigate(-1);
            } catch (err) {
                console.error(err);
                formUtils.showErrorNotification("Failed to update role.");
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
                                    {isCreateMode ? 'Create Role' : 'Edit Role'}
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
                                        label="Role Name"
                                        rules={[{
                                            required: true,
                                            message: 'Please enter permission name.'
                                        }, {
                                            pattern: /^[a-zA-Z0-9_\- ]+$/,
                                            message: 'Only alphanumeric characters, spaces and hyphens are allowed.'
                                        }, {
                                            min: 3,
                                            message: 'Role name must be at least 3 characters long.'
                                        }]}
                                    >
                                        <Input placeholder="Please enter role name"
                                               disabled={loading || !isCreateMode}/>
                                    </Form.Item>
                                </Col>
                            </Row>

                        </div>

                        <div className="form-page-fields-section">


                            <Typography.Title level={4} className="form-section-title">Assign
                                permissions</Typography.Title>

                            <Row gutter={24}>

                                {
                                    permissions.map(permission => (
                                        <Col span={6}>
                                            <Checkbox
                                                className={'permission-checkbox'}
                                                checked={selectedPermissionMap[permission.id] ?? false}
                                                onChange={(e) => {
                                                    setSelectedPermissionMap({...selectedPermissionMap, [Number(permission.id)]: e.target.checked})
                                                }}
                                                key={permission.id}>
                                                {permission.name}
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
