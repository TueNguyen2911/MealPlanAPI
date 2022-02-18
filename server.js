require('dotenv').config();
//link: https://aqueous-island-31888.herokuapp.com/
const mongoDBConnectionString = "mongodb+srv://Tue:tuechinhlatue1@seor.lbc4a.mongodb.net/MealPlan?retryWrites=true&w=majority";
const HTTP_PORT = process.env.PORT || 1107;

const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dataService = require("./modules/data-service.js");
const userService = require("./modules/user-service.js");
const upload = require("./modules/img-upload");

const app = express();
//setting up JSON Web Token 
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

passport.use(strategy);
app.use(passport.initialize()); 

app.use(bodyParser.json());
app.use(cors());
//passport.authenticate('jwt', {session: false}),
//req.body would be username and _id

app.get("/api/food-posts", passport.authenticate('jwt', {session: false}), (req, res) => {
    dataService.getFoodPosts(req.get('UserId')).then((food_posts) => {
        res.json(food_posts); 
    })
    .catch((err) => {
        res.status(500).json({"message": err}).end();
    })
})

app.get("/api/single-post/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    dataService.getFoodPostById(req.params.id)
    .then((data) => res.json(data))
    .catch((err) => res.json(err));
})
app.put("/api/update-in_plan/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    dataService.updateInPlan(req.get('UserId'), req.params.id, req.body.in_plan)
    .then((msg) => res.json(msg))
    .catch((err) => res.json(err));
})
app.get("/api/food-in-plan", passport.authenticate('jwt', {session: false}), (req, res) => {
    dataService.getFoodInPlan(req.get('UserId'))
    .then((data) => res.json(data))
    .catch((err) => res.json(err));
})
app.put("/api/update-macro", passport.authenticate('jwt', {session: false}), (req, res) => {
    console.log('/api/update-macro hits', req.body)
    dataService.updateMacro(req.get('UserId'), req.body)
    .then((data) => res.json(data))
    .catch((err) => res.json(err));
})
app.get("/api/macro", passport.authenticate('jwt', {session: false}), (req, res) => {
    console.log('/api/macro hits')
    dataService.getMacroByUserId(req.get('UserId'))
    .then((data) => res.json(data))
    .catch((err) => res.json(err));
})
app.delete("/api/deletePost/:postId", passport.authenticate('jwt', {session: false}), (req, res) => {
    console.log('delete hits', req.params.postId);
    dataService.deletePost(req.get('UserId'), req.params.postId)
    .then((data) => res.json(data))
    .catch((err) => res.json(err));
})
app.post("/api/sign-up", (req, res) => {
    console.log('hits')
    userService.registerUser(req.body)
    .then((msg) => {
        res.json({"message": msg });
    }).catch((err) => {
        res.status(422).json({"message": err})
    })
})
app.post('/api/login', (req,res) => {
    userService.checkUser(req.body)
    .then((user) => {
        var payload = {
            _id: user._id,
            username: user.username
        };

        var token = jwt.sign(payload, jwtOptions.secretOrKey); 
        res.json({"message": "login successful", "token": token});
    }).catch((error) => {
        res.status(422).json({'message': error});
    })
})
const uploadS3 = upload.any('photos', 1);
app.post('/api/img-upload', passport.authenticate('jwt', {session: false}), function(req, res, next) {
    uploadS3(req, res, function(err) {
        if(err) {
            console.log(err);
            return res.status(422).json({"error" : err.message});
        }
        let filenames = req.files.map(file => {
            return file.location;
        })
        console.log(req.files);
        console.log(filenames);
        return res.json(filenames);
    })
}); 
app.post('/api/add-post', passport.authenticate('jwt', {session: false}), function(req, res) { 
    dataService.addFoodPost(req.body)
    .then((success_msg) => res.json(success_msg))
    .catch((error_msg) => res.json(error_msg));
})

// app.use((req, res) => {
//     res.status(404).end();
// });
// Connect to the DB and start the server

userService.connect().then(()=>{
    dataService.connect().then(() => {
        app.listen(HTTP_PORT, ()=>{console.log("API listening on: " + HTTP_PORT)});
    })
    .catch((err) => {
        console.log("unable to start the server from data: " + err);
    process.exit();
    })
})
.catch((err)=>{
    console.log("unable to start the server: " + err);
    process.exit();
});
