const port = 5000;
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require( 'mongoose' );
const app = express();
var cors = require('cors');




// routes
const userRoutes = require('./api/routes/user');
const searchRoutes = require('./api/routes/search');
const milestoneRoutes = require('./api/routes/milestone');


//connect database
mongoose.connect( 'mongodb+srv://user:rocha230067@jarvis-va6fr.mongodb.net/test?retryWrites=true&w=majority',
{
    useNewUrlParser: true,
    useUnifiedTopology: true
}
);


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
app.use(cors());
//request logger

app.use( '/user', userRoutes );
app.use('/milestone', milestoneRoutes);
app.use( '/search', searchRoutes);

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
