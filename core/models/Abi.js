const mongoose = require('mongoose')

const abi = mongoose.Schema({
    // contract address
    _id: {
        type: String,
        require: true,
        lowercase: true, 
        trim: true
    },
    abi: {
        type: Array,
        require: true,
    },
})

module.exports = mongoose.model('Abi', abi)