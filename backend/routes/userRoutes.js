const express = require("express");

const router = express.Router();

const {
  getUserByUsername,
  getUserById,
} = require("../controllers/userController");


// Get user by username
router.get(
  "/username/:username",
  getUserByUsername
);


// Get user by ID
router.get(
  "/:id",
  getUserById
);


module.exports = router;
