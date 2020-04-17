const express = require('express');
const router = express.Router();
const User = require( '../models/user' );
var bcrypt = require( 'bcryptjs' );
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const multer  = require('multer');
const GridFSStorage = require('multer-gridfs-storage');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // execute cb, pass potential error and path
    cb(null, path.join( '/food-tracker-api' + '/uploads/'));

  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});
// Grid.mongo = mongoose.mongo;
//connect database
// const connection = mongoose.connect( 'mongodb+srv://user:rocha230067@jarvis-va6fr.mongodb.net/test?retryWrites=true&w=majority',
// {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }
// );

const upload = multer({storage: storage, limits: {
  fileSize: 1024 * 1024 * 5
}});

// const upload = multer({dest: 'uploads/'});

// const storage = new GridFSStorage({db: connection});
// const upload = multer({ storage });


router.post('/signup', upload.single('avatar'), (req, res, next) => {

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
            const filePath = path.join(__dirname + '../../../uploads/' + req.file.filename );

            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              avatar: filePath,
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
