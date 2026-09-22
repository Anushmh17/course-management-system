// Role-Based Authorization Middleware
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {

    // Get role from req.user (set by authMiddleware)
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;