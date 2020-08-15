const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const ora = require('ora');

const url = "https://naruto.fandom.com/wiki/Category:Characters";

const Characters = [];

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
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

    let temp = []
    let info = {};
    let category = "Personal"

    table.find('tr:contains(Personal)').nextUntil( "tr th span", "tr" ).each((i, element) => {
        
        const $element = $(element);

        if($element.find('td table').length !== 0) { //Toggle infos

            $element.find('td table').each((i, element) => {
                const $table = $(element)
                
                const toggle_category = $table.find('th.mainheader').text().trim()

                const toggle_data = $table.find('td').text().trim().replace(/<img.*>/g, '').replace(/\n+/g, ', ').replace(/  +/g, ' ').replace(/^ +/gm, '').replace(/\(No.*/g, '');
                
                info[toggle_category] = toggle_data;
            })
        }

        if($element.find('th.mainheader').length !== 0) {
            category = $element.find('th.mainheader').text().trim();
            return;
        }

        const key = $element.find('th').text().trim();
        let data = "";

        if(key == "Height" || key == "Weight") {
            let temp = "";
            let first = "";
            $element.find('td ul').each((i, element) => {
                first = $(element).find('li').html().trim().replace(/<.*>/g, '');
                temp += first + $(element).find('span:nth-child(1) > *').html() +"-"+ $(element).find('span:nth-child(2) > *').html() + ", "
            })

            data = temp.replace(/  +/g, ' ').replace(/.null/g, '').slice(0, -2)
        }else if(key == "Affiliation") {
            data = $element.find('td').text().trim().replace(/<img.*>/g, '').replace(/\n\n/g, ', ').replace(/".*/gs, '').replace(/.*svg/g, '').replace(/^ +/gm, '').replace(/  +/g, ' ');
        }else{
            data = $element.find('td').text().trim().replace(/<img.*>/g, '').replace(/^ +/gm, '').replace(/\n\n/g, ', ').replace(/\(No.*/g, '').replace(/  +/g, ' ');
        }
 

        if(info[category] === undefined) {
            info[category] = {};
            info[category][key] = data;
        }else{
            info[category][key] = data;
        }



         

        /*temp.push(($element.find('th.mainheader').html() != null) ? $element.find('th.mainheader').html().trim() : $element.find('th.mainheader').html());*/
    })

    /*j = 0;
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
                let temp = "";
                let first = "";
                $element.find('td ul').each((i, element) => {
                    first = $(element).find('li').html().trim().replace(/<.*>/g, '');
                    temp += first + $(element).find('span:nth-child(1) > *').html() +"-"+ $(element).find('span:nth-child(2) > *').html() + ", "
                })

                info[$element.find('th').text().trim()] = temp.replace(/  +/g, ' ').replace(/.null/g, '').slice(0, -2);
            }else{
                info[$element.find('th').text().trim()] = $element.find('td').text().trim()
                .replace(/<.*>/g, '')
                .replace(/\n\n/g, ',')
                .replace('(Forms)', '')
                .replace(/, *//*g, ', ')
                .replace(/\"(.*)/gs, '')
                .replace(/^\ /, '')
                .replace(/  +/g, ' ')
            }
        }
    })
    */
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

            Characters[i].personal = result;

            data.text = "Collected: " + i + " / " + Characters.length;

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


