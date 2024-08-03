const router = require('express').Router();
const { signIn, signUp } = require('../controllers/userControllers');

router.route('/signup')
    .post(signUp);

router.route('/signin')
    .post(signIn);

module.exports = router;