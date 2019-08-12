import express from 'express';

import app_controller from '../controllers/app.controller';

const router = express.Router();

router.post('/login', app_controller.login);
router.post('/logout', app_controller.logout);
router.get('/admin', app_controller.admin);

module.exports = router;
