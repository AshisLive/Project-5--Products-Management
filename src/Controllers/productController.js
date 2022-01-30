const productModel = require("../Models/productModel")
const { isValid, validforEnum, isValidRequestBody, isValidObjectId, validString } = require('../Validator/validate')

const createProduct = async function (req, res) {
    try {
        const requestBody = req.body;
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = requestBody
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide product details' })
            return
        }
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: 'title is required' })
            return
        }

        const isTitleAlreadyUsed = await productModel.findOne({ title: title });
        if (isTitleAlreadyUsed) {
            res.status(400).send({ status: false, message: `${title} title is already registered`});
            return;
        }
        if (!isValid(description)) {
            res.status(400).send({ status: false, message: `description is required` })
            return
        }
        if (!price) {
            res.status(400).send({ status: false, message: `price is required` })
            return
        }
        curRegExp = /^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/;
        if (!curRegExp.test(price)) {
            return res.status(400).send({ status: false, message: "provide valid price" })
        }

        if (!isValid(currencyId)) {
            res.status(400).send({ status: false, message: 'currencyId is required' })
            return
        }

        if (currencyId !== 'INR') {
            res.status(400).send({ status: false, message: 'provide valid currencyId' })
            return

        }
        if (!isValid(currencyFormat)) {
            res.status(400).send({ status: false, message: 'currencyFormat is required' })
            return
        }
        if (currencyFormat !== '₹') {
            res.status(400).send({ status: false, message: 'provide valid currencyFormat' })
            return
        }

        if (isFreeShipping) {
            if (isFreeShipping !== 'false' || isFreeShipping !== 'true') {
                res.status(400).send({ status: false, message: 'provide valid isFreeShipping' })
                return
            }
        }

        if (style) {
            if (!isValid(style)) {
                res.status(400).send({ status: false, message: 'provide valid style' })
                return
            }
        }

        if (isValid(availableSizes)) {
            if (!validforEnum(availableSizes)) {
                res.status(400).send({ status: false, message: 'plz provide one availableSize : ["S", "XS","M","X", "L","XXL", "XL"]' })
                return
            }
            requestBody.availableSizes = availableSizes.split(",")
        }

        const reg = /^-?\d*\.?\d*$/
        if (!reg.test(installments)) {
            res.status(400).send({ status: false, message: 'plz provide correct installments' })
            return
        }

        requestBody.productImage = req.urlimage
        const productData = await productModel.create(requestBody)
        res.status(201).send({ status: true, msg: "successfully created", data: productData })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const getProduct = async function (req, res) {
    try {
        if (!isValidRequestBody(req.query)) {
            return res.status(400).send({ status: false, message: 'Please provide product details' })
        }

        let { size, price, priceSort } = req.query

        let query = {};
        if (isValid(size)) {
            if (!validforEnum(size)) {
                return res.status(400).send({ status: false, message: ' Please provide size' })
            } else {
                query['availableSizes'] = size
            }
        }

        if (price) {
            price = JSON.parse(price)
            if (Object.keys(price).length == 1) {
                if (price.priceGreaterThan) {
                    if (typeof price.priceGreaterThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' Please provide priceGreaterThan' })
                    }
                    query['price'] = { $gt: price.priceGreaterThan }
                }
                if (price.priceLessThan) {
                    if (typeof price.priceLessThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' Please provide priceGreaterThan' })
                    }
                    query['price'] = { $lt: price.priceLessThan }
                }
            }
            if (Object.keys(price).length == 2) {
                if (price.priceGreaterThan && price.priceLessThan) {
                    if (typeof price.priceGreaterThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' Please provide priceGreaterThan' })
                    }
                    if (typeof price.priceLessThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' Please provide priceGreaterThan' })
                    }
                    query['price'] = { '$gt': price.priceGreaterThan, '$lt': price.priceLessThan }
                }
            }
        }

        if (priceSort) {
            if (priceSort == -1 || priceSort == 1) {
                query['priceSort'] = priceSort
            } else {
                return res.status(400).send({ status: false, message: ' Please provide priceSort' })
            }
        }

        if (isValid(req.query.name)) {
            query['title'] = { $regex: req.query.name.trim() }
        }

        let products = await productModel.find(query)
        if (Array.isArray(products) && products.length === 0) {
            return res.status(404).send({ status: false, message: 'No products found' })
        }

        query['isDeleted'] = false;
        let productsOfQuery = await productModel.find(query).sort({ price: query.priceSort })
        return res.status(200).send({ status: true, message: 'Product list', data: productsOfQuery })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!(isValid(productId) && isValidObjectId(productId))) {
            return res.status(400).send({ status: false, message: "productId is not valid" })
        }
        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            res.status(404).send({ status: false, message: `product not found` })
            return
        }
        return res.status(200).send({ status: true, message: "Product Details", data: product })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


