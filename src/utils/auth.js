const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

const signToken = (userId, username) => {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const getContextUser = async (req) => {
  const authHeader = req?.headers?.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded?.userId) return null;
  const user = await User.findById(decoded.userId).select('-password');
  return user;
};

module.exports = { signToken, verifyToken, getContextUser, JWT_SECRET };
