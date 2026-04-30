const prisma = require('../utils/prisma');

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
};

async function listProjectTasks(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.project.id },
      include: taskInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

async function ensureAssigneeIsMember(projectId, assigneeId) {
  if (!assigneeId) return true;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: Number(assigneeId) } },
  });
  return !!member;
}

async function createTask(req, res, next) {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    if (assigneeId && !(await ensureAssigneeIsMember(req.project.id, assigneeId))) {
      return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        assigneeId: assigneeId ? Number(assigneeId) : null,
        creatorId: req.user.id,
        projectId: req.project.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: taskInclude,
    });
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const id = Number(req.params.id);
    const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Authorize
    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
      });
      if (!membership) return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const id = Number(req.params.id);
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    let membership = null;
    if (req.user.role !== 'ADMIN') {
      membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
      });
      if (!membership) return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, description, status, priority, assigneeId, dueDate } = req.body;

    // Members can only update tasks they created or are assigned to (besides status changes)
    const isProjectAdmin =
      req.user.role === 'ADMIN' ||
      membership?.role === 'OWNER' ||
      membership?.role === 'ADMIN';

    const isOwnerOfTask = task.creatorId === req.user.id || task.assigneeId === req.user.id;
    if (!isProjectAdmin && !isOwnerOfTask) {
      return res
        .status(403)
        .json({ message: 'Only project admins or task assignees can edit this task' });
    }

    if (assigneeId && !(await ensureAssigneeIsMember(task.projectId, assigneeId))) {
      return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && {
          assigneeId: assigneeId ? Number(assigneeId) : null,
        }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
      include: taskInclude,
    });
    res.json({ task: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const id = Number(req.params.id);
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
      });
      const isProjectAdmin =
        membership?.role === 'OWNER' || membership?.role === 'ADMIN';
      if (!isProjectAdmin && task.creatorId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    await prisma.task.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjectTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
};
