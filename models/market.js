//dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;


//schema

var marketSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true},
    description: String,
    location: { type: String, required: true},
    image: {
        url: String,
        name: String,
        key: String
    }
});


//return model
module.exports = restful.model('Markets', marketSchema)