const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController')
const productController = require('../Controllers/productController')
const usermid = require('../Middleware/userMiddleware')

router.post('/register',usermid.urlOfProfileImage ,  userController.createUser);
router.post('/login' ,  userController.loginUser);
router.get('/user/:userId/profile', usermid.authenticationToken , userController.getUserProfileById);
router.put('/user/:userId/profile', usermid.authenticationToken , usermid.urlOfProfileImageForUpdate ,  userController.updateUser);

router.post('/products', usermid.urlOfProfileImage , productController.createProduct);
router.get('/products', productController.getProduct);
router.get('/products/:productId', productController.getProductById);
router.put('/products/:productId', usermid.urlOfProfileImageForUpdate , productController.updateProduct);
router.delete('/products/:productId', productController.deleteProduct);

module.exports = router;