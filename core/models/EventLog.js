const mongoose = require('mongoose')
const moment = require('moment-timezone');

const eventLog = mongoose.Schema({
    // transactionHash
    _id: {
        type: String,
        require: true,
        lowercase: true, 
        trim: true
    },
    time: {
        type: Date,
        require: true,
        default: moment.tz(Date.now(), "Asia/Seoul")
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
        default: {}
    },
    returnValues: {
        type: Array,
        default: {}
    },
})

module.exports = mongoose.model('EventLog', eventLog)