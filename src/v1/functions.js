const random = (array, query) => {
    let randomCharacters = []

    let limit = (query.limit != undefined) ? query.limit : 1;
    let image = (query.image != undefined) ? true : false;

    limit = (limit > array.length) ? array.length : limit;

    for(i = 0; i < limit; i++){
        let ind = Math.floor(Math.random() * array.length);
        if(image){
            while(array[ind].image == undefined){
                ind = Math.floor(Math.random() * array.length);
            }
            randomCharacters.push(array[ind]);
        }else randomCharacters.push(array[ind]);
    }

    return randomCharacters;
}

module.exports = {
    random
};
  