require('dotenv').config();
const mongoose = require('mongoose');

const mongoDBConnectionString = "mongodb+srv://Tue:tuechinhlatue1@seor.lbc4a.mongodb.net/MealPlan?retryWrites=true&w=majority"; 
const Schema = mongoose.Schema; 
const foodPostSchema = new Schema({
    "title": String, 
    "shortDesc": String, 
    "img": String, 
    "calories": Number,
    "protein": Number, 
    "carb": Number,
    "fat": Number, 
    "ingredients": Array, 
    "instructions": Array, 
    "tags": Array, 
    "in_plan": Boolean,
    "user_id": String, 
    "serving": String
})
const macroSchema = new Schema({
    "calories": Number, 
    "protein": Number, 
    "carb": Number, 
    "fat": Number,
    "user_id": String
})
let foodPost, macro; 
const aws = require('aws-sdk');

deleteNotNeedS3Objs = function () {
    let bucketObjectKeys = [] 
    let foodPostImg = [];
    let difference = [];
    var s3 = new aws.S3(); 
    //getting objects from AWS S3
    var params1 = {
        Bucket: process.env.BUCKET_NAME.toString(), 
        MaxKeys: 100
       };
    s3.listObjects(params1, function(err, data) {
        if (err) 
            console.log(err, err.stack); // an error occurred
        else {      
            data.Contents.forEach(elem => {
                bucketObjectKeys.push(elem.Key);
            })
            //get all foodPosts
            foodPost.find()
            .exec()
            .then((food_posts) => {
                if(food_posts.length == 0)
                    console.log("Unable to retrieve food posts")
                else {
                    food_posts.forEach(elem => {
                        foodPostImg.push(elem.img.match(/([^\/]+).$/g)[0]);
                    });
                    //find the difference between bucket objects and documents in mongoDB
                    bucketObjectKeys.map(x => {
                        if(!foodPostImg.includes(x)) {
                            let obj = {
                                Key: x
                            }
                            difference.push(obj);
                        }
                    });
                    //delete bucket Objects
                    if(difference.length > 0) {
                        var params2 = {
                            Bucket: process.env.BUCKET_NAME.toString(), 
                            Delete: {
                                Objects: difference,
                                Quiet: false
                            }
                        }; 
                        s3.deleteObjects(params2, function(err, data) {
                            if (err) {
                                console.log(err, err.stack); // an error occurred
                                console.log('err');
                            }
                            else {
                                console.log(data);           // successful response
                                console.log('success')
                            }
                        });

                    }
                }
            })
            .catch((err) => {
                console.log("Error in retrieving food posts: " + err);
            })
        }
    });

    
    
}
module.exports.connect = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(mongoDBConnectionString, { useNewUrlParser: true});

        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });

        db.once('open', () => {
            foodPost = db.model("foodPosts", foodPostSchema, "foodPosts");
            macro = db.model("macros", macroSchema, "macros");
            deleteNotNeedS3Objs();
            resolve();
        });
    });
};
module.exports.getFoodPosts = function(_id) {
    return new Promise(function(resolve, reject) {
        foodPost.find({user_id: _id})
        .exec()
        .then((food_posts) => {
            console.log(_id);
            console.log(food_posts.length)
            if(food_posts.length == 0)
                reject("Unable to retrieve food posts")
            else {
                resolve(food_posts);
            }
        })
        .catch((err) => {
            reject("Error in retrieving food posts: " + err);
        })
    })
}
module.exports.getFoodInPlan = function(user_id) {
    return new Promise(function(resolve, reject) { 
        foodPost.find({in_plan: true, user_id: user_id})
        .exec()
        .then((food_in_plan) => {
            if(food_in_plan.length == 0)
                resolve('There\'s no food added yet');
            resolve(food_in_plan);
        })
        .catch((err) => reject(err));
    })
}
module.exports.addFoodPost = function(formData) {
    return new Promise(function(resolve, reject) {
        console.log(formData);
        let aFoodPost = new foodPost({
            "title": formData.title, 
            "shortDesc": formData.shortDesc, 
            "img": formData.img, 
            "calories": formData.calories,
            "protein": formData.protein, 
            "carb": formData.carb,
            "fat": formData.fat, 
            "ingredients": formData.ingredients, 
            "instructions": formData.instructions, 
            "tags": formData.tags, 
            "in_plan": formData.in_plan,
            "user_id": formData.user_id,
            "serving": formData.serving
        })
        aFoodPost.save()
        .then(() => resolve({
            msg: aFoodPost.title + " is created!", 
            id: aFoodPost._id
        }))
        .catch(() => reject("Error in creating " + formData.title));
    })
}
module.exports.getFoodPostById = function(id) {
    return new Promise(function(resolve, reject) { 
        foodPost.findOne({_id: id})
        .exec()
        .then((data) => { console.log(data); resolve(data)})
        .catch((err) => reject(err));
    })
}
module.exports.updateInPlan = function(user_id, food_id, in_plan) {
    console.log(user_id, food_id, in_plan)
    return new Promise((resolve, reject) => { 
        foodPost.updateOne(
            {user_id: user_id, _id: food_id},
            {$set: {in_plan: in_plan}})
        .then((msg) => resolve(msg))
        .catch((err) => reject(err));
    })
}
module.exports.updateMacro = function(user_id, p_macro) {
    console.log(user_id, p_macro); 
    return new Promise((resolve, reject) => {
        macro.findOne({user_id: user_id})
        .then((data) => {
            if(!data) {
                let aMacro = macro({
                    calories: p_macro.calories, 
                    protein: p_macro.protein, 
                    carb: p_macro.carb, 
                    fat: p_macro.fat,
                    user_id: user_id
                });
                aMacro.save()
                .then((msg) => resolve(msg))
                .catch((err) => reject(err));
            }
            else {
                macro.updateOne(
                    {user_id: user_id}, 
                    {$set: {calories: p_macro.calories, 
                        protein: p_macro.protein, 
                        carb: p_macro.carb, 
                        fat: p_macro.fat}}
                )
                .then((msg) => resolve(msg))
                .catch((err) => reject(err));
            }
        })
        

    })
}
module.exports.getMacroByUserId = function(user_id) {
    console.log(user_id); 
    return new Promise((resolve, reject) => {
        macro.findOne({user_id: user_id})
        .exec()
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    })
}

module.exports.deletePost = function(user_id,postId) {
    return new Promise((resolve, reject) => { 
        foodPost.deleteOne({_id: postId, user_id: user_id})
        .exec() 
        .then(() => resolve(`Meal ${postId} has been deleted`))
        .catch((error) => reject(error));
    })
}