var Mongoose = require('mongoose');
var User = require('../models/user');
var Hapi = require('hapi');
var Inspect = require('util').inspect;
var Emailer = require('./email');
var ErrorMessage = require('../config/config').errorMessage;
var Admin      = require('../models/admin');

module.exports.updateUser = function(req){
    var updateObject = req.payload;
    var admin = req.pre.admin;
    delete updateObject['id'];
    User.findOne({_id:updateObject._id}, function(err, result){
        if(err){
            req.reply({status:false, results:err.code});
        }else if(result){
            Object.keys(updateObject).forEach(function (key) {
                var val = updateObject[key];
                console.log(key, val);
                result[key] = val;
            });
            if(admin)
                result.updator = new Admin(admin);
            result.save(function(err, result){
                if(err)
                {
                    req.reply({status:false, results:err.code});
                }else{
                    req.reply({status:true});
                }
            })
        }
    });
};

module.exports.getUsers = function(req){
    console.log(req.query, req.pre.auth);
    User.getUsers(req.query, function (err, results) {
        if (err) {
            req.reply({status: false, results: err.code});
        } else {
            req.reply({status: true, results: results});
        }
    });
}

module.exports.signUp = function (req) {
    console.log('SignUp:');
    var payload = req.payload;
    var verify_code = Math.floor(Math.random() * 999) + 100;
    payload.verify_code = verify_code;
    var user = new User(payload);
    var creator = req.pre.admin;
    if(creator)
        user.creator = new Admin(creator);
    user.save(function (err) {
        if (err) {
            console.log(Inspect(err));
            req.reply({status: false, results: err.code});
        } else {
            req.reply({status: true});
            Emailer.sendMail(Emailer.verifyEmailMessage(verify_code, user.name + ' <' + user.email + ' >'));
        }
    });
};

module.exports.signIn = function (req) {
    console.log("User Sign In: %s, Time: %s", req.payload.name, Date.now());

    User.getAuthenticated(req.payload.name, req.payload.password, function (err, user, reason) {
        if (err) {
            console.log(Inspect(err));
            req.reply({status: false, results: err.code});
        } else if (user) {
            console.log('SignIn Sucess!' + Inspect(user));
            req.reply({status: true, results: user});
        } else {
            var reasons = User.failedLogin;
            console.log("Failed Reason: %d", reason);
            req.reply({status: false, results: ErrorMessage(reason)});
        }
    })
};

module.exports.verify = function (req) {
    console.log('Verify:');
}
