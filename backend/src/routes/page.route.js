import express from 'express';

import controller from '../controllers/page.controller';

const router = express.Router();

router.get('/:pageId', controller.get_page);

module.exports = router;
