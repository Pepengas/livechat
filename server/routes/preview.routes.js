const express = require('express');
const router = express.Router();
const { getLinkPreview } = require('../controllers/preview.controller');

router.get('/', getLinkPreview);

module.exports = router;

