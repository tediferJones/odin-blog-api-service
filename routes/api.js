const { Router } = require('express');
const apiController = require('../controllers/apiController');

const router = Router();

router.get('/posts', apiController.allPosts_GET);
router.post('/posts', apiController.post_POST);
router.get('/posts/:id', apiController.post_GET);
router.put('/posts/:id', apiController.post_PUT);
router.delete('/posts/:id', apiController.post_DELETE);

router.post('/posts/:id/comments', apiController.comment_POST);
router.delete('/posts/:id/comments/:commentid', apiController.comment_DELETE);

module.exports = router;
