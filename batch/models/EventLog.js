const mongoose = require('mongoose')

const eventLog = mongoose.Schema({
    // transactionHash
    _id: {
        type: String,
        require: true,
        lowercase: true, 
        trim: true
    },
    blockNumber: {
        type: Number,
        require: true,
    },
    event: {
        type: String,
        require: true,
    },
    raw: {
        type: Array,
        default: []
    },

})

module.exports = mongoose.model('EventLog', eventLog)