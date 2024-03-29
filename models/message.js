var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var Message = new Schema({
    device_id:{type:'String', index:true},
    message:String,
    is_readed:Boolean,
    disabled:Boolean,
    creator:{type:Schema.ObjectId, ref:'Admin'},
    updator:{type:Schema.ObjectId, ref:'Admin'}
});

var Timestamps = require('mongoose-times');
Message.plugin(Timestamps, {created: "created_at", lastUpdated: "updated_at"});

Message.statics = {
    list : function(options, callback) {
        var query = {};
        if(options.device_id != null)
            query.device_id = options.device_id;
        if(options.is_readed != null)
            query.is_readed = options.is_readed
        if(options.disabled != null)
            query.disabled = options.disabled;
        console.log('Get Messages Query: %j', query);
        this.find(query)
            .populate('creator', 'worker_id')
            .populate('updator', 'worker_id')
            .sort({'created_at': -1})
            .limit(options.perPage)
            .skip(options.perPage * (options.page-1))
            .exec(callback);
    }
}

module.exports = Mongoose.model('Message', Message);