require('dotenv').config();
const aws = require('aws-sdk'), 
      bodyParser = require('body-parser'), 
      multer = require('multer'),
      multerS3 = require('multer-s3');
aws.config.update({
    secretAccessKey: process.env.AWS_KEY, 
    accessKeyId: process.env.AWS_ID, 
    region: process.env.AWS_RE
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true)
    } else {
        cb(new Error('Invalid Mime Type, only JPEG and PNG'), false);
    }
  } 
var s3 = new aws.S3(); 
var upload = multer({
    fileFilter: fileFilter,
    storage: multerS3({
        s3: s3, 
        bucket: 'mealplan2', 
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: 'TESTING_METADATA'});
          },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + "." + file.originalname.split('.').pop())
        }
    })
});
module.exports = upload;
