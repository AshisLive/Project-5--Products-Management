const cartModel = require("../Models/cartModel")
const productModel = require("../Models/productModel")
const { isValid, validforEnum, isValidRequestBody, isValidObjectId, validString } = require('../Validator/validate')

const createCart = async function (req, res) {
    try {
        const userId = req.params.userId
        let { items } = req.body
        let productCollection = [];
        const isCartAlreadyCreated = await cartModel.findOne({ userId: userId });

        // for (let product of items) {
        //     productCollection.push(product.productId)
        // }

        // const productPrices = await productModel.find({ _id: { $in: productCollection } }).select({ _id: 1, price: 1 })

        // const price = [];
        // for (let i = 0; i < productPrices.length; i++) {
        //     for (var j = 0; j < items.length; j++) {
        //         if (productPrices[i]._id == items[j].productId) { 
        //             price.push(productPrices[i].price * items[j].quantity);
        //         }
        //     }
        // }

        
       
        let totalPrice = price.reduce(function (a, b) {
            return a + b;
        }, 0)

        if (isCartAlreadyCreated) {
            const checkingDetails = await cartModel.findOneAndUpdate({ userId: isCartAlreadyCreated.userId }, { $addToSet: { items: { $each: items } } }, { new: true })
            let newTotalPrice = checkingDetails.totalPrice + totalPrice
            let newTotalItems = checkingDetails.totalItems + price.length
            const alreadyCreatedCart = await cartModel.findOneAndUpdate({ userId: isCartAlreadyCreated.userId }, { totalPrice: newTotalPrice, totalItems: newTotalItems }, { new: true })
            return res.status(200).send({ status: true, msg: "successfully updated", data: alreadyCreatedCart })
        } else {
            const cart = await cartModel.create({ userId: userId, items: items, totalPrice: totalPrice, totalItems: price.length })
            res.status(201).send({ status: true, msg: "successfully created cart", data: cart })
        }

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports.createCart = createCart