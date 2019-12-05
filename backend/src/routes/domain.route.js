import express from 'express';

import controller from '../controllers/domain.controller';

const router = express.Router();

router.get('/:domainId', controller.get_domain);
//router.get('/:domainId/pages', controller.get_domain_pages);

module.exports = router;
