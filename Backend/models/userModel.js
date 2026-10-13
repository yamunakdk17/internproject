const db = require("../config/db");

const createUser = (name, email, password) => {
    return db.query(
        `INSERT INTO users (name, email, password)
         VALUES (?, ?, ?)`,
        [name, email, password]
    );
};

const findUserByEmail = (email) => {
    return db.query(
        `SELECT id, name, email, password, role
         FROM users
         WHERE email = ?`,
        [email]
    )
    .then(([rows]) => {
        return rows[0];
    });
};
const getAllUsers = () => {
  return db
    .query(
      `
        SELECT id,name,email,role
        FROM users
        ORDER BY id DESC`,
    )
    .then(([rows]) => rows);
};
const upadteUserRole =(userId,role) =>{
    return db.query(
        `UPDATE users
        SET role = ?
        WGERE id = ?`
        [role, userId]
    );
};

module.exports = {
  createUser,
  findUserByEmail,
  getAllUsers,
  upadteUserRole,
};