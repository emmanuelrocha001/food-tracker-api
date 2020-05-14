// router
const express = require('express');
const router = express.Router();

// http requests
const axios = require('axios');

// schema models
const mongoose = require('mongoose');
const User = require( '../models/user' );
const Milestone = require( '../models/milestone' );

// aws configuration
const aws = require('aws-sdk');
aws.config.region = 'us-east-2';
aws.config.update({
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET
});
const s3 = new aws.S3();

// file uploads
const multer  = require('multer');
var multerS3 = require('multer-s3');

const uploads = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'food-tracker-api-storage',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname)
        }
    })
});


// post milestone
router.post('/:userId', uploads.single('pic'), (req, res) => {
    // configure pic url(if any)
    var url = "";
    console.log(req.body.pic);
    if(req.file != undefined) {
        url = 'https://food-tracker-api-storage.s3.us-east-2.amazonaws.com/' + req.file.key;
    }

    var currentdate = new Date();

    const milestone = new Milestone({
        _id: new mongoose.Types.ObjectId(),
        userId: req.params.userId,
        weight: req.body.weight,
        date: currentdate,
        pic: url

    });

    milestone
        .save()
        .then( result => {
            res.status(201).json({
                milestone: result,
                message: "milestone successfully created"
            });
        })
        .catch(error => {
            res.status(500).json({
                error: error
            });
        });
});



// get user milestones
router.get('/:userId', (req, res) => {

    Milestone.find()
        .select()
        .sort( { date: 'desc' } )
        .exec()
        .then(docs => {

            if (docs.length >= 0) {
                res.status(200).json({
                    milestones: docs
                });
            }
            else{
            res.status(404).json({
                milestones: [],
                message: 'No entries found'
            });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
            error : err
            });
        });
});


// delete milestone
router.delete('/:milestoneId', (req, res) => {

    Milestone.find( {_id: req.params.milestoneId} )
        .exec()
        .then( milestone => {
            // delete image from s3 storage(if exists)
            if(milestone[0].pic != "") {
                var old = milestone[0]["pic"].replace('https://food-tracker-api-storage.s3.us-east-2.amazonaws.com/', '');
                var bucket = 'food-tracker-api-storage';
                var params = {
                    Bucket: bucket ,
                    Key: old
                };
                s3.deleteObject(params, function(error,data) {
                    if(error) {
                        console.log(error);
                        res.status(500).json({
                            error: error
                        });
                    } 
                });
            }

            // remove from database
            Milestone.remove( { _id: req.params.milestoneId } )
            .exec()
            .then(result => {
                res.status(200).json({
                    message: "milestone successfully deleted"
                })
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({
                    error: error
                });
            });


        })
        .catch(error => {
            console.log(error);
            res.status(500).json({
                error: error
            });
        })



});

//export such that module can be used in other files
module.exports = router;
