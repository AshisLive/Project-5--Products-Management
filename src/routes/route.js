const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController')
const usermid = require('../Middleware/userMiddleware')

router.post('/register',usermid.urlOfProfileImage ,  userController.createUser);
router.post('/login' ,  userController.loginUser);
router.get('/user/:userId/profile', usermid.authenticationToken , userController.getUserProfileById);
router.put('/user/:userId/profile', usermid.authenticationToken , usermid.urlOfProfileImageForUpdate ,  userController.updateUser);

module.exports = router;