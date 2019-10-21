var express = require('express');
var router = express.Router();
const Option = require('../../core/models/Option');
const Table = require('../../core/models/GameTable');
const Abi = require('../../core/models/Abi');

/* GET users listing. */
router.get('/', async function(req, res, next) {
  const options = await Option.findById(process.env.CONTRACT_ADDRESS);
  const abi = await Abi.findById(process.env.CONTRACT_ADDRESS);
  const tables = await Table.find({});

  res.render('numberbet', {
    options: options,
    abi: abi ? JSON.stringify(abi.toJSON().abi) : {},
    tables: tables,
  });
});

module.exports = router;
