const prisma = require('../utils/prisma');

async function listUsers(req, res, next) {
  try {
    const search = (req.query.q || '').trim();
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {},
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent demoting the last admin
    if (role === 'MEMBER') {
      const target = await prisma.user.findUnique({ where: { id } });
      if (target?.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return res
            .status(400)
            .json({ message: 'Cannot demote the last admin' });
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (id === req.user.id) {
      return res.status(400).json({ message: "You can't delete your own account" });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin' });
      }
    }

    // Explicit, ordered cleanup — SQLite cascades aren't reliable for multi-hop FK
    // chains within one transaction (e.g. user → owned project → task whose creator
    // is also the user). So we tear it down step by step.
    await prisma.$transaction(async (tx) => {
      // 1. Delete every project this user owns. Cascades remove their tasks + members.
      await tx.project.deleteMany({ where: { ownerId: id } });

      // 2. Unassign this user from any remaining tasks (in other people's projects).
      await tx.task.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      });

      // 3. Reassign authorship of any tasks they created elsewhere to the deleting admin.
      await tx.task.updateMany({
        where: { creatorId: id },
        data: { creatorId: req.user.id },
      });

      // 4. Drop any project memberships they still hold.
      await tx.projectMember.deleteMany({ where: { userId: id } });

      // 5. Finally remove the user.
      await tx.user.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUserRole, deleteUser };
