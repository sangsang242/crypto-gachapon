require('dotenv').config({ path: '../.env' })

const socket = require('socket.io-client')(
    process.env.SOCKET_URL + '/numberbet');
    console.log(process.env.SOCKET_URL)
    socket.emit('socketTest', {
        msg: 'msg from local com'
    });
    console.log('11')

    // var crypto = require("crypto");
// var CryptoJS = require("crypto-js");

// var Num = 1;
// var Salt = 'apple';

// // Encrypt
// var hashedNum = crypto.createHash('sha256').update(Num + Salt).digest('hex');
 
// console.log(hashedNum);

// var hashNum2 = CryptoJS.SHA256(Num + Salt);
// console.log(hashNum2.toString(CryptoJS.enc.Hex));

// try {
//     //Sync pending transaction
//     var subscription = web3.eth.subscribe('pendingTransactions', function (error, pendingTxid) {
//         web3.eth.getTransaction(pendingTxid, function (error, tx) {
//             if (isset(tx)) {
//                 if (!isEmpty(tx.to) && tx.to === process.env.CONTRACT_ADDRESS) {
//                     console.log(tx);
//                 }
//             }
//         });
//     }).on("error", function(error){
//         console.error(error);
//     });
// } catch (error) {
//     console.log(error);
// }

// try {
//     var options = {
//         address: process.env.CONTRACT_ADDRESS
//         // address: '0xd363581C90cbbD11A85A4E31cc81505768846C95'
//     };

//     // Sync on-block transaction
//     var subscription = web3.eth.subscribe('logs', options, function(error, logs){
//         console.log('logs : ', logs);  
//         if (isset(logs)) {

//             // transactionHash:
//             // blockHash:
//             // blockNumber:

//             // web3.eth.getBlock(logs.blockNumber, function (error, block) {
//             //     console.log('block : ', block);
//             // });
//             // web3.eth.getTransaction(logs.transactionHash, function (error, transaction) {
//             //     if (isset(transaction)) {


//             //     }
//             //     console.log('transaction : ', transaction);
//             // });
//         }
//     }).on("error", function(error){
//         console.error(error);
//     });
// } catch (error) {
//     console.log(error);
// }