const aws = require("aws-sdk")
const {uploadFile} = require('../AWS/awsS3')
const jwt = require("jsonwebtoken")

const urlOfProfileImage = async function (req, res, next) {
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
}

const mid1 = function (req, res, next) {
    try {
        let token = req.header.authorization
        console.log(token)
        if (!token) {
            return res.status(401).send({ status: false, msg: "no authentication token" })
        } else {
            
            let decodeToken = jwt.decode(token, '22nd-Dec-Project-Product')
            console.log('lne 26' , decodeToken)
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
module.exports.mid1=mid1
module.exports.urlOfProfileImage = urlOfProfileImage