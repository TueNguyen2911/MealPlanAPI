This is the api for MealPlanner Angular app: https://github.com/TueNguyen2911/MealPlanner2
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
Required packages: 
* jsonwebtoken, this module is mostly used to sign JSON payload and generate the token 
* passport, this module is used to authenticate requests using 'strategy'
* passport-jwt, this module is the 'strategy' that passport uses 

Setting up JWT 'strategy' 

```javascript 
    var ExtractJWT = passportJWT.ExtractJwt;
    var JWTStrategy = passportJWT.Strategy; 
    //Configure its options 
    var jwtOptions = {}; 
    jwtOptions.jwtFromRequest = ExtractJWT.fromAuthHeaderWithScheme("jwt"); 
    jwtOptions.secretOrKey = process.env.JWT_SECRET; 
    const strategy = new JWTStrategy(jwtOptions, function (jwt_payload, next) {
        console.log('pay load received', jwt_payload); 
        if(jwt_payload) {
            next(null, {
                _id: jwt_payload.id,
                username: jwt_payload.username, 
                email: jwt_payload.email
            });
        } else { 
            next(null, false);
        }
    })
    //Tell passport to use this strategy 
    passport.use(strategy);
```

For every route that needs to authentication, add passport.authenticate() to app.get() callback functions 
```javascript 
    app.get("/api/food-posts", passport.authenticate('jwt', {session: false}), (req, res) => {
        dataService.getFoodPosts(req.get('UserId')).then((food_posts) => {
            res.json(food_posts); 
        })
        .catch((err) => {
            res.status(500).json({"message": err}).end();
        })
    })
```

Once a user logs in, generate a token and send it back to the user, the user can save that token and send it with request later for server to authenticate 
```javascript 
app.post('/api/login', (req,res) => {
    userService.checkUser(req.body)
    .then((user) => {
        var payload = {
            _id: user._id,
            username: user.username
        };
        //signing and generate token 
        var token = jwt.sign(payload, jwtOptions.secretOrKey); 
        res.json({"message": "login successful", "token": token});
    }).catch((error) => {
        res.status(422).json({'message': error});
    })
})
```

