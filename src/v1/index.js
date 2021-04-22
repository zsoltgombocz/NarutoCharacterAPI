const express = require('express');
const functions = require('./functions.js');

const file = require('../file.js');

let Characters = (file.checkFile('scraper/Characters.json', true))? require(file.getRoot() + '/scraper/Characters.json') : process.exit(0);
let Populars = (file.checkFile('scraper/Populars.json', true))? require(file.getRoot() + '/scraper/Populars.json') : process.exit(0);

const {filterArray} = require('./filter');
const { contentSecurityPolicy } = require('helmet');

const router = express.Router();

router.get('/', async (req, res) => {
  const data = await filterArray(req.query);
  
  res.json({
    count: data.length,
    data: data
  });
});

router.get('/populars', async (req, res) => {

  let randomCharacters = functions.random(Populars, req.query)

  res.json({
    count: randomCharacters.length,
    data: randomCharacters
  });
});

router.get('/random', async (req, res) =>{

  let randomCharacters = functions.random(Characters, req.query)

  res.json({
    count: randomCharacters.length,
    data: randomCharacters
  });
});




module.exports = router;