const updateProduct = async function (req, res) {
    try {
        let requestBody = req.body
        const productId = req.params.productId

        //atleast one value for update
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide  details to update' })
            return
        }

        if (!isValidObjectId(productId)) {
            return res.status(404).send({ status: false, message: "productId is not valid" })
        }

        //finding product exist or not
        const product = await productModel.findOne({ _id: productId, isDeleted: false, })

        if (!product) {
            res.status(404).send({ status: false, message: `product not found` })
            return
        }
        //filter
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = requestBody

        const productImage = req.urlimage

        const filterQuery = {};
        if (isValid(title)) {
            const isTitleAlreadyUsed = await productModel.findOne({ title: title });
            if (isTitleAlreadyUsed) {
                res.status(400).send({ status: false, message: `${title} title is already registered`, });
                return;
            }
            filterQuery['title'] = title
        }

        if (isValid(description)) {
            filterQuery['description'] = description
        }

        if (price) {
            curRegExp = /^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/;
            if (curRegExp.test(price)) {
                filterQuery['price'] = price
            } else {
                return res.status(400).send({ status: false, message: "provide valid price" })
            }
        }

        if (isValid(currencyId)) {
            if (currencyId !== 'INR') {
                res.status(400).send({ status: false, message: 'provide valid currencyId' })
                return
            } filterQuery['currencyId'] = currencyId
        }

        if (isValid(currencyFormat)) {
            if (currencyFormat !== '₹') {
                res.status(400).send({ status: false, message: 'provide valid currencyFormat' })
                return
            } filterQuery['currencyFormat'] = currencyFormat
        }

        if (isValid(style)) {
            filterQuery['style'] = style
        }

        if (isFreeShipping) {
            if (isFreeShipping == 'false' || isFreeShipping == 'true') {
                filterQuery['isFreeShipping'] = isFreeShipping
            } else {
                res.status(400).send({ status: false, message: 'provide valid isFreeShipping' })
                return
            }
        }

        if (availableSizes) {
            if (!validforEnum(availableSizes)) {
                return res.status(400).send({ status: false, message: 'plz provide one availableSize : ["S", "XS","M","X", "L","XXL", "XL"]' })
            }
            filterQuery['availableSizes'] = availableSizes.split(",")
        }

        if (installments) {
            const reg = /^-?\d*\.?\d*$/
            if (!reg.test(installments)) {
                res.status(400).send({ status: false, message: 'plz provide correct installments' })
                return
            } filterQuery['installments'] = installments
        }

        filterQuery.productImage = productImage;
        //updating details
        const updatedProductDetails = await productModel.findOneAndUpdate({ productId }, filterQuery, { new: true })
        return res.status(200).send({ status: true, message: "successfully updated product Details", data: updatedProductDetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


const deleteProduct = async function (req, res) {
    try {
        const productId = req.params.productId
        if (!(isValid(productId) && isValidObjectId(productId))) {
            return res.status(404).send({ status: false, message: "productId is not valid" })
        }
        const deletedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true })
        if (deletedProduct) {
            res.status(200).send({ status: true, msg: "This product has been succesfully deleted" })
            return
        }
        res.status(404).send({ status: false, message: `product alredy deleted not found` })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports.getProduct = getProduct
module.exports.createProduct = createProduct
module.exports.getProductById = getProductById
module.exports.updateProduct = updateProduct
module.exports.deleteProduct = deleteProduct