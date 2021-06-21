const fs = require('fs');
const path = require('path');

const root = path.dirname(require.main.filename || process.mainModule.filename);

function checkFile(filename, create=false){
  const file = root + '/' + filename;
  
  if(fs.existsSync(file)) {
      return true
  }else{
      if(create){
          try {
            fs.writeFileSync(file, "[]", err =>{
              console.log('[FILE-ERROR]: ' + err)
            })
          }catch(err) {
            console.log('[FILE-ERROR]: ' + err)
          }
      }else{
        return false;
      }
  }
}

function getRoot(){
  return root;
}

module.exports = {
  checkFile,
  getRoot
}