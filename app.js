const port = 5000;
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require( 'mongoose' );
const app = express();
// const multer = require('multer');
const userRoutes = require( './api/routes/user' );
// const Grid = require('gridfs-stream');
// const multer  = require('multer');
// const GridFSStorage = require('multer-gridfs-storage');
// upload = multer();
//connect database
mongoose.connect( 'mongodb+srv://user:rocha230067@jarvis-va6fr.mongodb.net/test?retryWrites=true&w=majority',
{
    useNewUrlParser: true,
    useUnifiedTopology: true
}
);


// create storage engine
// const storage = new GridFSStorage({db: connection});
// const upload = multer({ storage });

// Use default node.js promise implementation
mongoose.Promise = global.Promise;


app.use(morgan('dev'));
// parse urlencoded data
app.use(bodyParser.urlencoded({extended: false}));
// parse json data
app.use(bodyParser.json()) ;
// parse form data
// app.use(upload.array());

// preventing cors errors
app.use((req, res, next) => {
    // deals with cors, gives access to any client
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', '*');
        return res.status(200).json({});
    }
    // so other routes can take over
    next();
});

//request logger

app.use( '/user', userRoutes );

//error handling
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    //forwards error request
    next(error);
    });

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
        message : error.message
        }
    });
    });

module.exports = app;
