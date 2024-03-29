var Message = require('../models/message');
var Admin      = require('../models/admin');

var internals = {};

internals.list = function(req){
    Message.list(req.query, function(err, result){
        if(err){
            req.reply({status: false, results: err.code});
        }else{
            req.reply({status: true, results: result});
            console.log('Got Messages:', result.length);
        }
    })
}

internals.listMine = function(req){
    var query = req.query;
    if(!query.device_id)
    {
        req.reply({status: false, results: '没有获取到应用ID'});
        return;
    }
    query.disabled = false;
    Message.list(query, function(err, result){
        if(err){
            req.reply({status: false, results: err.code});
        }else{
            req.reply({status: true, results: result});
            result.forEach(function (item) {
                if(!item.is_readed)
                {
                    item.is_readed = true;
                    item.save();
                }
            });
            console.log('Got Messages: %j', result);
        }
    })
}

internals.add = function(req){
    var o = req.payload;
    delete o['id'];
    console.log('To Add Message: %j', o);
    var message = new Message(o);
    var creator = req.pre.admin;
    if(creator)
        message.creator = new Admin(creator);
    message.save(function(err, result){
        if(err){
            req.reply({status: false, results: err.code});
        }else{
            req.reply({status: true, results: result});
        }
    })
}

internals.delete = function(req){
    var updateObject = req.payload;
    var admin = req.pre.admin;
    delete updateObject['id'];
    Message.findOne({_id:updateObject._id}, function(err, result){
        if(err){
            req.reply({status:false, results:err.code});
        }else if(result){
            result.disabled = true;
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
}

module.exports = internals;