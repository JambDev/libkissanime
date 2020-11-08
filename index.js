///<reference path="./types.js" />

module.exports = {
    Downloaders: require("./downloaders"),
    query: require("./info").query,
    searchAnime: require("./info").searchAnime,
    searchSuggest: require("./info").searchSuggest,
    
    /**
     * 
     * @param {AnimeEpisode} episode 
     * @param {WritableStream} stream 
     * @param {"fserver"} downloader 
     * @returns {ReadableStream}
     */
    download: function(episode, stream, requestHeaders = {}, downloader = "fserver") {
        if(!(downloader in this.Downloaders))
            throw "invalid downloader";
        return this.Downloaders[downloader](episode, stream, requestHeaders);
    }
};