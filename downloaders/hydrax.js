const axios = require("axios").default;
const cloudflareScraper = require('cloudflare-scraper');
const HydraX_Base = "https://playhydrax.com/?v=";
const fs = require("fs");
const ProgressBar = require('progress')

///<reference path="../types.js" />

/**
 * @typedef {Object} CDNResponse
 * @property {boolean} status
 * @property {string} url
 * @property {string[]} sources
 * @property {boolean} isCdn
 * @property {boolean} isHls
 * @property {string} ads
 */

/**
 * Resolves slug
 * @param {string} url 
 */
async function resolveSlug(url) {
    var response = await cloudflareScraper.get(url);
    fs.writeFileSync("./a.html", response);
    var sliced = response.slice(response.indexOf(HydraX_Base));
    return sliced.slice(HydraX_Base.length, sliced.indexOf('"'));
}

/**
 * Fixes/Decodes the responses from ping.idocdn.com
 * @param {CDNResponse} obj
 * @return {CDNResponse}
 */
function decodeCDNResponse(obj) {
    obj.url = Buffer.from(obj.url.charAt(obj.url.length - 1) + obj.url.slice(0, -1), 'base64').toString('utf-8');
    return obj;
}

/**
 * @param {AnimeEpisode} episode 
 * @param {string} path Path to save video
 */
async function download(episode, path) {
    var link = episode.url + "&s=hydrax";
    var slug = await resolveSlug(link);
    console.log("Slug obtained: " + slug);
    var response = await axios.post("https://ping.idocdn.com", "slug=" + encodeURIComponent(slug) /* dont bully me pls */, {
        responseType: "json"
    });
    var objResponse = decodeCDNResponse(response.data);
    console.log("Obtained download URL: " + objResponse.url);
    response = await axios.get("https://www." + objResponse.url, {
        headers: {
            "Referer": HydraX_Base + slug
        },
        responseType: "stream"
    });
    const writer = fs.createWriteStream(path);
    let totalLength = response.headers['content-length'];
    let progressBar = new ProgressBar("-> downloading [:bar] :percent :etas", {
        width: 40,
        complete: "=",
        incomplete: " ",
        renderThrottle: 1,
        total: parseInt(totalLength)
    })
    return new Promise((resolve, reject) => {
        response.data.on('data', chunk => progressBar.tick(chunk.length));
        response.data.pipe(writer);
        let error = null;
        writer.on('error', err => {
            error = err;
            writer.close();
            reject(err);
        });
        writer.on('close', () => {
            if (!error) {
                resolve(true);
            }
            //no need to call the reject here, as it will have been called in the
            //'error' stream;
        });
    })
}
module.exports = download;