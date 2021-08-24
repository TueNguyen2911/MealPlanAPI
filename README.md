## Uploading image to AWS S3 Bucket: 
Packages require: 
* multer 
* multer-s3
* aws-sdk
Setting the configuration for aws object 
```javascript 
aws.config.update({
    secretAccessKey: process.env.AWS_KEY, 
    accessKeyId: process.env.AWS_ID, 
    region: process.env.AWS_RE
});
```
Specifying options in multer and multerS3 
```javascript 
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
```
Catching the image upload request, for some reasons `upload.array()` doesn't work
```javascript 
const upload = require("./modules/img-upload");
const uploadS3 = upload.any('photos', 1);
app.post('/api/img-upload', passport.authenticate('jwt', {session: false}), function(req, res, next) {
    uploadS3(req, res, function(err) {
        if(err)
            return res.status(422).json({"error" : err.message});
        let filenames = req.files.map(file => {
            return file.location;
        })
        return res.json(filenames);
    })
}); 
```
## Using JWT (Json Web Token) to authenticate user: 

