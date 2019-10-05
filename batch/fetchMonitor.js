require('dotenv').config();

const isset = require('isset');
const Web3 = require('web3');
const logger = require('./lib/logger')('sync');

/**
 * Refreshes provider instance and attaches even handlers to it
 */
function connect(providerUrl) {
    var web3 = new Web3();

    const provider = new Web3.providers.WebsocketProvider(providerUrl);

    provider.on('end', () => retry());
    provider.on('error', () => retry());

    web3.setProvider(provider);

    logger.info('New Web3 provider initiated');

    return Promise.resolve(web3);
}

function getAbi(web3Obj) {
    const contractName = process.env.CONTRACT_NAME;

    const compiledAbi = require('./lib/solCompiler')(contractName);
    const MyContract = new web3Obj.eth.Contract(compiledAbi, process.env.CONTRACT_ADDRESS);

    return Promise.resolve(MyContract);
}

// Retrieve initial contract value
function getInitialData(MyContract) {
    getOptionInfo(MyContract);
    getTableInfo(MyContract);

    return Promise.resolve(MyContract);
}

function getOptionInfo(MyContract) {
    MyContract.methods.maxCase().call().then(console.log);

}

function getTableInfo(MyContract) {
    MyContract.methods.maxNumber().call().then(console.log);

}

function syncDatabase() {

}

function subscribe(MyContract) {
    subscribeEvent(MyContract, 'ContractChanged'); // todo event name changed
    subscribeEvent(MyContract, 'TableChanged'); // todo event name changed
}

function subscribeEvent(MyContract, eventName) {
    MyContract.events[eventName]({
        filter: { address: process.env.CONTRACT_ADDRESS },
    }, function (error, event) {
        getTableInfo(MyContract);

        console.log(event);
    })
        .on('changed', function (event) {
            logger.info(event);
        })
        .on('error', function (error) {
            logger.info(error);
        })
}

logger.info('Fetch Contract Start...');

connect('wss://' + process.env.INFURA_ENDPOINT)
    .then(getAbi)
    .then(getInitialData)
    .then(subscribe)



// 소켓 접속자 존재하면 pending on 없으면 off

// 메타마스크에서 sendTransacion 오면 retrive

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











// Scheduler for missed contract transaction
// 주기적인 컨트랙트 nonce 체크

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


