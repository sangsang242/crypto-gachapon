const mongoose = require('mongoose')

const gameTable = mongoose.Schema({
    // table index
    _id: {
        type: Number,
        require: true,
        lowercase: true, 
        trim: true
    },
    maker: {
        type: String,
        require: true,
    },
    deposit: {
        type: Number,
        require: true,
    },
    hashedNum: {
        type: String,
        require: true,
    },
    allowedTime: {
        type: Number,
        require: true,
    },
    taker: {
        type: String,
        require: true,
    },
    payment: {
        type: Number,
        require: true,
    },
    guessedNum: {
        type: Number,
        require: true,
    },
    takingTime: {
        type: Number,
        require: true,
    },
})

module.exports = mongoose.model('GameTable', gameTable)