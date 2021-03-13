const fs = require('fs');
const path = require('path');

const root = path.dirname(require.main.filename || process.mainModule.filename);
let Characters;
try {
  if(fs.existsSync(root + '/scraper/Characters.json')) {
      Characters = require(root + '/scraper/Characters.json');
  } else {
    console.log('Could not find Characters.json! Creatinga new one in src/scraper/ directory...')

    fs.writeFileSync(root + '/scraper/Characters.json', "[]", err =>{
      console.log(err)
    })
    Characters = require(root + '/scraper/Characters.json');
  }
} catch (err) {
  console.error(err);
}

const Fuse = require('fuse.js')

async function filterArray(options = null) {
   if(options === null || options === undefined || options === '' || Object.keys(options).length === 0) return Characters;

    let args = []
    const fuse_options = {
        // isCaseSensitive: false,
        // includeScore: false,
        // shouldSort: true,
        // includeMatches: false,
        findAllMatches: false,
        // minMatchCharLength: 1,
        // location: 0,
        threshold: 0.3,
        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        keys: [
          "name",
          "personal.sex",
          "personal.affiliation"
        ]
      };
      for(option in options) {
          obj = {}
          if(typeof options[option] === "object") {
              for(val in  options[option]) {
                obj = {}
                const key = option + "." + val
                obj[key] = "'" + options[option][val]
                args.push(obj)
              }
          }else{
            obj[option] = "'" + options[option]
            args.push(obj)
          }        
      }
      
      const fuse = new Fuse(Characters, fuse_options);
      
      return await fuse.search({$and: args})

}

module.exports = {filterArray};