const mongoose = require('mongoose')

const option = mongoose.Schema({
    // contract address
    _id: {
        type: String,
        require: true,
        lowercase: true, 
        trim: true
    },
    isPaused: {
        type: Boolean,
        require: true,
    },
    maxTable: {
        type: Number,
        require: true,
    },
    maxCase: {
        type: Number,
        require: true,
    },
    feeRate: {
        type: Number,
        require: true,
    },
})

module.exports = mongoose.model('Option', option)