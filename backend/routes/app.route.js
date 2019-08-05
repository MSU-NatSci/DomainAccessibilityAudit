const express = require('express');
const router = express.Router();

const app_controller = require('../controllers/app.controller');

router.post('/login', app_controller.login);
router.post('/logout', app_controller.logout);
router.get('/admin', app_controller.admin);

module.exports = router;
