const express = require('express');

const {filterArray} = require('./filter');

const router = express.Router();

router.get('/', async (req, res) => {
  const data = await filterArray(req.query);

  res.json({
    count: data.length,
    data: data
  });


});

module.exports = router;
