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
  let PopularCharacters = []
  for(let i = 0; i < Populars.length; i++){
    const data = await filterArray({name: Populars[i]});
    PopularCharacters.push(data[0]);
  }


  res.json({
    count: PopularCharacters.length,
    data: PopularCharacters
  });
});

router.get('/random', async (req, res) =>{
  const data = await filterArray(null);

  const limit = (req.query.limit != undefined) ? req.query.limit : 1;
  const img = (req.query.image != undefined) ? req.query.image : false;

  let randomCharacters = [];

  for(i = 0; i < limit; i++){
    let ind = Math.floor(Math.random() * data.length);
    if(img){
      while(data[ind].image == undefined){
        ind = Math.floor(Math.random() * data.length);
      }
      randomCharacters.push(data[ind]);
    }else randomCharacters.push(data[ind]);
   
  }

  res.json({
    count: randomCharacters.length,
    data: randomCharacters
  });
});
module.exports = router;
