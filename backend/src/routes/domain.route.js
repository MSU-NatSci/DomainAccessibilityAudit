import express from 'express';

import domain_controller from '../controllers/domain.controller';

const router = express.Router();

router.get('/:domainId', domain_controller.get_domain);
//router.get('/:domainId/pages', domain_controller.get_domain_pages);

module.exports = router;
