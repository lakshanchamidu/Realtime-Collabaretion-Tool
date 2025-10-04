const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/docs', require('./doc.routes'));

module.exports = router;