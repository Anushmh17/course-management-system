const db = require("../config/db");

const User = {

  // Find user by username
  async findByUsername(username) {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    return rows[0];
  },


  // Find user by ID
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT id, username, full_name, role
       FROM users
       WHERE id = ?`,
      [id]
    );

    return rows[0];
  },


  // Count users by role
  async countByRole(role) {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS count FROM users WHERE role = ?",
      [role]
    );

    return rows[0].count;
  },

};

module.exports = User;