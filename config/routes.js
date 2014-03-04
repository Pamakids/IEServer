var Hapi = require('hapi');
var S = Hapi.types.String;
var I = Hapi.types.Number;
var A = Hapi.types.Array;
var Redis = require('../services/redis');
var Admin = require('../services/admin');
var User = require('../services/user');
var Uploader = require('../services/uploader');
var Message = require('../services/message');
var DataFileModel = require('../models/data_file');
var UFile = require('../models/ufile');
var UserTest = require('../services/user_test');

var config    = require('./config');

var internals = {};

var preAuthUser = function (req, next) {
    var admin = req.pre.admin;
    if(admin)
    {
        next(admin);
        console.log('Pre Auth User Has Admin', admin);
    }else{
        console.log('Pre Auth User', req.payload, req.query);
        var id = req.payload ? req.payload.id : req.query.id;
        if (id) {
            console.log('Auth ID: %s', id);
            Redis.getUser(id, function (result) {
                if (result && result != 'undefined')
                    next(result);
                else
                    next(Hapi.boom.unauthorized('Unauthorized!'));
            });
        } else {
            next(Hapi.boom.unauthorized('Unauthorized!'));
        }
    }
};

var preAuthAdmin = function (req, next) {
    var id = req.payload ? req.payload.id : req.query.id;
    console.log('Pre Auth Admin', id);
    if (id) {
        console.log('Auth ID: %s', id);
        Redis.getUser(id, function (result) {
            console.log('Auth Result: %j', result);
            result = JSON.parse(result);
            if (result && result != 'undefined')
                result.worker_id ? next(result) : next(Hapi.boom.unauthorized('Unauthorized'));
            else
                next(Hapi.boom.unauthorized('Unauthorized!'));
        });
    } else {
        next(Hapi.boom.unauthorized('Unauthorized!'));
    }
};

internals.getAdminUsers = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: Admin.getUsers,
    validate: {
        query: {
            perPage: I().required(),
            page: I().required(),
            id: S().required()
        }
    }
};

internals.signUpAdmin = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: Admin.signUp
//    validate: {
//        payload: {
//            worker_id: I().required().max(999999),
//            password: S().required().min(6),
//            mobile_phone_num: I().required().min(8),
//            privilege: S().required(),
//            email: S().email()
//        }
//    }
};

internals.signInAdmin = {
    handler: Admin.signIn,
    validate: {
        payload: {
            account: S().required(),
            password: S().required().min(6)
        }
    }
};

internals.updateAdmin = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: Admin.updateUser
};

internals.deleteAdmin = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: Admin.deleteUser
}

internals.signUpUser = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: User.signUp
};

internals.signInUser = {
    handler: User.signIn,
    validate:{
        payload:{
            password: S().required().min(6)
        }
    }
};

internals.getUsers = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: User.getUsers
};

internals.updateUser = {
    pre: [
        {method: preAuthAdmin, assign: 'admin', mode: 'parallel'},
        {method: preAuthUser, assign: 'user'}
    ],
    handler: User.updateUser
};

internals.upload = {
    payload: "stream",
    handler: Uploader.upload
};

internals.getUploadedFiles = function(request){
    return './'+config.uploaded_dir+'/'+request.params.file;;
}

internals.getMessages = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler:Message.list
}

internals.getMyMessages = {
    handler:Message.listMine
}

internals.addMessage = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: Message.add
}

internals.deleteMessage = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: Message.delete
}

internals.getDatas = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: function(req){
        DataFileModel.list(req.payload, function (err, result) {
           if(err){
               req.reply({status: false, results: err.code});
           }else{
               req.reply({status: true, results: result});
               console.log('Got DataFiles: %j', result.length);
           }
        });
    }
}

internals.getUfiles = {
//    pre: [
//        {method: preAuthAdmin, assign: 'admin'}
//    ],
    handler: function(req){
        UFile.list(req.query, function (err, result) {
            if(err){
                req.reply({status: false, results: err.message});
            }else{
                req.reply({status: true, results: result});
                console.log('Got DataFiles: %j', result.length);
            }
        });
    }
}

internals.checkLottery = {
    handler: function(req){
        Redis.checkLottery(req.query.code, function (result) {
            req.reply(result);
        });
    }
}

internals.codeList = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: function(req){
        Redis.listCodes(function (result) {
            req.reply(result);
        });
    }
}

internals.codeAdd = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler: function(req){
        Redis.generateCode(function (result) {
            req.reply(result);
        });
    }
}

internals.codeRefresh = {
    pre: [
        {method: preAuthAdmin, assign: 'admin'}
    ],
    handler:function(req){
        Redis.refreshCode(req.payload.code, function (result) {
            req.reply(result);
        });
    }
}

internals.codeCheck = {
    handler:function(req){
        Redis.checkStatus(req.query.code, function (result) {
            req.reply(result);
        });
    }
}

internals.updateUT = {
    handler:UserTest.update
}

internals.getUTConfig = {
    handler:UserTest.getConfig
}

internals.endpoints = [
    {method: 'GET', path: '/admin/users', config: internals.getAdminUsers},
    {method: 'POST', path: '/admin/signUp', config: internals.signUpAdmin},
    {method: 'POST', path: '/admin/signIn', config: internals.signInAdmin},
    {method: 'POST', path: '/admin/user/update', config: internals.updateAdmin},
    {method: 'POST', path: '/admin/user/delete', config: internals.deleteAdmin},
    {method: 'POST', path: '/user/signUp', config: internals.signUpUser},
    {method: 'POST', path: '/user/signIn', config: internals.signInUser},
    {method: 'GET', path: '/user/users', config: internals.getUsers},
    {method: 'POST', path: '/user/update', config: internals.updateUser},
    {method: 'POST', path: '/upload', config: internals.upload},
    {method: 'GET', path:'/'+config.uploaded_dir+'/{file*}', handler: {file:internals.getUploadedFiles}},
    {method: 'GET', path:'/message/all', config:internals.getMessages},
    {method: 'GET', path:'/message/mine', config:internals.getMyMessages},
    {method: 'POST', path:'/message/add', config:internals.addMessage},
    {method: 'POST', path:'/message/delete', config:internals.deleteMessage},
    {method: 'POST', path:'/datas/clickedPointsData', config:internals.getDatas},
    {method: 'GET', path:'/check/lottery', config:internals.checkLottery},
    {method: 'GET', path:'/code/list', config:internals.codeList},
    {method: 'GET', path:'/code/add', config:internals.codeAdd},
    {method: 'POST', path:'/code/refresh', config:internals.codeRefresh},
    {method: 'GET', path:'/code/check', config:internals.codeCheck},
    {method: 'GET', path:'/ufiles', config:internals.getUfiles},
    {method: 'GET', path:'/ut/update', config:internals.updateUT},
    {method: 'GET', path:'/ut/get', config:internals.getUTConfig},
    {method: 'GET', path:'/ut/all', handler:UserTest.getALL}
];

module.exports = internals.endpoints;