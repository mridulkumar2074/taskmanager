const { verify } = require('../utils/jwt');
const prisma = require('../utils/prisma');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const payload = verify(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireGlobalAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  next();
}

/**
 * Loads the requesting user's membership for the project at req.params.projectId
 * (or req.body.projectId / req.params.id if explicitly looking at a project route).
 * Sets req.project and req.membership.
 */
function loadProjectMembership(paramName = 'projectId') {
  return async (req, res, next) => {
    try {
      const projectId = Number(req.params[paramName] || req.params.id || req.body.projectId);
      if (!projectId) return res.status(400).json({ message: 'Project id required' });

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } },
      });

      // Global admin gets implicit access for visibility
      if (!membership && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }

      req.project = project;
      req.membership = membership; // may be null for global admin
      next();
    } catch (err) {
      next(err);
    }
  };
}

function requireProjectAdmin(req, res, next) {
  if (req.user.role === 'ADMIN') return next(); // global admin override
  const role = req.membership?.role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return res.status(403).json({ message: 'Project admin privileges required' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireGlobalAdmin,
  loadProjectMembership,
  requireProjectAdmin,
};
