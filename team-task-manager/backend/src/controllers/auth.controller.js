const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { sign } = require('../utils/jwt');

const sanitize = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    // First user becomes a global admin to bootstrap the system.
    const userCount = await prisma.user.count();
    const finalRole = userCount === 0 ? 'ADMIN' : role === 'ADMIN' ? 'MEMBER' : 'MEMBER';

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: finalRole },
    });

    const token = sign({ id: user.id, role: user.role });
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = sign({ id: user.id, role: user.role });
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, me };
