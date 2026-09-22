const User = require("../models/userModel");

// Get user by username
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "User found",
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error("Error finding user:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User found",
      user,
    });

  } catch (error) {
    console.error("Error finding user:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  getUserByUsername,
  getUserById,
};
