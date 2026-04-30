const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireGlobalAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/user.controller');

router.use(requireAuth);

router.get('/', ctrl.listUsers);

router.put(
  '/:id/role',
  requireGlobalAdmin,
  body('role').isIn(['ADMIN', 'MEMBER']),
  validate,
  ctrl.updateUserRole
);

router.delete('/:id', requireGlobalAdmin, ctrl.deleteUser);

module.exports = router;
