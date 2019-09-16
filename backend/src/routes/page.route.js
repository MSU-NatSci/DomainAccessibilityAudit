import express from 'express';

import page_controller from '../controllers/page.controller';

const router = express.Router();

router.get('/:pageId', page_controller.get_page);

module.exports = router;
