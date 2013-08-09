// Load modules

var Crypto = require('crypto');
var Hapi = require('hapi');

var Mongose = require('./services/mongo');
var Admin = require('./models/admin');
var Message = require('./models/message');

var Email = require('./services/email');
var config = require('./config/config');

var Redis = require('./services/redis');
var User = require('./models/user');

var bcrypt = require('bcrypt');

bcrypt.compare('$2a$10$jnEn3EyRNwXDd4qzOkhjWuHToypZaK4HU7BFNbDaaxXQxk1J2lYzS;', 'afdsds', function(err, result) {
    console.log(err, result);
})

getCode(function (result) {
    console.log(num);
});

var num = 0;

function getCode(next){
    Redis.generateCode(function(result){
        if(num == 1000000)
            return next(result);
        if(result.results > 99999 && result.results < 1000000)
            getCode(next);
        num ++;
        console.log(num);
    })
}

//Redis.listCodes(function(result){
//    console.log(result);
//})

//Redis.isExsit('balance', function(result){
//    console.log(result);
//})
return;

//Redis.client.setex('test2', 60, 'test', function (err, reply) {
//    console.log(reply);
//});

//Redis.client.ttl('test2', function (err,reply) {
//    console.log(err,reply);
//});


//var date = new Date('2013-7-7');
//console.log(date);
//date = new Date(2013, 7, 7);
//console.log(date);
//return;
//
//
var client = require('redis').createClient(null, null, {max_attempts: 8});

setTimeout(function () {
//    var user = new User({password:'afdsds', mobile_phone_num:13911437488});
//    user.save(function(err, result) {
//        console.log(err, result);
//    });

//    User.getAuthenticated(939887, 'afdsds', function(err, result) {
//        console.log(err, result);
//    })
//       Admin.getAuthenticated('8',  "888888", function(err, result){
//           console.log(err, result);
//           if(!result) return;
//           result.true_name = "t4";
//           result.save();
//       })

//    var a = new Admin();
//    Admin.findOne({_id: "51b5af1a370c3fa716000001"}, function (err, result) {
//        var o = {id:123123};
//        Object.keys(o).forEach(function (key) {
//            var val = o[key];
//            console.log(key, typeof val);
//        });
//        result.true_name = "tsfd";
//        result.save();
//    });
//    var admin = new Admin();
//    admin.findByIdAndUpdate();
//    console.log(typeof admin);

//    var admin = new Admin({worker_id:8, password:'888888', mobile_phone_num:13888888888, privilege:'admin'});
//    admin.save(function (err, result) {
//        console.log(err, result);
//    });

//    var m = new Message({device_id:'test'});
//    m.save(function(err, result){
//        console.log(err, result);
//    })

    Message.list({query:{device_id:'test2'}}, function(err, result){
        if(err){
//            req.reply({status: false, results: err.code});
        }else{
//            req.reply({status: true, results: result});

        }
        console.log('Got Messages: %j', result);
    })

//    var admin = new Admin({"id_card_num":"111","worker_id":11,"privilege":"admin","mobile_phone_num":"11111111","password":"111111","login_attempts":0,"updated_at":"2013-06-06T19:06:36.105Z","created_at":"2013-06-06T19:06:36.105Z","enabled":true});
//    admin.save(function(err, result){
//        console.log(err, result);
//    })
//    client.get('516adc90cf66ba0765000001', function (err, reply) {
//        console.log(reply);
//    });
}, 1000)

// Email.sendMail(config.VERIFY_EMAIL_MESSAGE);

// Mongose.init();

// setTimeout(function(){
//     console.log('test');
//     Admin.find().select('mobile_phone_num privilege').exec(function(err, results){
//         console.log(results);
//         results.forEach(function(result){
//             console.log(result.id);
//         });
//     });
// }, 1000);

// var redis = require('./services/redis');
// redis.init();
// //redis.getUser('516adc90cf66ba0765000001', function (res) {
// //    console.log(res);
// //});
// redis.setUser({id: "test"}, function (res) {
//     console.log(res);
// });

// Declare internals