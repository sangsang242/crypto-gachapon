require('dotenv').config({ path: '../.env' })

const isset = require('isset');
const Web3 = require('web3');
const logger = require('../core/lib/logger')(getDate() + '-sync');
const mongoose = require('mongoose');
const Abi = require('../core/models/Abi');
const Option = require('../core/models/Option');
const Table = require('../core/models/GameTable');
const EventLog = require('../core/models/EventLog');

const socket = require('socket.io-client')(
    process.env.SOCKET_HOST + process.env.SOCKET_PORT + '/numberbet');

function getDate() {
    var dateObj = new Date();
    var year = dateObj.getUTCFullYear();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();

    return year + '' + month + '' + day;
}

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

    provider.on('end', () => nodeConnect(providerUrl));
    provider.on('error', () => nodeConnect(providerUrl));

    web3.setProvider(provider);
    logger.info('New Web3 Provider Initiated');

    return web3;
}

function getAbi(web3Obj) {
    const contractName = process.env.CONTRACT_NAME;

    const compiledAbi = require('../core/lib/solCompiler')(contractName);
    updateAbi(compiledAbi);

    const MyContract = new web3Obj.eth.Contract(compiledAbi, process.env.CONTRACT_ADDRESS);

    return Promise.resolve(MyContract);
}

async function updateAbi(compiledAbi) {
    const currentData = await Abi.findById(process.env.CONTRACT_ADDRESS);
    logger.info('Current ABI Data : ' + JSON.stringify(currentData));

    if (currentData) {
        currentData.abi = compiledAbi;
        const savedData = await currentData.save();
        logger.info('ABI Update Result : ' + JSON.stringify(savedData));
    } else {
        const newData = new Abi({
            _id: process.env.CONTRACT_ADDRESS,
            abi: compiledAbi
        });
        const savedData = await newData.save();
        logger.info('ABI Insert Result : ' + JSON.stringify(savedData));
    }
}

// Retrieve initial contract value
async function getInitialData(MyContract) {
    var optionData = await getOptionInfo(MyContract);
    await syncOption(optionData);

    var tableData = {};
    for (let index = 0; index < optionData.maxTable; index++) {
        tableData[index] = await getTableInfo(MyContract, index);
    }
    await syncTable(tableData);

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

async function syncOption(optionData) {
    const currentData = await Option.findById(process.env.CONTRACT_ADDRESS);
    logger.info('Current Option Data : ' + JSON.stringify(currentData));

    if (currentData) {
        currentData.isPaused = optionData.isPaused;
        currentData.maxTable = optionData.maxTable;
        currentData.maxCase = optionData.maxCase;
        currentData.feeRate = optionData.feeRate;
        const savedData = await currentData.save();
        logger.info('syncOption Update Result : ' + JSON.stringify(savedData));
    } else {
        const newData = new Option({
            _id: process.env.CONTRACT_ADDRESS,
            isPaused: optionData.isPaused,
            maxTable: optionData.maxTable,
            maxCase: optionData.maxCase,
            feeRate: optionData.feeRate,
        });
        const savedData = await newData.save();
        logger.info('syncOption Insert Result : ' + JSON.stringify(savedData));
    }
}

async function syncTable(tableData) {
    for (var tableIndex in tableData) {
        const currentData = await Table.findById(tableIndex);
        logger.info('Current Table Data : ' + JSON.stringify(currentData));

        if (currentData) {
            currentData.status = getTableStatus(tableData[tableIndex]);
            currentData.maker = tableData[tableIndex].maker;
            currentData.deposit = tableData[tableIndex].deposit;
            currentData.hashedNum = tableData[tableIndex].hashedNum;
            currentData.allowedTime = tableData[tableIndex].allowedTime;
            currentData.taker = tableData[tableIndex].taker;
            currentData.payment = tableData[tableIndex].payment;
            currentData.guessedNum = tableData[tableIndex].guessedNum;
            currentData.takingTime = tableData[tableIndex].takingTime;
            const savedData = await currentData.save();
            logger.info('syncOption Update Result : ' + JSON.stringify(savedData));
        } else {
            var gameTable = tableData[tableIndex];
            gameTable._id = tableIndex;
            gameTable.status = getTableStatus(tableData[tableIndex]);
            const newData = new Table(gameTable);
            const savedData = await newData.save();
            logger.info('syncOption Insert Result : ' + JSON.stringify(savedData));
        }
    }
}

function subscribe(MyContract) {
    subscribeEvent(MyContract, 'OptionChanged', optionChanged);
    subscribeEvent(MyContract, 'TableChanged', tableChanged);
}

/** Event Handler */
async function optionChanged(MyContract) {
    var optionData = await getOptionInfo(MyContract);

    const currentData = await Option.findById(process.env.CONTRACT_ADDRESS);
    currentData.isPaused = optionData.isPaused;
    currentData.maxTable = optionData.maxTable;
    currentData.maxCase = optionData.maxCase;
    currentData.feeRate = optionData.feeRate;
    const savedData = await currentData.save();
    logger.info('Watched Event Update Result : ' + JSON.stringify(savedData));
}

async function tableChanged(MyContract, event) {
    const tableIndex = event.returnValues.tableIndex;
    const tableInfo = await getTableInfo(MyContract, tableIndex);
    logger.info('Watched Table Info : ' + JSON.stringify(tableInfo));

    const currentData = await Table.findById(tableIndex);

    currentData.status = getTableStatus(tableInfo);
    currentData.recentTx = event.transactionHash;
    currentData.recentTime = Math.ceil(new Date().getTime() / 1000);
    if (currentData.pendingTx != event.transactionHash) {
        logger.notice('Transaction Pending Missed : ' + JSON.stringify(event.transactionHash));
    }
    currentData.maker = tableInfo.maker;
    currentData.deposit = tableInfo.deposit;
    currentData.hashedNum = tableInfo.hashedNum;
    currentData.allowedTime = tableInfo.allowedTime;
    currentData.taker = tableInfo.taker;
    currentData.payment = tableInfo.payment;
    currentData.guessedNum = tableInfo.guessedNum;
    currentData.takingTime = tableInfo.takingTime;
    const savedData = await currentData.save();
    logger.info('Watched Event Update Result : ' + JSON.stringify(savedData));
}

async function logEvent(eventName, event) {
    logger.info(eventName + ' Watched : ' + JSON.stringify(event));

    const logData = new EventLog({
        _id: event.transactionHash,
        blockNumber: event.blockNumber,
        event: event.event,
        raw: event.raw,
        returnValues: event.returnValues
    });

    const savedData = await logData.save();
    logger.info('EventLog Insert Result : ' + JSON.stringify(savedData));
}

function subscribeEvent(MyContract, eventName, eventFunction) {
    logger.info(eventName + ' Event Subscription Start...');

    MyContract.events[eventName]({
        filter: { address: process.env.CONTRACT_ADDRESS },
    }, function (error, event) {
        logger.info('----------------------------------------');
        logEvent(eventName, event)
        eventFunction(MyContract, event)
    })
        .on('changed', function (event) {
            logger.info(event);
        })
        .on('error', function (error) {
            logger.info(error);
        })
}

function getTableStatus(table) {
    var tableStatus = '';

    if (!table || table.deposit == 0) {
        tableStatus = 'empty';
    } else if (table.payment == 0) {
        tableStatus = 'half';
    } else {
        tableStatus = 'full';
    }

    return tableStatus;
}

logger.info('========================================');
logger.info('Fetch Contract Start...');

connect('wss://' + process.env.INFURA_ENDPOINT)
    .then(getAbi)
    .then(getInitialData)
    .then(subscribe)

