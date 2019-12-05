import express from 'express';

import controller from '../controllers/user.controller';

const router = express.Router();

router.get('/', controller.get_users);
router.get('/current', controller.get_current_user);
//router.post('/find', controller.find_user);
router.get('/:userId', controller.get_user);
router.post('/', controller.new_user);
router.delete('/:userId', controller.remove_user);
router.post('/:userId', controller.update_user);
router.put('/:userId/groups/:groupId', controller.add_group);
router.delete('/:userId/groups/:groupId', controller.remove_group);

module.exports = router;
