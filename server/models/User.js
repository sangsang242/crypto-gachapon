const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    // public address
    _id: {
        type: String,
        require: true,
        lowercase: true, 
        trim: true
    },
    // onetime random variable for signning purpose
    nonce: {
        type: Number,
        require: true,
        default: () => Math.floor(Math.random() * 1000000)
    },
    // edditable user name 
    username: {
        type: String,
        require: false
    }
})

module.exports = mongoose.model('User', userSchema)