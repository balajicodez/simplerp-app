import {useEffect, useState} from "react";
import {Tag} from "antd";
import * as DataSource from "./UsersDataSource";

export default function UserRolesTags({userId}) {

    const [roles, setRoles] = useState([]);

    useEffect(() => {

        (async () => {
            const data = await DataSource.fetchUserRoles(userId);
            const roles = data._embedded.roles;
            setRoles(roles);
        })();

    }, [])

    return <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>

        {roles.map(role => <Tag key={userId + '-' + role.id}>{role.name}</Tag>)}

    </div>

}