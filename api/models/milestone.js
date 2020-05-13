const mongoose = require('mongoose');

// design object
// unique optimizes searching and indexing, aswell as performance
const milestoneSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    weight: {type: Number, required: true, min:0, max: 2000},
    date: {type: Date, required: true},
    pic: {type: String, required: false}
});

//constructor based on schema
module.exports = mongoose.model( 'Milestone' , milestoneSchema); 