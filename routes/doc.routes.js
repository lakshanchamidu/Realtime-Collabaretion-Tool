const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/doc.controller');

router.post('/', auth, controller.createDoc);
router.get('/', auth, controller.listDocs);
router.get('/:id', auth, controller.getDoc);
router.put('/:id', auth, controller.updateDocMeta);
router.delete('/:id', auth, controller.deleteDoc);
router.post('/:id/share', auth, controller.shareDoc);

module.exports = router;