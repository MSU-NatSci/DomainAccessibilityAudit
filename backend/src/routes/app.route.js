import express from 'express';

import controller from '../controllers/app.controller';

const router = express.Router();

router.post('/login', controller.login);
router.get('/login/saml', controller.login_saml);
router.post('/login/callback', controller.login_callback);
router.post('/logout', controller.logout);

module.exports = router;
