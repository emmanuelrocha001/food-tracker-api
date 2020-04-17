const express = require('express');
const aws = require('aws-sdk');
// const S3_BUCKET = process.env.S3_BUCKET;
const s3 = new aws.S3();
aws.config.region = 'us-east-2';
aws.config.update({
  accessKeyId: 'AKIAJGGJW7QUOOK2GGNQ',
  secretAccessKey: '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'
});

const router = express.Router();
const User = require( '../models/user' );
var bcrypt = require( 'bcryptjs' );
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const multer  = require('multer');
var multerS3 = require('multer-s3')
const GridFSStorage = require('multer-gridfs-storage');
const path = require('path');




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // execute cb, pass potential error and path
    cb(null, path.join( './uploads'));

  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});





const upload = multer({storage: storage, limits: {
  fileSize: 1024 * 1024 * 5
}});


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


})

// const upload = multer({dest: 'uploads/'});

// const storage = new GridFSStorage({db: connection});
// const upload = multer({ storage });


router.post('/signup', uploads.single('avatar'), (req, res, next) => {

  User.find( {email: req.body.email} )
    .exec()
    .then(user => {
      if (user.length >= 1) {
        return res.status(409).json({
          successful: false,
          message: 'email is already linked to an existing account'
        });
      }
      else {

        bcrypt.hash(req.body.password, 10, (err, hash) =>{
          if (err) {
            return res.status(500).json({
                successful: false,
                error: err
            });
          } else {

            console.log(hash);
            // const base = 'https://food-tracker-api.herokuapp.com'
            var url = 'https://food-tracker-api-storage.s3.us-east-2.amazonaws.com/' + req.file.key;
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              avatar: url,
              password: hash
            });

            //status 201 when creating resource
            user
              .save()
              .then( result => {
                res.status(201).json({
                  successful: true,
                  userId: result._id,
                  message: 'user account created successfully',
                });

              })
              .catch(err => {
                return res.status(500).json({
                  successful: false,
                  error: err
                });

              });
          }
        });

      }
    });
});


router.post('/login', (req, res, next) => {

  User.find( {email: req.body.email} )
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(409).json({
          successful: false,
          message: 'The email provided is not linked to an existing account.'
        });
      }
      else {
        bcrypt.compare( req.body.password, user[0].password, ( err, result) => {
          if ( result ) {
            return res.status(200).json({
              successful: true,
              user: {
                name: user[0].firstName,
                lastName: user[0].lastName,
                userId: user[0]._id,
                avatar: user[0].avatar,
                email: user[0].email,
              },
              message: 'Authentication successful',
            });

          } else {
            return res.status(401).json({
              successful: false,
              message: 'Incorrect password.'
            });
          }
        });
      }
    });
});

//export such that module can be used in other files
module.exports = router;
