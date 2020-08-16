const express = require('express');

const emojis = require('./emojis');

const Characters = require('../../Characters.json')

const router = express.Router();



router.get('/', (req, res) => {
  res.json({
    count: Characters.length,
    data: Characters
  });
});

module.exports = router;
