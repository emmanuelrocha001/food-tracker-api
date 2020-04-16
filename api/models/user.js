const mongoose = require('mongoose');

// design object
// unique optimizes searching and indexing, aswell as performance
const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    firstName: {type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    profilePic: { type: String, required: true }

});

//constructor based on schema
module.exports = mongoose.model( 'User' , userSchema);