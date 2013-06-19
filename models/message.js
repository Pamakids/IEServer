var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var Message = new Schema({
    device_id:{type:'String', index:true},
    message:String,
    is_readed:String,
    disabled:String,
    creator:{type:Schema.ObjectId, ref:'Admin'},
    updator:{type:Schema.ObjectId, ref:'Admin'}
});

var Timestamps = require('mongoose-times');
Message.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});

Message.statics = {
    list : function(options, callback) {
        this.find({device_id:options.device_id})
            .populate('creator', 'worker_id')
            .populate('updator', 'worker_id')
            .sort({'created_at': -1})
            .limit(options.perPage)
            .skip(options.perPage * (options.page-1))
            .exec(callback);
    }
}

module.exports = Mongoose.model('Message', Message);