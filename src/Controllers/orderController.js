const cartModel = require("../Models/cartModel")
const productModel = require("../Models/productModel")
const orderModel = require("../Models/orderModel")

const { isValid, validforEnum, isValidRequestBody, isValidObjectId, validString } = require('../Validator/validate')

const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        let { cartId, cancellable, status } = req.body
        let quantityCollection = [];
        const cartDetails = await cartModel.findOne({ _id: cartId });

        for (let product of cartDetails.items) {
            quantityCollection.push(product.quantity)
        }
        let totalQuantity = quantityCollection.reduce(function (a, b) {
            return a + b;
        }, 0)

        const orderDetails = {
            userId: userId,
            items: cartDetails.items,
            totalPrice: cartDetails.totalPrice,
            totalItems: cartDetails.totalItems,
            totalQuantity: totalQuantity,
            cancellable: cancellable,
            status: status
        }

        const order = await orderModel.create(orderDetails)
        return res.status(201).send({ status: true, msg: "successfully created cart", data: order })

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const updateOrder = async function (req, res) {
    try {

        const { cancellable, status, orderId } = req.body
        if (cancellable == false && status == "canciled") {
            return res.status(400).send({ status: false, msg: "You can not cancle Non-cancellable order" })
        }

        const updatedoRder = await orderModel.findOneAndUpdate({ _id: orderId }, { cancellable, status }, { new: true })
        return res.status(200).send({ status: true, msg: "successful update of order", data: updatedoRder })
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder