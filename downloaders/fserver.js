const {
    JSDOM
} = require("jsdom");
const cloudflareScraper = require('cloudflare-scraper');
const axios = require("axios").default;

/**
 * @param {AnimeEpisode} episode 
 * @param {WritableStream} writeStream Stream to output into
 * @returns {ReadableStream}
 */
async function download(episode, writeStream, requestHeaders) {
    var response = await cloudflareScraper.get(episode.url);
    var dom = new JSDOM(response);
    var ctkStr = dom.window.document.getElementsByClassName("Votes")[0].children[0].textContent.slice("var ctk = '".length, -2);
    dom = null;
    response = await cloudflareScraper.post("https://kissanime.nz/ajax/anime/load_episodes_v2?s=fserver", {
        body: `episode_id=${episode.id}&ctk=${encodeURIComponent(ctkStr)}`,
        headers: {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        json: true
    });
    var iframeData = response.value;
    response = await cloudflareScraper.get(iframeData, {
        headers: {
            "referer": episode.url
        }
    });
    var segStart = response.indexOf("sources: ");
    var segEnd = response.indexOf("\n", segStart);
    var jsonData = JSON.parse(response.substring(segStart + "sources: ".length, segEnd - 1));
    response = null;

    var videoURL = jsonData[0].file;
    // ping the url to resolve the actual URL
    response = await axios.get(videoURL, {
        headers: {...{
            "referer": episode.url
        }, ...requestHeaders},
        responseType: "stream"
    });
    response.data.pipe(writeStream);
    return {
        headers: response.headers,
        stream: response.data,
    };
}
module.exports = download;