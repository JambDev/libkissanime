const {
    JSDOM
} = require("jsdom");
const configuration = require("./config");
const cloudflareScraper = require('cloudflare-scraper');
var KISSANIME_URL = configuration.url;

///<reference path="types.js" />

async function searchSuggest(keyword) {
    var response = await cloudflareScraper.get(`${KISSANIME_URL}/Search/SearchSuggest/?type=Anime&keyword=${encodeURIComponent(keyword)}`);
    var dom = new JSDOM(response);
    var animes = [];
    for (let elem of dom.window.document.body.children) {
        if (elem.id === "suggest-all")
            continue;
        animes.push({
            name: elem.textContent,
            id: elem.href.slice(elem.href.indexOf("Anime/") + "Anime/".length, -1)
        });
    }
    response = null;
    dom = null;
    return animes;
}

async function searchAnime(animeName) {
    var response = await cloudflareScraper.get(KISSANIME_URL + "/Search/?s=" + encodeURIComponent(animeName));
    var dom = new JSDOM(response);
    var elems = dom.window.document.getElementsByClassName("listing full");
    if (elems.length === 0)
        return [];
    var elem = elems[0];
    var animes = [];
    for (var i = 1; i < elem.children.length; i++) {
        var elem1 = elem.children[i];
        var aElem = elem1.firstElementChild.children[1].firstElementChild;
        animes.push({
            name: aElem.textContent,
            id: aElem.href.slice(aElem.href.indexOf("Anime/") + "Anime/".length, -1)
        });
    }
    response = null;
    dom = null;
    return animes;
}

/**
 * @param {string} animeID ID of anime to fetch
 * @returns {Promise<Anime>}
 */
async function query(animeID) {
    var response = await cloudflareScraper.get(KISSANIME_URL + "/Anime/" + animeID + "/");
    if (response.status === 302)
        throw "couldn't find anime";
    var dom = new JSDOM(response);
    var episodeTable = dom.window.document.getElementsByClassName("listing listing8515 full")[0];
    
    var animeObj = {
        episodes: [],
        name: dom.window.document.querySelector(".bigChar").textContent /* lmao */
    };
    for(var i = 1; i < episodeTable.children.length; i++) {
        var elem = episodeTable.children[i];
        var episodeData = elem.firstElementChild.firstElementChild.firstElementChild;
        var episodeObj = {
            name: episodeData.textContent.trim(),
            url: episodeData.href
        };
        episodeObj.id = parseInt(episodeObj.url.replace(/.*\D/g, ""));
        animeObj.episodes.push(episodeObj);
    }
    return animeObj;
}
module.exports = { query, searchAnime, searchSuggest };