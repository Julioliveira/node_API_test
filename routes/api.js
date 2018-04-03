//dependecies
var express = require('express');
var aws = require('aws-sdk')
var router = express.Router();
var mongoose = require('mongoose');
var app = express();
var multer = require('multer');
var multerS3 = require('multer-s3')
var bucketName = 'market.images';
var s3 = new aws.S3({ /* ... */ })
s3.config.loadFromPath("./config.json");
var bucketName = bucketName;
var filter = (req, file, cb) => {
    if (file.mimeType === "image/*") {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}
var upload = multer({
    filter: filter,
    storage: multerS3({
        s3: s3,
        bucket: bucketName,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, new Date().toISOString() + file.originalname)
        }
    })
})

app.use((req, res, next) => { //for avoiding CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') { //allow methods to be executed 
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, GET, DELETE');
        return res.status(200).json({});
    };
    next();
})
//models
var Market = require('../models/market');

//routes
router.get('/markets', (req, res, next) => {
    Market.find()
        .select('name description location image _id')
        .then(docs => {
            const response = {
                count: docs.length,
                markets: docs
            };
            res.status(200).json(response);
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.get('/markets/:marketId', (req, res, next) => {
    const id = req.params.marketId;
    Market.findById(id)
        .select('name description location image _id')
        .then(doc => {
            if (doc) {
                res.status(200).json({ doc });
            }
            else {
                res.status(404).json({ message: "No valid entry found for " + id })
            }

        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.get('/markets/search/:name', (req, res, next) => {
    const name = req.params.name;
    var query = { name: new RegExp('^' + name) };
    Market.find(query)
        .select('name description location image _id')
        .then(doc => {
            if (doc) {
                const response = {
                    count: doc.length,
                    markets: doc
                };
                res.status(200).json(response);
            }
            else {
                res.status(404).json({ message: "No valid entry found for " + id })
            }

        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.post('/markets', upload.single('marketImage'), (req, res, next) => {
    const market = new Market({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        description: req.body.description,
        location: req.body.location,
        image: req.file ? {
            url: req.file.location,
            name: req.file.originalname,
            key: req.file.key
        } : null
    });
    market.save()
        .then(result => {
            res.status(201).json({
                message: 'Created successfully',
                createdMarket: {
                    _id: result._id,
                    name: result.name,
                    description: result.description,
                    location: result.location,
                    image: result.image
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });

});
router.delete('/markets/:marketId', (req, res, next) => {
    const id = req.params.marketId;
    Market.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({ message: 'Object deleted with success' });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.delete('/markets/:marketId/:imageId', (req, res, next) => {
    const id = req.params.marketId;
    var params = { Bucket: bucketName, Key: req.params.imageId };
    var imageError;
    s3.deleteObject(params, function (err, data) {
        if (err) {
            imageError = err;
        }
    });
    Market.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({ message: 'Object deleted with success' });
            if (imageError) {
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err,
                imageDeleteError: imageError ? imageError : null
            })
        })
});

router.patch('/markets/:marketId', upload.single('marketImage'), (req, res, next) => {
    const id = req.params.marketId;
    var updateOps = {};
    var imageId = req.body.imageId;
    var imageError;
    var image = req.file ? {
        url: req.file.location,
        name: req.file.originalname,
        key: req.file.key
    } : null
    if (imageId) {
        var params = { Bucket: bucketName, Key: imageId };
        s3.deleteObject(params, function (err, data) {
            if (err) {
                imageError = err;
            }
        });
    }
    updateOps = {
        name: req.body.name,
        description: req.body.description,
        location: req.body.location
    }
    
    if (image) {
        updateOps.image = image;
    }
    if (!image){
        updateOps.image = {};
    }
    console.log(updateOps);
    Market.update({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Object successfully updated',
                id: id
            });
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
    res.status(500);
});


//Return router
module.exports = router;