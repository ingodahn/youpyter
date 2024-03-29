/* Setting up youtube player */
var player;
let imgPath = youpyterPath + '/images/';

const buttonRow = `
<div>
<!--
    <div class="btn-group">
        <button id="play" type="button" class="btn btn-primary disabled" onClick="ytPlay()">Play</button>
        <button id="pause" type="button" class="btn btn-primary disabled" onClick="ytPause()">Pause</button>
        <button id="stop" type="button" class="btn btn-primary disabled" onClick="ytStop()">Stop</button>
        <button id="volup" type="button" class="btn btn-primary disabled" onClick="ytVolUp()">Vol Up</button>
        <button id="voldown" type="button" class="btn btn-primary disabled" onClick="ytVolDown()">Vol Down</button>
        <button id="mute" type="button" class="btn btn-primary disabled" onClick="ytMute()">Mute</button>
        <button id="speed" type="button" class="btn btn-primary disabled" onClick="ytSpeedUp()">Speed Up</button>
        <button id="slow" type="button" class="btn btn-primary disabled" onClick="ytSlowDown()">Slow Down</button>
    </div>
    -->
</div>
<div>
    <div id="player-container">
        <div id="player-div"></div>
    </div>
</div>
`;

function loadYtApi() {
    // This code loads the IFrame Player API code asynchronously. This is the Youtube-recommended script loading method
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Create youtube player (function called by YouTube API)
function onYouTubeIframeAPIReady() {
    player = new YT.Player("player-div", {
        width: data.video.width,
        videoId: data.video.videoId,
        height: data.video.height,
        playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            fs: 0,
            showinfo: 0,
            modestbranding: 1
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}
// Player ready handler. Sync content when player is ready
function onPlayerReady(event) {
    $('.btn').removeClass("disabled");
    syncTo(0)
    makeSageCells();
}


// Video state change handler.
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        setTimeout(checkTime, 200);
    }
}

var lastTime = 0;
function checkTime() {
    if (player.getPlayerState() != YT.PlayerState.PLAYING) {
        $('.playButton img').attr('src', imgPath + 'play.png');
        return;
    }
    $('.playButton img').attr('src', imgPath + 'pause.png');
    var currentTime = Math.floor(player.getCurrentTime());
    if (currentTime != lastTime) {
        if (data.breakpoints[currentTime]) {
            ytPause();
            syncTo(currentTime);
            document.getElementById('toc').selectedIndex = sectionIndex(currentTime);
            lastTime = currentTime;
        }
    }
    setTimeout(checkTime, 200);
}

function sectionIndex(time) {
    for (var i = 0; i < data.segments.length; i++) {
        if (data.segments[i].start <= time && time < data.segments[i].end) {
            return i;
        }
    }
    return -1;
}

function ytPlay() {
    player.playVideo();
}

function ytPause() {
    player.pauseVideo();
    $('.playButton img').attr('src', imgPath + '/play.png');}

function ytStop() { player.stopVideo(); }

function ytSpeedUp() {
    var rate = player.getPlaybackRate();
    player.setPlaybackRate(rate + 0.25);
}

function ytSlowDown() {
    var rate = player.getPlaybackRate();
    player.setPlaybackRate(rate - 0.25);
}

function ytMute() {
    if (player.isMuted()) {
        player.unMute();
        $('#mute').text('Mute');
    }
    else {
        player.mute();
        $('#mute').text('Unmute');
    }
}

function ytVolUp() {
    var volume = player.getVolume();
    if (volume <= 95) {
        player.setVolume(volume + 5);
    }
}

function ytVolDown() {
    var volume = player.getVolume();
    if (volume >= 5) {
        player.setVolume(volume - 5);
    }
}

function ytSeekTo(index) {
    var time = data.segments[index].start;
    player.seekTo(time, true);
    syncTo(time);
}

function makeYtPlayer() {
    $('#player-wrapper').html(buttonRow);
    loadYtApi();
    $('#player-nav').css('visibility', 'visible');
}

function playToggle() {
    if (player.getPlayerState() == YT.PlayerState.PLAYING) {
        ytPause();
        $('.playButton img').attr('src', imgPath + '/play.png');
    }
    else {
        ytPlay();
        $('.playButton img').attr('src', imgPath + 'pause.png');
    }
}

$(document).ready(function () {
    $('.playButton img').attr('src', imgPath + 'play.png');
})
// End youtube player setup

function playButton(i) {
    return '<button type="button" class="btn btn-primary playButton" onclick="playCell(' + i + ')"><image src="'+imgPath+'/play.png" width="20px"></button>';
}

function playCell(i) {
    let cell = data.segments[i];
    ytSeekTo(i);
    playToggle();
}
