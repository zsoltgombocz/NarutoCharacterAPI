const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const ora = require('ora');

const url = "https://naruto.fandom.com/wiki/Category:Characters";

const Characters = [];

async function asyncForEach(array, callback) {
    for (let index = 0; index <= array.length-1; index++) {
      await callback(array[index], index, array);
    }
  }

async function getLetters() {
    try {
        const {data} = await axios.get(url);
        const $ = cheerio.load(data);

        const letters = [];

        const ul = $('ul.category-page__alphabet-shortcuts');

        ul.find('li a').each((i, element) => {
            const $element = $(element);
            letters.push($element.text());
        })
        letters[letters.length -1] = "¡";
        return letters.slice(1);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

async function additionalInfo(link) {
    const {data} = await axios.get(link);
    let $ = cheerio.load(data);

    const table = $('table.infobox.box');

    let info = {};


    if(table.find('td.imagecell div.tabbertab').length !== 0) { //Images
        info['image'] = {};
        table.find('td.imagecell div.tabbertab').each((i, element) => {
            const $element = $(element);

            const image_title = $element.attr('title');

            const url = $element.find('div div a').attr('href');

            info['image'][image_title.toLowerCase().replace(/ /, '_')] = url;

        })
    }else{
        info['image'] = table.find('td.imagecell a').attr('href');
    }

    let category = "personal"
    table.find('tr:contains(Personal)').nextUntil( "tr th span", "tr" ).each((i, element) => {
        
        const $element = $(element);

        if($element.find('td table').length !== 0) { //Toggle infos

            $element.find('td table').each((i, element) => {
                const $table = $(element);
                
                const toggle_category = $table.find('th.mainheader').text().trim().toLowerCase().replace(/ /, '_');

                const toggle_data = $table.find('td').text().trim().replace(/<img.*>/g, '').replace(/\n+/g, ', ').replace(/  +/g, ' ').replace(/^ +/gm, '').replace(/\(No.*/g, '');
                
                info[toggle_category] = toggle_data;
            })
        }

        if($element.find('th.mainheader').length !== 0) {
            category = $element.find('th.mainheader').text().trim().toLowerCase().replace(/ /, '_');
            return;
        }

        const key = $element.find('th').text().trim().toLowerCase();
        let data = "";

        if(key == "height" || key == "weight") {
            let temp = "";
            let first = "";
            $element.find('td ul').each((i, element) => {
                first = $(element).find('li').html().trim().replace(/<.*>/g, '');
                temp += first + $(element).find('span:nth-child(1) > *').html() +"-"+ $(element).find('span:nth-child(2) > *').html() + ", "
            })

            data = temp.replace(/  +/g, ' ').replace(/.null/g, '').slice(0, -2)
        }else if(key == "affiliation") {
            data = $element.find('td').text().trim().replace(/<img.*>/g, '').replace(/\n\n/g, ', ').replace(/".*/gs, '').replace(/.*svg/g, '').replace(/^ +/gm, '').replace(/  +/g, ' ');
        }else{
            data = $element.find('td').text().trim().replace(/<img.*>/g, '').replace(/^ +/gm, '').replace(/\n\n/g, ', ').replace(/\(No.*/g, '').replace(/  +/g, ' ');
        }
 

        if(info[category] === undefined) {
            info[category] = {};
            info[category][key.replace(/ /, '_')] = data;
        }else{
            info[category][key.replace(/ /, '_')] = data;
        }
    })

    return info;
}

async function getCharacters() {
    console.log("Scraping characters, it may take a while...")
    let char_count = 1;
    const letters = await getLetters(); //0-26

    let letter_index = 0;

    while(letter_index < letters.length) {
        const url_alph = url + "?from=" + letters[letter_index];
        try {
            const {data} = await axios.get(url_alph);
            const $ = cheerio.load(data);
        
            const ul = (letter_index != (letters.length - 1)) ? $('div.category-page__members ul').first() : $('div.category-page__members');
            
            ul.find('a.category-page__member-link').each((i, element) => {
                const $element = $(element);
                
                const character = {
                    profile_link: "https://naruto.fandom.com" + $element.attr('href'),
                    name: $element.text(),
                };
                Characters.push(character);
                char_count += 1;
            });

            letter_index++;

        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    console.log(Characters.length + " character saved to memory, while saving counted " + (char_count - 1) + "!");

    console.log("Started collecting additional data, it take a little bit longer...")
    const data = ora("").start()

    await asyncForEach(Characters, async (character, i) => {

        try {
            const result = await additionalInfo(character.profile_link)

            Characters[i] = Object.assign(Characters[i], result)

            data.text = "Collected: " + (i+1) + " / " + (Characters.length-1);

        } catch (error) {
            console.log(error)
        }
    });
   
    fs.writeFileSync("Characters.json", JSON.stringify(Characters, null, 4), (err) => {
        if(err) { console.log.log(err) }
    });

    return "\n All Character saved to Characters.json!"
}

if(fs.existsSync("Characters.json")) {
    if(process.argv[2] == "-y") {
        console.log("Refreshing Characters.json...")

        getCharacters().then(res => { console.log(res); process.exit(0) }).catch(err => { console.log(err); process.exit(0) })
    }else{
        console.log("Characters are saved in 'Characters.json', if you want to refresh the whole, run 'node scraper.js -y'.")

        process.exit(0);
    }
}else{
    console.log("Setting up Characters for usage...")

    getCharacters().then(res => { console.log(res); process.exit(0) }).catch(err => { console.log(err); process.exit(0) })
}


