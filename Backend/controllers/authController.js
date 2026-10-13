// authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const response = require("../utils/response");

// REGISTER
const registerUser = (req, res) => {
  const { name, email, password } = req.body;

  // 400 - Bad Request
  if (!name || !email || !password) {
    return response.error(res, "Invalid data", 400);
  }

  userModel
    .findUserByEmail(email)
    .then((existingUser) => {
      // 409 - Conflict
      if (existingUser) {
        return response.error(res, "Email already registered", 409);
      }

      return bcrypt.hash(password, 10);
    })
    .then((hashedPassword) => {
      // Response was already sent
      if (!hashedPassword) {
        return;
      }

      return userModel.createUser(name, email, hashedPassword);
    })
    .then((result) => {
      // Response was already sent
      if (!result) {
        return;
      }

      return response.created(res, "User registered successfully", {
        userId: result.insertId,
      });
    })
    .catch((error) => {
      console.error("Register error:", error);

      return response.error(
        res,
        error.message || "Something went wrong",
        error.statusCode || 500,
      );
    });
};

// LOGIN
const loginUser = (req, res) => {
  const { email, password } = req.body;

  // 400 - Bad Request
  if (!email || !password) {
    return response.error(res, "Invalid data", 400);
  }

  userModel
    .findUserByEmail(email)
    .then((user) => {
      // 401 - Unauthorized
      if (!user) {
        return response.error(res, "Unauthorized", 401);
      }

      return bcrypt.compare(password, user.password).then((isPasswordValid) => {
        // 401 - Unauthorized
        if (!isPasswordValid) {
          return response.error(res, "Incorrect password.Please try again.", 401);
        }

        const token = jwt.sign(
          {
            id: user.id,
            role: user.role,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1d",
          },
        );

     
return response.success(res, "Login successful", {
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
});
      });
    })
    .catch((error) => {
      console.error("Login error:", error);

      return response.error(
        res,
        error.message || "Login failed",
        error.statusCode || 500,
      );
    });
};

module.exports = {
  registerUser,
  loginUser,
};
