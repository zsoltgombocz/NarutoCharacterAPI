async function createSearchOptions(options = null) {
   if(options === null || options === undefined || options === '' || Object.keys(options).length === 0) return array;

    let arrayOfOptions = options.split('&');
    let constructedFilter = {};
    for(const option of arrayOfOptions) {
      
      if(option.includes("=")){
          const key = option.split("=")[0];
          const value = option.split("=")[1];
          constructedFilter[key] = {$regex: value, $options: 'i'}
      }
    }

    console.log(constructedFilter)

    return constructedFilter
      
      /*let data = [];
      console.log(req.params)
      await CharacterModel.find(req.query).cursor().
      on('data', function(doc) { data.push(doc) }).
      on('end', function() { 
        return data;  
      });  */

}

module.exports = {createSearchOptions};