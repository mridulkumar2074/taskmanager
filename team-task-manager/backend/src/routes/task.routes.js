const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/task.controller');

router.use(requireAuth);

router.get('/:id', ctrl.getTask);

router.put(
  '/:id',
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  body('assigneeId').optional({ nullable: true }).isInt(),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  validate,
  ctrl.updateTask
);

router.delete('/:id', ctrl.deleteTask);

module.exports = router;
