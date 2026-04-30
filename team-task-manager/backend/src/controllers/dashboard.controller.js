const prisma = require('../utils/prisma');

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const projectFilter = isAdmin
      ? {}
      : { project: { members: { some: { userId } } } };

    const now = new Date();

    const [total, todo, inProgress, done, overdue, recentTasks, myTasks, projectsCount] =
      await Promise.all([
        prisma.task.count({ where: projectFilter }),
        prisma.task.count({ where: { ...projectFilter, status: 'TODO' } }),
        prisma.task.count({ where: { ...projectFilter, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { ...projectFilter, status: 'DONE' } }),
        prisma.task.count({
          where: {
            ...projectFilter,
            status: { not: 'DONE' },
            dueDate: { lt: now },
          },
        }),
        prisma.task.findMany({
          where: projectFilter,
          orderBy: { updatedAt: 'desc' },
          take: 8,
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.task.findMany({
          where: {
            assigneeId: userId,
            status: { not: 'DONE' },
          },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          take: 8,
          include: {
            project: { select: { id: true, name: true } },
          },
        }),
        prisma.project.count({
          where: isAdmin ? {} : { members: { some: { userId } } },
        }),
      ]);

    res.json({
      stats: {
        totalTasks: total,
        todo,
        inProgress,
        done,
        overdue,
        projectsCount,
      },
      recentTasks,
      myTasks,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
