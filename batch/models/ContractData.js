const mongoose = require('mongoose')

const contractData = mongoose.Schema({
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
    tables: {
        type: Array,
        default: []
    },

})

module.exports = mongoose.model('ContractData', contractData)