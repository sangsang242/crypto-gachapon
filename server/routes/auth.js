var express = require('express');
var router = express.Router();
var User = require('../models/User');

router.get('/users/:pubAddress', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.pubAddress);
    res.json(user);
  } catch (error) {
    res.json({message: error});
  }
});

router.post('/users', async (req, res, next) => {
  const user = new User({
    _id: req.body.pubAddress,
  });
  try {
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (error) {
    res.json({message: error});
  }
});

module.exports = router;
