async function createSearchQuery(options = null) {
   if(options === null || options === undefined || options === '' || Object.keys(options).length === 0) return array;

    let constructedFilter = {};
    
    for (const option in options) {
      if(option === "personal.sex") {
        constructedFilter[option] = {$regex: `^${options[option]}$`, $options: 'i'};
        continue;
      }

      constructedFilter[option] = {$regex: options[option], $options: 'i'};
      
      
    }
    return constructedFilter;
      
      /*let data = [];
      console.log(req.params)
      await CharacterModel.find(req.query).cursor().
      on('data', function(doc) { data.push(doc) }).
      on('end', function() { 
        return data;  
      });  */

}

module.exports = {createSearchQuery};