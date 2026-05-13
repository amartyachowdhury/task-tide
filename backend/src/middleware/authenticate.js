const jwt = require('jsonwebtoken');
const { DEFAULT_TENANT_ORG_ID, TEST_USER_ID } = require('../config/saas');

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s && String(s).trim()) return String(s).trim();
  if (process.env.NODE_ENV === 'test') return 'test-jwt-secret';
  throw new Error('JWT_SECRET is required when NODE_ENV is not test');
}

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const payload = jwt.verify(token, jwtSecret());
      const userId = payload.sub;
      const organizationId = payload.orgId;
      if (typeof userId !== 'string' || typeof organizationId !== 'string') {
        return res.status(401).json({ success: false, error: 'Invalid token payload' });
      }
      req.auth = { userId, organizationId };
      return next();
    }

    if (process.env.NODE_ENV === 'test') {
      req.auth = { userId: TEST_USER_ID, organizationId: DEFAULT_TENANT_ORG_ID };
      return next();
    }

    return res.status(401).json({ success: false, error: 'Authentication required' });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = { authenticate, jwtSecret };
