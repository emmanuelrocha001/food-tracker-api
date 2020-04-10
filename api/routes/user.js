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
          User.find( {username: req.body.username } )
            .exec()
            .then( user => {

              if( user.length >= 1 ) {
                return res.status(409).json({
                  successful: false,
                  message: 'username is already linked to an existing account'
                });
              } else {

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
                      username: req.body.username,
                      password: hash
                    });

                    //status 201 when creating resource
                    user
                      .save()
                      .then( result => {
                        res.status(201).json({
                          successful: true,
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
      }
    });
});


//export such that module can be used in other files
module.exports = router;
