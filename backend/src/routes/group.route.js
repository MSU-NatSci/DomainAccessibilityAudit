import express from 'express';

import controller from '../controllers/group.controller';

const router = express.Router();

router.get('/', controller.get_groups);
router.get('/:groupId', controller.get_group);
router.post('/', controller.new_group);
router.delete('/:groupId', controller.remove_group);
router.put('/:groupId', controller.update_group);
router.put('/:groupId/users/:userId', controller.add_user);
router.delete('/:groupId/users/:userId', controller.remove_user);

module.exports = router;
