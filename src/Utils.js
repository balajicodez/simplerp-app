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
  },

    formatDateDDMMYYYY : (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";

    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  }



};

export default Utils;
