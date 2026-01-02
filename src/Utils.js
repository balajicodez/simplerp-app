// Utils.js
const Utils = {

    accessAllowed: (page) => {
        const roles = localStorage.getItem('decodedPayload.roles');
        const rolesCsv = localStorage.getItem('decodedPayload.roles');

        const rolesArray = rolesCsv
            ? rolesCsv.split(',').map(role => role.trim())
            : [];

        return rolesArray.includes(page);
    },

    // Example function definition
    isRoleApplicable: (role) => {
        const roles = localStorage.getItem('roles');
        const rolesCsv = localStorage.getItem('roles');

        const rolesArray = rolesCsv
            ? rolesCsv.split(',').map(role => role.trim())
            : [];
        return rolesArray.includes(role);
    }
};

export default Utils;
