import {useEffect, useState} from "react";
import {Tag} from "antd";
import * as DataSource from "./RolesDataSource";

export default function RolePermissionsTags({roleId}) {

    const [permissions, setPermissions] = useState([]);

    useEffect(() => {

        (async () => {
            const data = await DataSource.fetchRolePermissions(roleId);
            const permissions = data._embedded.permissions;
            setPermissions(permissions);
        })();

    }, [roleId])

    return <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>

        {permissions.map(permission => <Tag key={roleId + '-' + permission.id}>{permission.name}</Tag>)}

    </div>

}