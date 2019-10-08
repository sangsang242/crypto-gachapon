var express = require('express');
var router = express.Router();
const Option = require('../../core/models/Option');
const Table = require('../../core/models/GameTable');

/* GET users listing. */
router.get('/', async function(req, res, next) {
  const gameOptions = await Option.findById(process.env.CONTRACT_ADDRESS);
  const gameTables = await Table.find({});

  console.log(gameOptions)
  console.log(gameTables)


  res.render('numberbet');
});

module.exports = router;
