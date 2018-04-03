//dependecies
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

//mongodb
mongoose.connect('mongodb://Application:Jul!o6605@supermarketapp-shard-00-00-vcln5.mongodb.net:27017,supermarketapp-shard-00-01-vcln5.mongodb.net:27017,supermarketapp-shard-00-02-vcln5.mongodb.net:27017/SuperMarkets?ssl=true&replicaSet=SuperMarketApp-shard-0&authSource=admin');
//express
var app = express();
app.use((req, res, next) => { //for avoiding CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS') { //allow methods to be executed 
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, GET, DELETE');
        return res.status(200).json({});
    };
    next();
})
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

//routes
app.use('/api', require('./routes/api'));

//start server
app.listen(8081);
console.log('API is running on port 8081');