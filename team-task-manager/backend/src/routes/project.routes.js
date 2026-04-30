const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  requireAuth,
  loadProjectMembership,
  requireProjectAdmin,
} = require('../middleware/auth.middleware');
const ctrl = require('../controllers/project.controller');
const taskCtrl = require('../controllers/task.controller');

router.use(requireAuth);

router.get('/', ctrl.listProjects);

router.post(
  '/',
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Project name 2–120 chars'),
  body('description').optional({ nullable: true }).isString().isLength({ max: 2000 }),
  validate,
  ctrl.createProject
);

router.get('/:id', loadProjectMembership('id'), ctrl.getProject);

router.put(
  '/:id',
  loadProjectMembership('id'),
  requireProjectAdmin,
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 2000 }),
  validate,
  ctrl.updateProject
);

router.delete('/:id', loadProjectMembership('id'), ctrl.deleteProject);

// Members
router.post(
  '/:id/members',
  loadProjectMembership('id'),
  requireProjectAdmin,
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['ADMIN', 'MEMBER']),
  validate,
  ctrl.addMember
);

router.put(
  '/:id/members/:userId',
  loadProjectMembership('id'),
  requireProjectAdmin,
  body('role').isIn(['ADMIN', 'MEMBER']),
  validate,
  ctrl.updateMemberRole
);

router.delete(
  '/:id/members/:userId',
  loadProjectMembership('id'),
  requireProjectAdmin,
  ctrl.removeMember
);

// Tasks scoped to a project
router.get('/:id/tasks', loadProjectMembership('id'), taskCtrl.listProjectTasks);
router.post(
  '/:id/tasks',
  loadProjectMembership('id'),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  body('assigneeId').optional({ nullable: true }).isInt(),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  validate,
  taskCtrl.createTask
);

module.exports = router;
