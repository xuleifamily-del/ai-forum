import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aiforum-dev-secret';

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (
      typeof username !== 'string' ||
      username.length < 3 ||
      username.length > 20 ||
      typeof password !== 'string' ||
      password.length < 6 ||
      password.length > 64
    ) {
      return res.status(400).json({ error: 'validation failed' });
    }

    const existing = await userRepository.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser(username, passwordHash);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await userRepository.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
