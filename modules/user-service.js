require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const mongoDBConnectionString = "mongodb+srv://Tue:tuechinhlatue1@seor.lbc4a.mongodb.net/MealPlan?retryWrites=true&w=majority"; 
const Schema = mongoose.Schema; 
const userSchema = new Schema( {
    username: { 
        type: String, 
        unique: true
    }, 
    password: String, 
    email: String 
});

let User; 

module.exports.connect = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(mongoDBConnectionString, { useNewUrlParser: true});

        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });

        db.once('open', () => {
            User = db.model("users", userSchema, "users");
            resolve();
        });
    });
};
module.exports.registerUser = function(userData) {
    return new Promise (function (resolve, reject) {
        if(userData.password != userData.password2) {
            reject("Password does not match!");
        } else {
            bcrypt.hash(userData.password, Number(process.env.HASH_COUNT)).then(hashed => {
                userData.password = hashed; 
                let newUser = new User(userData);
                newUser.save((err) => {
                    if(err) {
                        if(err.code == 11000) {
                            reject("Username is taken");
                        } else {
                            reject("Error in creating new User");
                        }
                    } else {
                        resolve("User " + userData.username + " has been created!");
                    }
                    
                })
            })
        }
    })
}
module.exports.checkUser = function(userData) {
    return new Promise((resolve, reject) => {
        console.log("in");
        User.find({ username: userData.username })
            .limit(1)
            .exec()
            .then((users) => {
                console.log(users);
                if(users.length == 0) {
                    reject("Unable to find user " + userData.username);
                } else {
                    bcrypt.compare(userData.password, users[0].password).then(res => {
                        console.log(res);
                        if(res === true) {
                            console.log("Correct login")
                            resolve(users[0]);
                        }
                        else 
                            reject("Wrong password for user: " + userData.username);
                    });
                }
            }).catch((err) => {
                reject("Error in finding user: " + userData.username);
            })
    })
}
module.exports.userById = function(id) {
    return new Promise((resolve, reject) => {
        console.log("here")
        User.find({_id: id})
        .limit(1)
        .exec()
        .then((users) => {
            console.log("userByID" + users); 
            resolve(users[0]);
        })
        .catch((err) => {
            reject("Error in finding user")
        })
    })
}