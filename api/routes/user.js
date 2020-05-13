const express = require('express');
const aws = require('aws-sdk');
// const S3_BUCKET = process.env.S3_BUCKET;
aws.config.region = 'us-east-2';


// for deployment
aws.config.update({
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET
});
const s3 = new aws.S3();

const router = express.Router();
const User = require( '../models/user' );
var bcrypt = require( 'bcryptjs' );
const mongoose = require('mongoose');


// google token validation
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

const Grid = require('gridfs-stream');
const multer  = require('multer');
var multerS3 = require('multer-s3')
const GridFSStorage = require('multer-gridfs-storage');
const path = require('path');





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

// sign up with google
router.post('/signup/:token', (req, res, next) => {

  const token = req.params.token;
  client
    .verifyIdToken({idToken: token,audience: process.env.CLIENT_ID})
    .then( ticket => {
      const payload = ticket.getPayload();


      // payload["aud"].localeCompare(process.env.CLIENT_ID)
      
      
      if(true) {

        User.find( {googleId: payload["sub"]} )
        .exec()
        .then(user => {
          if (user.length >= 1) {
            return res.status(409).json({
              successful: false,
              message: 'Sign in with Google, account is already linked'
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: payload["email"],
              firstName: payload["given_name"],
              lastName: payload["family_name"],
              isGoogleAccountLinked: true,
              googleId: payload["sub"]
            });
            user
            .save()
            .then( result => {
              res.status(201).json({
                user: result,
                message: 'account successfuly created and linked with google account',
              });
    
            })
            .catch(err=> {
              console.log(err);
              res.status(500).json({
                error: err
              });
        
            });
          }

        })
        .catch(err=> {
          console.log(err);
          res.status(500).json({
            error: err
          });
    
        });
        
      } else {
        res.status(401).json({
          error: "token could not be verified",
          payload: payload
        });
      }
    })
    .catch(err=> {
      console.log(err);
      res.status(500).json({
        error: err
      });

    });

});



router.post('/login/:token', (req, res, next) => {

  const token = req.params.token;
  client
    .verifyIdToken({idToken: token,audience: process.env.CLIENT_ID})
    .then( ticket => {
      const payload = ticket.getPayload();
      // payload["aud"].localeCompare(process.env.CLIENT_ID)
      if(true) {
        User.find( {googleId: payload["sub"]} )
        .exec()
        .then(user => {
          if (user.length < 1) {
            return res.status(409).json({
              successful: false,
              message: 'Sign up with Google, account is not linked'
            });
          } else {
            return res.status(200).json({
              user: user[0]
            });
          }
        })
        .catch(err => {
          console.log(err);

          return res.status(500).json({
            successful: false,
            error: err
          });
        });

      } else {
        res.status(401).json({
          error: "token could not be verified",
          payload: payload
        });
      }

    })
    .catch(err => {
      console.log(err);

      return res.status(500).json({
        successful: false,
        error: err
      });
    });

});

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
              user: user[0],
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


router.patch('/pic/:userId', uploads.single('avatar'), (req, res, next) => { 
  // delete current profile pic

  User
  .find({_id: req.params.userId})
  .then( user => {

    // delete old profile pic
    var old= user[0]["avatar"].replace('https://food-tracker-api-storage.s3.us-east-2.amazonaws.com/', '');
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

    // update profile pic url
    var url = 'https://food-tracker-api-storage.s3.us-east-2.amazonaws.com/' + req.file.key;
    User
    .update({_id: req.params.userId}, {$set: { avatar: url }})
    .exec()
    .then(result => {

      User.findById( req.params.userId)
      .select()
      .exec()
      .then(doc => {
          res.status(200).json({
            user: doc
        });

      })
      // .catch(err => {
      //   console.log(err);
      //   res.status(500).json({error : err})
      // });

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
  });

});

router.patch('/:userId', ( req, res, next ) => {
  const id = req.params.userId;
  const updateOps = {};

  for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
  }

  User
      .update({_id: id}, { $set: updateOps})
      .exec()
      .then(result => {

        User.findById( id )
        .select()
        .exec()
        .then(doc => {
            res.status(200).json({
              user: doc
          });

        })
        .catch(err => {
          console.log(err);
          res.status(500).json({error : err})
        });
      })
      .catch(err => {
          console.log(err);
          res.status(500).json({
          successful: false,
          error: err
          });
  });
});
//export such that module can be used in other files
module.exports = router;
