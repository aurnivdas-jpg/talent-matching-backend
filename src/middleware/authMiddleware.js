const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Token is required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = String(req.user.role).trim().toLowerCase();
    const allowedRoles = roles.map(role => String(role).trim().toLowerCase());
    
    if (!req.user || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied for this user role.' });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
