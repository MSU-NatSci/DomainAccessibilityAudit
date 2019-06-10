const express = require('express');
const router = express.Router();

const domain_controller = require('../controllers/domain.controller');

//router.get('/', domain_controller.get_domains);
router.get('/:domainId', domain_controller.get_domain);
//router.get('/:domainId/pages', domain_controller.get_domain_pages);

module.exports = router;
