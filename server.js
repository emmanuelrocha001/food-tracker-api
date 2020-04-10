const port = 5000;
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require( 'mongoose' );
const app = express();

const userRoutes = require( './api/routes/user' );

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
//extract json and urlencoded data
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json()) ;

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

app.get('/', (req, res) => res.send('foodpal backend'));
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));


