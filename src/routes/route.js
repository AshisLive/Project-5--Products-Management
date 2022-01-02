const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController')
const productController = require('../Controllers/productController')
const cartController = require('../Controllers/cartController')
const orderController = require('../Controllers/orderController')
const usermid = require('../Middleware/userMiddleware')

//user api
router.post('/register',usermid.urlOfProfileImage ,  userController.createUser);
router.post('/login' ,  userController.loginUser);
router.get('/user/:userId/profile', usermid.authenticationToken , userController.getUserProfileById);
router.put('/user/:userId/profile', usermid.authenticationToken , usermid.urlOfProfileImageForUpdate ,  userController.updateUser);

//product api
router.post('/products', usermid.urlOfProfileImage , productController.createProduct);
router.get('/products', productController.getProduct);
router.get('/products/:productId', productController.getProductById);
router.put('/products/:productId', usermid.urlOfProfileImageForUpdate , productController.updateProduct);
router.delete('/products/:productId', productController.deleteProduct);

//cart api
router.post("/users/:userId/cart", usermid.authenticationToken ,cartController.createCart)
router.get('/users/:userId/cart', usermid.authenticationToken  , cartController.getCart)
router.put('/users/:userId/cart',usermid.authenticationToken ,cartController.updateCart)
router.delete('/users/:userId/cart',usermid.authenticationToken ,cartController.deleteCart)

//order api
router.post('/users/:userId/orders',usermid.authenticationToken , orderController.createOrder);
router.put('/users/:userId/orders',usermid.authenticationToken , orderController.updateOrder);
module.exports = router;