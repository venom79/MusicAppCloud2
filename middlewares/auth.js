import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export const isAuthenticated = (req, res, next) => {
  try {
    const token = req.cookies.token; 

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // attach user info to request
    req.user = decoded; // contains { id, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }

  next();
};

export const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    next(); // just skip user if invalid token
  }
};
