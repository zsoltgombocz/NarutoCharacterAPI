const express = require('express');
const file = require('../file.js');
const Populars = require(file.getRoot() + '/scraper/Populars.json')

const {filterArray} = require('./filter');

const router = express.Router();

router.get('/', async (req, res) => {
  const data = await filterArray(req.query);

  res.json({
    count: data.length,
    data: data
  });
});

router.get('/populars', async (req, res) => {
  res.json({
    count: Populars.length,
    data: Populars
  });
});

router.get('/random', async (req, res) =>{
  const data = await filterArray(null);

  const limit = (req.query.limit != undefined) ? req.query.limit : 1;
  let randomCharacters = [];

  for(i = 0; i < limit; i++){
    randomCharacters.push(data[Math.floor(Math.random() * data.length)]);
  }

  res.json({
    count: randomCharacters.length,
    data: randomCharacters
  });
});
module.exports = router;
