(function() {

    const defaultTitle = "Bachata Radio by DJ Doodlez";

    function decodeHTMLEntities(text) {
        if (!text) return '';
        var textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    function playerStarted() {
        if (!window.MY) return false;
        if (!MY.players) return false;
        if (!MY.players["my_player"]) return false;
        return MY.players["my_player"].started === 1;
    }

    function getSong(info) {
        if (!info || !info.songs || !info.songs.length) return "";
        const last = info.songs[info.songs.length - 1];
        if (Array.isArray(last)) return last[1] || "";
        if (last.song) return last.song;
        return "";
    }

    function parseSongInfo(fullTitle) {
        const parts = fullTitle.split(' - ');
        if (parts.length >= 2) {
            return {
                artist: parts[0],
                title: parts.slice(1).join(' - ')
            };
        }
        return {
            artist: '',
            title: fullTitle
        };
    }

    function updateCurrentSongLinks(songTitle, songEncode) {
        const linksBlock = document.getElementById('currentSongLinks');
        const titleElement = document.querySelector('.current-song-title');

        if (!songTitle || !playerStarted()) {
            linksBlock.style.display = 'none';
            return;
        }

        linksBlock.style.display = 'block';

        document.getElementById('youtubeLink').href = `https://www.youtube.com/results?search_query=${songEncode}`;
        document.getElementById('vkLink').href = `https://vk.com/search?c%5Bq%5D=${songEncode}&c%5Bsection%5D=audio`;
        document.getElementById('spotifyLink').href = `https://open.spotify.com/search/${songEncode}`;
    }

    function updateMediaSession(fullTitle) {
        if (!('mediaSession' in navigator)) return;

        const decodedTitle = decodeHTMLEntities(fullTitle);
        const { artist, title } = parseSongInfo(decodedTitle);

        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || "Bachata Radio",
            artist: artist || "Bachata Radio",
            album: "Bachata Radio",
            artwork: [
                {
                    src: "/img/cover.webp",
                    sizes: "512x512",
                    type: "image/webp"
                }
            ]
        });

        navigator.mediaSession.playbackState = playerStarted() ? "playing" : "paused";

        try {
            navigator.mediaSession.setActionHandler("play", function() {
                $.player_play("play");
            });

            navigator.mediaSession.setActionHandler("pause", function() {
                $.player_play("stop");
            });

            navigator.mediaSession.setActionHandler("previoustrack", null);
            navigator.mediaSession.setActionHandler("nexttrack", null);
            navigator.mediaSession.setActionHandler("seekbackward", null);
            navigator.mediaSession.setActionHandler("seekforward", null);

        } catch (e) {
            console.log("MediaSession handlers not supported", e);
        }
    }

    function updateTitle(info) {
        if (!playerStarted()) {
            document.title = defaultTitle;
            updateCurrentSongLinks('', '');
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = "paused";
            }
            return;
        }

        const song = getSong(info);
        if (!song) return;

        const decodedSong = decodeHTMLEntities(song);
        const songEncode = encodeURIComponent(decodedSong);

        updateCurrentSongLinks(decodedSong, songEncode);

        const parts = decodedSong.split(' - ');
        if (parts.length >= 2) {
            const artist = parts[0];
            const title = parts.slice(1).join(' - ');
            document.title = `${title} • ${artist}`;
        } else {
            document.title = decodedSong;
        }

        updateMediaSession(song);
    }

    function hookPlayer() {
        if (!window.MY) return;
        const original = MY.player_updateinfo;
        if (!original) return;

        MY.player_updateinfo = function(info) {
            updateTitle(info);
            return original.apply(this, arguments);
        };
    }

    function monitorStop() {
        setInterval(function() {
            if (!playerStarted()) {
                if (document.title !== defaultTitle) {
                    document.title = defaultTitle;
                }
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = "paused";
                }
            }
        }, 1000);
    }

    document.addEventListener("DOMContentLoaded", function() {
        document.title = defaultTitle;

        const wait = setInterval(function() {
            if (window.MY && MY.player_updateinfo) {
                clearInterval(wait);
                hookPlayer();
                monitorStop();
            }
        }, 200);
    });

})();