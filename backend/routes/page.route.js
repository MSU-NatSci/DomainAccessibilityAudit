const express = require('express');
const router = express.Router();

const page_controller = require('../controllers/page.controller');

router.get('/:pageId', page_controller.get_page);

module.exports = router;
