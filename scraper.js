const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");

const url = "https://naruto.fandom.com/wiki/Category:Characters";

async function getLetters() {
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
}

async function additionalInfo(link) {
    const {data} = await axios.get(link);
    let $ = cheerio.load(data);

    const table = $('table.infobox.box');

    let temp = []

    table.find('tr').each((i, element) => {
        
        const $element = $(element);

        temp.push(($element.find('th.mainheader').html() != null) ? $element.find('th.mainheader').html().trim() : $element.find('th.mainheader').html());
    })

    j = 0;
    for (let i = temp.indexOf("Personal") + 1; i < temp.length; i++) {
        if(temp[i] == null) {
            j++
        }else break;
    }
    const personal_start = temp.indexOf("Personal");
    const personal_count = j + 1;

    let info = {};

    table.find('tr').each((i, element) => {
        const $element = $(element);
        if(i > personal_start && i < (personal_start + personal_count)) {
            const open_tag =  $element.find('td').text().indexOf("<") + 1
            if($element.find('th').text().trim() == "Height" || $element.find('th').text().trim() == "Weight") {
                info[$element.find('th').text().trim()] = $element.find('td li span span').text()
            }else{
                info[$element.find('th').text().trim()] = $element.find('td').text().trim()
                .replace(/<.*>/g, '')
                .replace(/\n\n/g, ',')
                .replace('(Forms)', '')
                .replace(/, */g, ', ')
                .replace(/\"(.*)/gs, '')
                .replace(/^\ /, '')
            }
        }
    })
    return info;
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function getCharacters() {
    console.log("Scraping characters, it may take a while...")
    let char_count = 1;
    const letters = await getLetters(); //0-26

    const Characters = [];
    for (let i = 0; i <= letters.length; i++) {
        const url_alph = url + "?from=" + letters[i];
        
        const {data} = await axios.get(url_alph);
        const $ = cheerio.load(data);
        
        const ul = (i != (letters.length - 1)) ? $('div.category-page__members ul').first() : $('div.category-page__members');
        
        ul.find('a.category-page__member-link').each(async (i, element) => {
            const $element = $(element);
            await sleep(1000)
            additionalInfo("https://naruto.fandom.com" + $element.attr('href'))
            .then(res => {
                const character = {
                    profile_link: "https://naruto.fandom.com" + $element.attr('href'),
                    name: $element.text(),
                    personal: res
                };
                Characters.push(character)

                char_count++;
            })
            .catch(err => console.log(err));
        });   
    }

    fs.writeFileSync("Characters.json", JSON.stringify(Characters, null, 4), (err) => {
        if(err) console.log.log(err)
        return true
    });
}

if(fs.existsSync("Characters.json")) {
    if(process.argv[2] == "-y") {
        console.log("Refreshing Characters.js...")

        getCharacters().then(res => { console.log("Done!"); process.exit(0) }).catch(err => { console.log(err); process.exit(0) })
    }else{
        console.log("Characters are saved in 'Characters.json', if you want to refresh the whole, run 'node scraper.js -y'.")

        process.exit(0);
    }
}else{
    console.log("Setting up Characters for usage...")

    getCharacters().then(res => { console.log("Done!"); process.exit(0) }).catch(err => { console.log(err); process.exit(0) })
}

