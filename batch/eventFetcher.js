require('dotenv').config();
const isset = require('isset');
const Web3 = require('web3');
const logger = require('./lib/logger')('sync');
var mongoose = require('mongoose');
var ContractData = require('./models/ContractData');
var EventLog = require('./models/EventLog');

/**
 * Refreshes provider instance and attaches even handlers to it
 */
async function connect(providerUrl) {
    await dbConnect();

    const web3 = await nodeConnect(providerUrl);
    return Promise.resolve(web3);
}

function dbConnect() {
    if (!process.env.DB_CONNECTION) {
        throw new Error('DB_CONNECTION env is NOT exist');
    }
    mongoose.connect(process.env.DB_CONNECTION,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        () =>
            logger.info('DB Connected'));
}

function nodeConnect(providerUrl) {
    var web3 = new Web3();

    const provider = new Web3.providers.WebsocketProvider(providerUrl);

    provider.on('end', () => retry());
    provider.on('error', () => retry());

    web3.setProvider(provider);
    logger.info('New Web3 Provider Initiated');
    
    return web3;
}

function getAbi(web3Obj) {
    const contractName = process.env.CONTRACT_NAME;

    const compiledAbi = require('./lib/solCompiler')(contractName);
    const MyContract = new web3Obj.eth.Contract(compiledAbi, process.env.CONTRACT_ADDRESS);

    return Promise.resolve(MyContract);
}

// Retrieve initial contract value
async function getInitialData(MyContract) {
    var contractData = await getOptionInfo(MyContract);

    var tables = {};
    for (let index = 0; index < contractData.maxTable; index++) {
        tables[index] = await getTableInfo(MyContract, index);
    }
    contractData.tables = tables;
    await syncDatabase(contractData);

    return Promise.resolve(MyContract);
}

async function getOptionInfo(MyContract) {
    const isPaused = await MyContract.methods.isPaused().call();
    const maxTable = await MyContract.methods.maxTable().call();
    const maxCase = await MyContract.methods.maxCase().call();
    const feeRate = await MyContract.methods.feeRate().call();

    return {
        isPaused: isPaused,
        maxTable: maxTable,
        maxCase: maxCase,
        feeRate: feeRate
    }
}

function getTableInfo(MyContract, tableIndex) {
    return MyContract.methods.tables(tableIndex).call();
}

async function syncDatabase(contractData) {
    const currentData = await ContractData.findById(process.env.CONTRACT_ADDRESS);
    logger.info('Current Contract Data : ' + JSON.stringify(currentData));

    if (currentData) {
        currentData.isPaused = contractData.isPaused;
        currentData.maxTable = contractData.maxTable;
        currentData.maxCase = contractData.maxCase;
        currentData.feeRate = contractData.feeRate;
        currentData.tables = contractData.tables;
        const savedData = await currentData.save();
        logger.info('syncDatabase Update Result : ' + JSON.stringify(savedData));

    } else {
        const newData = new ContractData({
            _id: process.env.CONTRACT_ADDRESS,
            isPaused: contractData.isPaused,
            maxTable: contractData.maxTable,
            maxCase: contractData.maxCase,
            feeRate: contractData.feeRate,
            tables: contractData.tables
        });

        const savedData = await newData.save();
        logger.info('syncDatabase Insert Result : ' + JSON.stringify(savedData));
    }

}

function subscribe(MyContract) {
    subscribeEvent(MyContract, 'ContractChanged', contractChanged); // todo event name changed
    // subscribeEvent(MyContract, 'TableChanged'); // todo event name changed
}

async function contractChanged(MyContract) {
    var contractData = await getOptionInfo(MyContract);

    const currentData = await ContractData.findById(process.env.CONTRACT_ADDRESS);
    currentData.isPaused = contractData.isPaused;
    currentData.maxTable = contractData.maxTable;
    currentData.maxCase = contractData.maxCase;
    currentData.feeRate = contractData.feeRate;
    const savedData = await currentData.save();
    logger.info('Watched Event Update Result : ' + JSON.stringify(savedData));
}

async function logEvent(eventName, event) {
    logger.info(eventName + ' Watched : ' + JSON.stringify(event));
    
    const logData = new EventLog({
        _id: event.transactionHash,
        blockNumber: event.blockNumber,
        event: event.event,
        raw: event.raw
    });

    const savedData = await logData.save();
    logger.info('EventLog Insert Result : ' + JSON.stringify(savedData));
} 

function subscribeEvent(MyContract, eventName, eventFunction) {
    logger.info(eventName + ' Event Subscription Start...');

    MyContract.events[eventName]({
        filter: { address: process.env.CONTRACT_ADDRESS },
    }, function (error, event) {
        logEvent(eventName, event)
        eventFunction(MyContract, eventName, event)
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

