const express = require('express');
const functions = require('./functions.js');

const {createSearchOptions} = require('./filter');
const { contentSecurityPolicy } = require('helmet');

const router = express.Router();

let CharacterModel = require('../database/models/Character')
let PopularModel = require('../database/models/Popular')

router.get('/:query', async (req, res) => {
  let data = [];
  const query = await createSearchOptions(req.params.query)

  await CharacterModel.find(query).cursor().
  on('data', function(doc) { data.push(doc) }).
  on('end', function() { 
    res.json({
      count: data.length,
      data: data
    });
  });
});

router.get('/populars', async (req, res) => {
  let data = [];
  let randomCharacters = [];
  await PopularModel.find().cursor().
  on('data', function(doc) { data.push(doc) }).
  on('end', function() { 
   randomCharacters = functions.random(data, req.query);

    res.json({
      count: randomCharacters.length,
      data: randomCharacters
    });
  });
});

router.get('/random', async (req, res) =>{
  let data = [];
  let randomCharacters = [];
  await CharacterModel.find().cursor().
  on('data', function(doc) { data.push(doc) }).
  on('end', function() { 
   randomCharacters = functions.random(data, req.query);

    res.json({
      count: randomCharacters.length,
      data: randomCharacters
    });
  });
});


module.exports = router;
