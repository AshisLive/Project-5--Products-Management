const aws = require("aws-sdk")
const {uploadFile} = require('../AWS/awsS3')
const jwt = require("jsonwebtoken")

const urlOfProfileImage = async function (req, res, next) {
try{
    let files = req.files;
    if (files && files.length > 0) {
        //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
        let imageUrl = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output 
        //res.status(201).send({ status: true, data: uploadedFileURL });
        req.urlimage = imageUrl
        next()
    }
    else {
        res.status(400).send({ status: false, msg: "No file to write" });
    }
} catch (error) {
    res.status(500).send({ status: false, message: error.message })
}
}

const urlOfProfileImageForUpdate = async function (req, res, next) {
    try{
    let files = req.files;
    if (files && files.length > 0) {
        //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
        let imageUrl = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output 
        //res.status(201).send({ status: true, data: uploadedFileURL });
        req.urlimage = imageUrl
        next()
    }
    else {
        next()
    }
} catch (error) {
    res.status(500).send({ status: false, message: error.message })
}
}

const authenticationToken = function (req, res, next) {
    try {
        let token = req.header('Authorization', 'Bearer Token')
        token= token.split(' ')
        if (!token[0] && !token[1]) {
            return res.status(401).send({ status: false, msg: "no authentication token" })
        } else {
            
            let decodeToken = jwt.decode(token[1], 'user123')
            if (decodeToken) {
                req.userId = decodeToken.userId
                next()
            } else {
                res.status(401).send({ status: false, msg: "not a valid token" })
            }
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, msg: error })
    }
}
module.exports.authenticationToken=authenticationToken
module.exports.urlOfProfileImage = urlOfProfileImage
module.exports.urlOfProfileImageForUpdate = urlOfProfileImageForUpdate 