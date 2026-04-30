const prisma = require('../utils/prisma');

const projectInclude = {
  owner: { select: { id: true, name: true, email: true } },
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  _count: { select: { tasks: true, members: true } },
};

async function listProjects(req, res, next) {
  try {
    const where =
      req.user.role === 'ADMIN'
        ? {}
        : { members: { some: { userId: req.user.id } } };

    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.project.id },
      include: projectInclude,
    });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'OWNER' },
        },
      },
      include: projectInclude,
    });
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.project.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      include: projectInclude,
    });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    // Only owner or global admin can delete
    if (req.user.role !== 'ADMIN' && req.membership?.role !== 'OWNER') {
      return res.status(403).json({ message: 'Only the project owner can delete it' });
    }
    await prisma.project.delete({ where: { id: req.project.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const { email, role } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User with that email not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.project.id, userId: user.id } },
    });
    if (existing) return res.status(409).json({ message: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.project.id,
        userId: user.id,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
}

async function updateMemberRole(req, res, next) {
  try {
    const { role } = req.body;
    const userId = Number(req.params.userId);
    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.project.id, userId } },
    });
    if (!target) return res.status(404).json({ message: 'Member not found' });
    if (target.role === 'OWNER') {
      return res.status(400).json({ message: 'Cannot change the owner role' });
    }
    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: req.project.id, userId } },
      data: { role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ member });
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.project.id, userId } },
    });
    if (!target) return res.status(404).json({ message: 'Member not found' });
    if (target.role === 'OWNER') {
      return res.status(400).json({ message: 'Cannot remove the owner' });
    }
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.project.id, userId } },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
};
