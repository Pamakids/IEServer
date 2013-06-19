var Hapi = require('hapi');
var S = Hapi.types.String;
var I = Hapi.types.Number;
var A = Hapi.types.Array;
var Redis = require('../services/redis');
var Reasons = require('./reasons');
var Admin = require('../services/admin');
var User = require('../services/user');
var Uploader = require('../services/uploader');
var Message = require('../services/message');

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
    {method: 'POST', path:'/message/delete', config:internals.deleteMessage}
];

module.exports = internals.endpoints;