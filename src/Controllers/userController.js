const aws = require("../AWS/awsS3")
const userModel = require("../Models/userModel")
const { isValid, isValidRequestBody, isValidObjectId, validatePhone, validateEmail} = require('../Validator/validate')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const createUser = async function (req, res) {
    try {
        const requestBody = req.body;
        let { fname, lname, phone, email, password, address} = requestBody
        //console.log("hlo", req.body)
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
            res.status(400).send({ status: false, message: `${password} invalid` })
            return
        }
        if (!(password.trim().length > 7 && password.trim().length < 16)){
            res.status(400).send({ status: false, message: `${password} invalid` })
            return
        }

        
        const hashPassword = await aws.hashPassword(password)
        console.log(hashPassword)
        requestBody.password = hashPassword;
        // address = JSON.parse(address)
        requestBody.address=JSON.parse(address)
        requestBody['profileImage']=req.urlimage
            const userData = await userModel.create(requestBody)
            res.status(201).send({ status: true, msg: "successfully created", data: userData })
        
    } catch (err) {

        res.status(500).send({ status: false, msg: err.message })
    }

}
module.exports.createUser = createUser


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
        const user = await userModel.findOne({email});
        if (!user) {
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return
        }
        const passOfUser= user.password
        const isValidPass = bcrypt.compareSync(password, passOfUser);
        if(!isValidPass){
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return 
        }

        let userId = user._id
        let payload = { userId:user._id }
        let token = await jwt.sign(payload,
            
            '22nd-Dec-Project-Product', { expiresIn: '100hr' })
           
        res.header('Authorization', token);
        res.status(200).send({ status: true, message: `User logged in successfully`, data: { userId,token } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


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
    const userId = req.params.userId
    const tokenUserId = req.userId

    if(!isValidObjectId(userId) && !isValidObjectId(tokenUserId)){
    return res.status(404).send({status:false, message:"userId or token is not valid"})
    }
    const user = await userModel.findOne({ _id: userId })
    if (!user) {
        res.status(404).send({ status: false, message: `user not found` })
        return
    }
    if(!(userId.toString()==tokenUserId.toString())){
        return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
    }

    let { fname, lname, email, phone, password, address } = req.body
    address = JSON.parse(address)
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
            filterQuery['password'] = password.trim()
        }
    }

    const details = { fname, lname, email, phone, password, address, profileImage }
    console.log(address)
    console.log(details)
    const userdetails = await userModel.create(details)
    return res.send(userdetails)
    // console.log(req.body)
    // console.log("------------------------------------------------------------")
    // console.log(JSON.parse(req.body.address))
    // console.log("------------------------------------------------------------")
    // let address1=JSON.parse(req.body.address)
    // console.log(address1.shipping)
}

module.exports.updateUser = updateUser
module.exports.getUserProfileById = getUserProfileById
module.exports.loginUser = loginUser