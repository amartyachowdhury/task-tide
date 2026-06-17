const { randomUUID } = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const userRepository = require('../db/userRepository');
const { authenticate, jwtSecret } = require('../middleware/authenticate');

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().max(320).required(),
  password: Joi.string().min(8).max(128).required(),
  organizationName: Joi.string().min(1).max(120).default('My workspace')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

function signToken(userId, organizationId) {
  return jwt.sign({ sub: userId, orgId: organizationId }, jwtSecret(), { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map((d) => d.message)
      });
    }

    const existing = userRepository.findUserByEmail(value.email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const userId = randomUUID();
    const orgId = randomUUID();
    const passwordHash = await bcrypt.hash(value.password, 10);

    userRepository.createOrganization({ id: orgId, name: value.organizationName });
    userRepository.createUser({ id: userId, email: value.email, passwordHash });
    userRepository.linkUserToOrg({ organizationId: orgId, userId, role: 'owner' });

    const org = userRepository.findOrganizationById(orgId);
    const token = signToken(userId, orgId);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: userId, email: value.email.toLowerCase().trim() },
        organization: org
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Registration failed', message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map((d) => d.message)
      });
    }

    const row = userRepository.findUserByEmail(value.email);
    if (!row) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(value.password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const orgId = userRepository.findPrimaryOrganizationIdForUser(row.id);
    if (!orgId) {
      return res.status(500).json({ success: false, error: 'Account has no organization' });
    }

    const org = userRepository.findOrganizationById(orgId);
    const token = signToken(row.id, orgId);

    return res.json({
      success: true,
      data: {
        token,
        user: { id: row.id, email: row.email },
        organization: org
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Login failed', message: e.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  try {
    const user = userRepository.findUserById(req.auth.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const org = userRepository.findOrganizationById(req.auth.organizationId);
    return res.json({
      success: true,
      data: { user, organization: org }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to load profile', message: e.message });
  }
});

module.exports = router;
