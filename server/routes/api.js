var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Abi = require('../../core/models/Abi');
var Table = require('../../core/models/GameTable');
var ethAddress = require('ethereum-address');
var ethUtil = require('ethereumjs-util');
var jwt = require('jsonwebtoken');

router.get('/gameTables/:tableIndex', async (req, res) => {
  try {
    const tableIndex = req.params.tableIndex;
    const tableData = await Table.findById(tableIndex);
    res.json(tableData);
  } catch (error) {
    res.json({ message: error.toString() });
  }
});

router.get('/abi/:contractAddr', async (req, res) => {
  try {
    const contractAddr = req.params.contractAddr.toLowerCase();
    if (!ethAddress.isAddress(contractAddr)) {
      throw new Error('Contract address is not valid');
    }
    const abi = await Abi.findById(contractAddr);
    res.json(abi);
  } catch (error) {
    res.json({ message: error.toString() });
  }
});

router.get('/users/:pubAddress', async (req, res) => {
  try {
    const pubAddress = req.params.pubAddress.toLowerCase();
    if (!ethAddress.isAddress(pubAddress)) {
      throw new Error('Your Ethereum address is not valid');
    }
    const user = await User.findById(pubAddress);
    res.json(user);
  } catch (error) {
    res.json({message: error.toString()});
  }
});

router.post('/users', async (req, res) => {
  try {
    const pubAddress = req.body.pubAddress.toLowerCase();
    if (!ethAddress.isAddress(pubAddress)) {
      throw new Error('Your Ethereum address is not valid');
    }
    const existUser = await User.findById(pubAddress);
    if (existUser) {
      throw new Error('User address is already exist');
    }
    const user = new User({
      _id: pubAddress,
    });
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (error) {
    res.json({ message: error.toString() });
  }
});

router.get('/signmsg', async (req, res) => {
  try {
    res.json(process.env.SIGNNING_MSG);
  } catch (error) {
    res.json({ message: error.toString() });
  }
});

router.post('/auth', async (req, res) => {
  try {
    const pubAddress = req.body.pubAddress.toLowerCase();
    const signature = req.body.signature;

    const user = await User.findById(pubAddress);

    var signningMsg = process.env.SIGNNING_MSG;
    signningMsg = signningMsg.replace('${pubAddress}', pubAddress).replace('${nonce}', user.nonce);
    
    const msgBuffer = ethUtil.toBuffer(signningMsg);
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const signatureBuffer = ethUtil.toBuffer(signature);
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
    const publicKey = ethUtil.ecrecover(
      msgHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s
    );
    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const address = ethUtil.bufferToHex(addressBuffer);

    if (address.toLowerCase() !== pubAddress.toLowerCase()) {
      return res
        .status(401)
        .json({ error: 'Signature verification failed' });
    }

    user.nonce = Math.floor(Math.random() * 10000);
    user.save();

    const token = jwt.sign({_id: pubAddress}, process.env.JWT_TOKEN);
    res.json(token);
  } catch (error) {
    res.json({ message: error.toString() });
  }
});

module.exports = router;
