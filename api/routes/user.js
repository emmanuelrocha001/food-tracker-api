const express = require('express');
const router = express.Router();
const User = require( '../models/user' );
var bcrypt = require( 'bcryptjs' );
const mongoose = require('mongoose');

router.post('/signup', (req, res, next) => {

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

            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              firstName: req.body.firstName,
              lastName: req.body.lastName,
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
          message: 'Authentication failed, the email provided is not linked to an existing account.'
        });
      }
      else {
        bcrypt.compare( req.body.password, user[0].password, ( err, result) => {
          if ( result ) {
            return res.status(200).json({
              successful: true,
              user: {
                name: user[0].firstName,
                userId: user[0]._id,
                email: user[0].email
              },
              message: 'Authentication successful',
            });

          } else {
            return res.status(401).json({
              successful: false,
              message: 'Authentication failed, incorrect password.'
            });
          }
        });
      }
    });
});

//export such that module can be used in other files
module.exports = router;
