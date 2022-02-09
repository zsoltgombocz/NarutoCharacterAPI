const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const ora = require('ora');

const url = "https://naruto.fandom.com/wiki/Category:Characters";

const popular_url = "https://naruto.fandom.com/wiki/Naruto_Character_Popularity_Polls";

const path = require('path');

const root = path.dirname(require.main.filename || process.mainModule.filename);

const Characters = [];

const CharactersModel = require('../database/models/Character');
const PopularsModel = require('../database/models/Popular');

require('../database/db');

async function asyncForEach(array, callback) {
    for (let index = 0; index <= array.length-1; index++) {
      await callback(array[index], index, array);
    }
  }

let Populars = [];

async function getLetters() {
    try {
        const {data} = await axios.get(url, {headers:{

        }});

        const $ = cheerio.load(data);

        const letters = [];

        const ul = $('ul.category-page__alphabet-shortcuts');

        ul.find('li a').each((i, element) => {
            const $element = $(element);
            letters.push($element.text());
        })
        letters[letters.length -1] = "%C2%A1";
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
    if(table.find('td.imagecell a').length > 1) { //Not only one image
        info['image'] = {};
        let imageCellDivs = table.find('td.imagecell div.tabber.wds-tabber > div');
        let imageTitles = [];
        for(let i = 0; i < imageCellDivs.length; i++) {
            if(i === 0) { //Image titles (clickable buttons)
                let titles = $(imageCellDivs).find('a');
                
                titles.each((i, link) => {
                    let text = $(link).text();
                    if(text !== ""){
                        imageTitles.push($(link).text());
                    }
                })
            }
        }

        table.find('td.imagecell div.wds-tab__content').each((i, div) => {
            let url = $(div).find('a').attr('href');
            info['image'][imageTitles[i]] = url.replace(/static/, 'vignette3');
        })
    }else{
        const url = table.find('td.imagecell a').attr('href');
        if(url != undefined){
            info['image'] = url.replace(/static/, 'vignette3');
        } 
    }

    let category = "personal"
    table.find('tr:contains(Personal)').nextUntil( "tr th span", "tr" ).each((i, element) => {
        
        const $element = $(element);

        if($element.find('td table').length !== 0) { //Toggle infos

            $element.find('td table').each((i, element) => {
                const $table = $(element);
                
                const toggle_category = $table.find('th.mainheader').text().trim().toLowerCase().replace(/ /, '_');

                const toggle_data = $table.find('td').text().trim()
                .replace(/<img.*>/g, '')
                .replace(/\n+/g, ', ')
                .replace(/  +/g, ' ')
                .replace(/^ +/gm, '')
                .replace(/\\n/g, ', ')
                .replace(/\(No.*/g, '');
                
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
            data = $element.find('td').text().trim().replace(/<img.*>/g, '').replace(/\n/g, ', ').replace(/\n\n/g, ', ').replace(/".*/gs, '').replace(/.*svg/g, '').replace(/^ +/gm, '').replace(/  +/g, ' ');
        }else{
            data = $element.find('td').text().trim().replace(/\n/g, ', ').replace(/<img.*>/g, '').replace(/^ +/gm, '').replace(/\n\n/g, ', ').replace(/\(No.*/g, '').replace(/  +/g, ' ');
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
    const letters = await getLetters(); //0-26
    let char_count = 1;
    let letter_index = 0;  

    let storedCharactersCount = await (await CharactersModel.find()).length;

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

    if(storedCharactersCount < (Characters.length-1) || storedCharactersCount == 0) {
        getMostPopularCharacters().then(res => {}).catch(err => { console.log(err); });

        console.log(Characters.length-1 + " character saved to memory!");

        console.log("Started collecting additional data, it take a little bit longer...")
        const data = ora("").start()
        await asyncForEach(Characters, async (character, i) => {

            try {
                const result = await additionalInfo(character.profile_link);

                Characters[i] = Object.assign(Characters[i], result);

                if(Populars.indexOf(Characters[i].name) > -1) {
                    let scrapedPopularCharacter = new PopularsModel(Characters[i]);
                    await scrapedPopularCharacter.save();
                }
                
                let scrapedCharacter = new CharactersModel(Characters[i]);
                await scrapedCharacter.save();

                data.text = "Collected: " + (i+1) + " / " + (Characters.length-1);

            } catch (error) {
                console.log(error);
            }
        });

        return "\n[SCRAPER]: All Character saved to the database!"
    }else return "\n[SCRAPER]: Everything is up to date!"

    
}

async function getMostPopularCharacters(){

    const {data} = await axios.get(popular_url);
    const $ = cheerio.load(data);
    const content = $('div#mw-content-text');

    let lists = [];
    
    content.find('ol').each((i, element) => {
        lists.push(element);
        
    })

    lists.splice(4,1);
    lists.splice(5,1);

    for(i = 0; i < lists.length; i++){
        $(lists[i]).find('li').each((i, element) => {
            let e = $(element).text().slice(0, $(element).text().indexOf("–")-1); // This char is not -, this is from the website, some special middle line.

            e = (e.includes("and")) ? e.slice(0, $(element).text().indexOf("and")-1) : e;

            e = (e.includes(",")) ? e.slice(0, $(element).text().indexOf(", ")-1) : e;

            e = e.replace(/ $/g, "")

            if(!Populars.includes(e)){
                Populars.push(e); 
            }
        })
    }
}

try{
    if(process.argv[2] == "reset") {
        console.log("[SCRAPER]: Reseting database, deleting all information...");

        CharactersModel.deleteMany({}).then(() => {
            console.log("[SCRAPER]: Characters deleted!");
        });

        PopularsModel.deleteMany({}).then(() => {
            console.log("[SCRAPER]: Popular characters deleted!");

            console.log("[SCRAPER]: Now you can run 'npm run scrape' in order to fill up the database again.")

            process.exit();
        });
    }else{
        getCharacters().then(res => { console.log(res); process.exit(0) }).catch(err => { console.log(err); process.exit(0) })
    }
}catch(err){
    console.log(err);
    process.exit();
}

