const cartModel = require("../Models/cartModel")
const productModel = require("../Models/productModel")
const { isValid, validforEnum, isValidRequestBody, isValidObjectId, validString } = require('../Validator/validate')

const createCart = async function (req, res) {
    try {
        const userId = req.params.userId
        let { items, cartId } = req.body
        let increaseQuantity, index
        let isCartAlreadyCreated = await cartModel.findOne({ userId: userId });
        const productPrice = await productModel.findOne({ _id: items[0].productId })
        let price = productPrice.price * items[0].quantity

        //1 cond=> if already created but want to added more quantity of existing one
        if (isCartAlreadyCreated) {
            for (let i = 0; i < isCartAlreadyCreated.items.length; i++) {
                if (items[0].productId == isCartAlreadyCreated.items[i].productId) {
                    increaseQuantity = isCartAlreadyCreated.items[i].quantity
                    index = i
                }
            }
        }
        if (increaseQuantity) {
            increaseQuantity = increaseQuantity + items[0].quantity
            let increasePrice = price + isCartAlreadyCreated.totalPrice

            isCartAlreadyCreated.items[index].quantity = increaseQuantity
            const detail = await cartModel.findOneAndUpdate({ userId: isCartAlreadyCreated.userId }, { items: isCartAlreadyCreated.items, totalPrice: increasePrice }, { new: true })
            return res.status(200).send({ status: true, msg: "successfully updated", data: detail })
        }

        //2 cond=> if already created and new product to be added
        if (isCartAlreadyCreated) {
            let newTotalPrice = isCartAlreadyCreated.totalPrice + price
            let newTotalItems = isCartAlreadyCreated.totalItems + 1
            const alreadyCreatedCart = await cartModel.findOneAndUpdate({ userId: isCartAlreadyCreated.userId }, { $addToSet: { items: { $each: items } }, totalPrice: newTotalPrice, totalItems: newTotalItems }, { new: true })
            return res.status(200).send({ status: true, msg: "successfully updated", data: alreadyCreatedCart })
        } else { //=3 cond=> newly created cart
            const cart = await cartModel.create({ userId: userId, items: items, totalPrice: price, totalItems: 1 })
           return res.status(201).send({ status: true, msg: "successfully created cart", data: cart })
        }

       
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports.createCart = createCart