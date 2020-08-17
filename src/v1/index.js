const express = require('express');

const Characters = require('../../Characters.json')

const router = express.Router();



router.get('/', (req, res) => {
  res.json({
    count: Characters.length-1,
    data: Characters
  });
});

module.exports = router;
