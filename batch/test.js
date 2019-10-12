var crypto = require("crypto");
var CryptoJS = require("crypto-js");

var Num = 1;
var Salt = 'apple';

// Encrypt
var hashedNum = crypto.createHash('sha256').update(Num + Salt).digest('hex');
 
console.log(hashedNum);

var hashNum2 = CryptoJS.SHA256(Num + Salt);
console.log(hashNum2.toString(CryptoJS.enc.Hex));
