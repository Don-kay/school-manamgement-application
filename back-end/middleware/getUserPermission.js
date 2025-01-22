const { connection } = require("../config/connection");

async function getUserPermissions(staff_id) {
  const query = `
        WITH RECURSIVE RoleHierarchy AS (
            -- Start with user's current role
            SELECT role_id, parent_role_id
            FROM role_hierarchy
            WHERE role_id = (SELECT role_id FROM staff WHERE staff_id = ?)
            UNION ALL
            -- Traverse downwards from parent to child
            SELECT rh.role_id, rh.parent_role_id
            FROM role_hierarchy rh
            JOIN RoleHierarchy rh2 ON rh2.role_id = rh.parent_role_id
        )
        SELECT DISTINCT p.name
        FROM RoleHierarchy rh
        JOIN roles_permission rp ON rh.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id;
    `;
  try {
    const [permission] = await connection.query(query, [staff_id]);
    return permission;
  } catch (error) {
    return error.errno;
  }
}

module.exports = getUserPermissions;
