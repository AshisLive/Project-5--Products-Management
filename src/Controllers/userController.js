const encrypt = require("../Encryption/Encrypt")
const userModel = require("../Models/userModel")
const { isValid, isValidRequestBody, isValidObjectId, validatePhone, validateEmail, validString } = require('../Validator/validate')
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const createUser = async function (req, res) {
    try {
        const requestBody = req.body;
        let { fname, lname, phone, email, password, address } = requestBody
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide author details' })
            return
        }

        if (!isValid(fname)) {
            res.status(400).send({ status: false, message: 'fname is required' })
            return
        }

        if (!isValid(lname)) {
            res.status(400).send({ status: false, message: `lname is required` })
            return
        }

        if (!isValid(phone)) {
            res.status(400).send({ status: false, message: `phone no. is required` })
            return
        }

        if (!validatePhone(phone)) {
            res.status(400).send({ status: false, message: `phone should be a valid number` });
            return;
        }
        const isPhoneNumberAlreadyUsed = await userModel.findOne({ phone: phone });
        if (isPhoneNumberAlreadyUsed) {
            res.status(400).send({ status: false, message: `${phone} mobile number is already registered`, });
            return;
        }
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!validateEmail(email)) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        const isEmailAlreadyUsed = await userModel.findOne({ email }); // {email: email} object shorthand property 
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, message: `${email} email address is already registered` })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: `${password} invalid passwoed` })
            return
        }
        if (!(password.trim().length > 7 && password.trim().length < 16)) {
            res.status(400).send({ status: false, message: `${password} invalid password it should be between 8 to 15` })
            return
        }

        const hashPassword = await encrypt.hashPassword(password)
        requestBody.password = hashPassword;

        if (!address) {
            res.status(400).send({ status: false, message: `address is required` })
            return
        }

        requestBody.address = JSON.parse(address)

        if (!requestBody.address.shipping) {
            res.status(400).send({ status: false, message: `shipping address is required` })
            return
        }

        if (!requestBody.address.billing) {
            res.status(400).send({ status: false, message: `billing address is required` })
            return
        }

        if (!validString(requestBody.address.shipping.street)) return res.status(400).send({ status: false, message: `street of shipping address is required` })

        if (!validString(requestBody.address.shipping.city)) return res.status(400).send({ status: false, message: `city of shipping address is required` })

        if (!(typeof requestBody.address.shipping.pincode === 'number')) return res.status(400).send({ status: false, message: `pincode of shipping address is required` })

        if (!validString(requestBody.address.billing.street)) return res.status(400).send({ status: false, message: `street of billing address is required` })

        if (!validString(requestBody.address.billing.city)) return res.status(400).send({ status: false, message: `city of billing address is required` })

        if (!(typeof requestBody.address.billing.pincode === 'number')) return res.status(400).send({ status: false, message: `pincode of billing address is required` })

        requestBody['profileImage'] = req.urlimage
        const userData = await userModel.create(requestBody)
        return res.status(201).send({ status: true, msg: "successfully created", data: userData })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


//----------------------------------------------------------------------
const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
            return
        }
        const { email, password } = requestBody;
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!validateEmail(email)) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return
        }
        const passOfUser = user.password
        const isValidPass = bcrypt.compareSync(password, passOfUser);
        if (!isValidPass) {
            res.status(401).send({ status: false, message: `Invalid login credentials of password` });
            return
        }

        let userId = user._id
        let payload = {
            userId: user._id,
            iat: Math.floor(Date.now() / 1000), //[seconds]	The iat (issued at) identifies the time at which the JWT was issued. [Date.now() / 1000 => means it will give time that is in seconds(for January 1, 1970)] (abhi ka time de gha jab bhi yhe hit hugha)
            exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60 //The exp (expiration time) identifies the expiration time on or after which the token MUST NOT be accepted for processing.   (abhi ke time se 10 ganta tak jalee gha ) Date.now() / 1000=> seconds + 60x60min i.e 1hr and x10 gives 10hrs.
        };

        let token = jwt.sign(payload, "user123");

        res.header('Authorization', token);
        res.status(200).send({ status: true, message: `User logged in successfully`, data: { userId, token } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

//-------------------------------------------------------------------------------
const getUserProfileById = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }

        res.status(200).send({ status: true, message: "User profile Details", data: user })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


//----------------------------------------------------------------------------------------------
const updateUser = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }

        let { fname, lname, email, phone, password, address } = req.body
        const profileImage = req.urlimage

        const filterQuery = {};
        if (isValid(fname)) {
            filterQuery['fname'] = fname.trim()
        }
        if (isValid(lname)) {
            filterQuery['lname'] = lname.trim()
        }
        if (isValid(email)) {
            const checkEmail = await userModel.find({ email: email })
            if (!(checkEmail.length == 0)) {
                return res.status(400).send({ status: false, message: `${email} is not unique` })
            }
            filterQuery['email'] = email.trim()
        }
        if (isValid(phone)) {
            const checkphone = await userModel.find({ phone: phone })
            if (!(checkphone.length == 0)) {
                return res.status(400).send({ status: false, message: `${phone} is not unique` })
            }
            filterQuery['phone'] = phone.trim()
        }
        if (isValid(password)) {
            if (password.trim().length > 7 && password.trim().length < 16) {
                const hashPassword = await encrypt.hashPassword(password.trim())
                filterQuery['password'] = hashPassword;
            } else {
                res.status(400).send({ status: false, message: `${password} invalid password it should be between 8 to 15` })
                return
            }
        }

        if (address) {
            address = JSON.parse(address)
            if (address.shipping) {
                if (address.shipping.street) {
                    if (!validString(address.shipping.street)) {
                        return res.status(400).send({ status: false, message: ' Please provide street' })
                    }
                    filterQuery['address.shipping.street'] = address.shipping.street
                }
                if (address.shipping.city) {
                    if (!validString(address.shipping.city)) {
                        return res.status(400).send({ status: false, message: ' Please provide city' })
                    }
                    filterQuery['address.shipping.city'] = address.shipping.city
                }
                if (address.shipping.pincode) {
                    if (typeof address.shipping.pincode !== 'number') {
                        return res.status(400).send({ status: false, message: ' Please provide pincode' })
                    }
                    filterQuery['address.shipping.pincode'] = address.shipping.pincode
                }
            }

            if (address.billing) {
                if (address.billing.street) {
                    if (!validString(address.billing.street)) {
                        return res.status(400).send({ status: false, message: ' Please provide street' })
                    }
                    filterQuery['address.billing.street'] = address.billing.street
                }
                if (address.billing.city) {
                    if (!validString(address.billing.city)) {
                        return res.status(400).send({ status: false, message: ' Please provide city' })
                    }
                    filterQuery['address.billing.city'] = address.billing.city
                }
                if (address.billing.pincode) {
                    if (typeof address.billing.pincode !== 'number') {
                        return res.status(400).send({ status: false, message: ' Please provide pincode' })
                    }
                    filterQuery['address.billing.pincode'] = address.billing.pincode
                }
            }
        }
        filterQuery.profileImage = profileImage;
        const userdetails = await userModel.findOneAndUpdate({ userId }, filterQuery, { new: true })
        return res.status(200).send({ status: true, message: "updated user Profile", data: userdetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.updateUser = updateUser
module.exports.getUserProfileById = getUserProfileById
module.exports.loginUser = loginUser
module.exports.createUser = createUser