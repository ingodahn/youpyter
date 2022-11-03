function readURL(input) {
    if (input.files && input.files[0]) {

        var reader = new FileReader();

        reader.onload = function (e) {
            $('.file-upload').hide();
            var nbString = e.target.result;
            activate(nbString)
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        alert('Could not upload file');
    }
}

var breakpoints = new Set();
var segments = [];
var nbCells = [];
var endTime = 1000000;
var kernel = 'sage'
var evaluatedCells = [];

function activate(nbString) {
    try {
        $('.file-upload').remove();
        var nb = JSON.parse(atob(nbString.split(',')[1]));
        kernel = nb.metadata.kernelspec.name;
        if (kernel.includes('sage')) {
            kernel = 'sage';
        }

        for (var i = 0; i < nb.cells.length; i++) {
            var cell = nb.cells[i];
            if (cell.cell_type == "code") {
                $('#notebook-wrapper').append(makeCodeCell(cell, i));
            } else {
                let mdcell = makeMarkdownCell(cell, i);
                if (mdcell) $('#notebook-wrapper').append(mdcell);
            }
        }
        window.MathJax.typeset();
    } catch (error) {
        $('#main').append("<p>Error: " + error + "</p>");
    }
}

function makeCodeCell(cell, i) {
    var code = (cell.source) ? cell.source.join('') : "";
    var cellDiv = $('<div class="cell" id="cell' + i + '"></div>');
    cellDiv.append('<div class="cell-input">' + sageCell(code) + '</div>');
    addCell(cell, i);
    $('#calcNext').css('visibility', 'visible');
    return cellDiv;
}

function makeMarkdownCell(cell, i) {
    var mdContent = cell.source.join('');
    let isVideo = hasVideo(mdContent);
    if (isVideo) {
        var cellDiv = $('<div class="cell" id="cell' + i + '"></div>');
        cellDiv.append(buttonRow);
        cellDiv.append(makePlayer(isVideo.id, isVideo.width, isVideo.height));
        getSections(mdContent);
        loadYtApi();
        $('#player-wrapper').append(cellDiv);
        $('#toc').css('visibility', 'visible');
        return null;
    } else {
        var md = new Remarkable({ html: true, breaks: true, linkify: true });
        var html = md.render(mdContent);
        var cellDiv = $('<div class="cell row" id="cell' + i + '"></div>');
        cellDiv.append('<div class="cell-input">' + html + '</div>');
        addCell(cell, i);
        return cellDiv;
    }
}

function ytPlay() {
    player.playVideo();
}

function ytPause() { player.pauseVideo(); }

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
    var time = segments[index].start;
    console.log('seeking to ', time);
    player.seekTo(time, true);
    syncTo(time);
}

/* The video cell must have an embedded youtube video. */

function hasVideo(mdContent) {
    let reId = /\"https:\/\/www.youtube.com\/embed\/([^\"]*)\"/mg;
    let match = reId.exec(mdContent);
    if (match) {
        let ytId = match[1];
        let reWidth = /width=\"([^\"]*)\"/mg;
        let matchWidth = reWidth.exec(mdContent);
        let width = 640;
        if (matchWidth) {
            width = matchWidth[1];
        }
        let reHeight = /height=\"([^\"]*)\"/mg;
        let matchHeight = reHeight.exec(mdContent);
        let height = 480;
        if (matchHeight) {
            height = matchHeight[1];
        }
        let vpars = { id: ytId, width: width, height: height };
        return vpars;
    } else return null;

}

function getSections(cell) {
    let cellLines = cell.split('\n');
    for (let i = 0; i < cellLines.length; i++) {
        let line = cellLines[i];
        let re = /\|\s*([^\|]*)\s*\|\s*([^\|]*)\s*\|\s*([^\|]*)\s*\|\s*([^\|]*)\s*\|/mg;
        let match = re.exec(line);
        if (match) {
            if (match[0].indexOf(':') >= 0) {
                let section = { title: match[3].trim(), start: time2sec(match[1].trim()), end: time2sec(match[2].trim()), id: match[4].trim() };
                segments.push(section);
                breakpoints.add(section.start);
                breakpoints.add(section.end);
                $('#toc').append('<option value="' + section.start + '">' + section.title + '</option>');
            }
        }
    }
}

function time2sec(time) {
    let t = time.split(':'), minutes = +t[0], seconds = +t[1];
    return minutes * 60 + seconds;
}

function addCell(cell, i) {
    if (cell.metadata && cell.metadata.in) {
        let cellSectionId = cell.metadata.in;
        let cellSection = segments.find(s => s.id == cellSectionId);
        nbCells.push({ content: "cell" + i, start: cellSection.start, end: cellSection.end, cellType: cell.cell_type, cellEvaluated: false });
    }
}

function sageCell(code) {
    return '<div class="compute"><script type="text/x-sage">' + code + '</script></div>';
}

function makeSageCells() {
    sagecell.makeSagecell({
        inputLocation: ".compute",
        linked: true,
        language: kernel,
        callback: () => {
            $('.sagecell_evalButton').click(function () {
                let node = this.parentNode.parentNode.parentNode.parentNode;
                let cell = node.id;
                //nbCells.find(c => c.content == cell).cellEvaluated = true;
                let cei = nbCells.findIndex(c => c.content == cell);
                nbCells[cei].cellEvaluated = true;
                checkEvaluated()
            })
        },
        /*
        inputLocation: ".sagecell",
        template: sagecell.templates.minimal,
        evalButtonText: "Run",
        linked: true,
        hide: ['permalink', 'embed', 'restart', 'interrupt', 'save', 'load', 'share', 'help', 'feedback', 'language', 'edit', 'print', 'autosave', 'autosave', 'autosave'],
        autoeval: false,
        autoevaldelay: 1000,
        autoupdate: 1000,
        language: "sage",
        usecodemirror: true,
        codemirroroptions: {
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            mode: "text/x-sage",
            theme: "solarized dark"
        },
        usepython3: true,
        //useSageMathCloud: false,
        //useSageMath: true,
        useMathJax: true,
        mathJaxURL: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML",
        mathJaxConfig: "TeX-AMS-MML_HTMLorMML",
        mathJaxCDN: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/",
        useMathJaXLocal: false,
        useMathJaXLocalCDN: false,
        mathJaXLocalCDN: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/",
        mathJaXLocal: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML",
        mathJaXLocalConfig: "TeX-AMS-MML_HTMLorMML",
        useMathJaXLocalCDN: false,
        useMathJaXLocal: false,
        useMathJaXLocalCDN: false,
        mathJaXLocalCDN: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/",
        mathJaXLocal: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML",
        mathJaXLocalConfig: "TeX-AMS-MML_HTMLorMML"
        */
    });
}

function checkEvaluated() {
    let evaluable = null;
    $('.cell').removeClass(['evaluated', 'evaluable', 'notEvaluated']);
    for (let i = 0; i < nbCells.length; i++) {
        if (nbCells[i].cellType == 'code') {
            if (nbCells[i].cellEvaluated) {
                $('#' + nbCells[i].content).addClass('evaluated');
            } else {

                if (evaluable == null) {
                    evaluable = nbCells[i].content;
                    $('#' + evaluable).addClass('evaluable');
                } else {
                    $('#' + nbCells[i].content).addClass('notEvaluated');
                }
            }
        }
    }
    if (evaluable) {
        $('#calcNext').prop('disabled', false);
    } else {
        $('#calcNext').prop('disabled', true);
    }
    return evaluable;
}

function calcNext() {
    let nextTime = null;
    for (let i = 0; i < nbCells.length; i++) {
        if (nbCells[i].cellType == 'code') {
            if (!nbCells[i].cellEvaluated) {
                nextTime = nbCells[i].start;
                break;
            }
        }
    }
    player.seekTo(nextTime);
    syncTo(nextTime);
}
function evaluatedBefore(cellIndex) {
    let evalBefore = true, i = 0;
    while (i < nbCells.length) {
        let c = nbCells[i];
        if (c.content == cellIndex) break;
        if (c.cellType == 'code' && !c.cellEvaluated) {
            evalBefore = false;
            break;
        }
        i++;
    }
    return evalBefore;
}

/* Setting up youtube player */
var player;
var playerConfig = {
    width: 640,
    height: 480,
    videoId: '',
}
const buttonRow = `
<div class="row">
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
</div>
<div class="row">
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
        width: playerConfig.width,
        videoId: playerConfig.videoId,
        height: playerConfig.height,
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
    if (player.getPlayerState() != YT.PlayerState.PLAYING) return;
    var currentTime = Math.floor(player.getCurrentTime());
    if (currentTime != lastTime) {
        if (breakpoints.has(currentTime)) {
            console.log('260: ' + currentTime);
            ytPause();
            syncTo(currentTime);
            lastTime = currentTime;
        }
    }
    setTimeout(checkTime, 200);
}


// End youtube player setup
function makePlayer(id, width, height) {
    playerConfig.videoId = id;
    playerConfig.width = width;
    playerConfig.height = height;
}

function syncTo(time) {
    $('.cell').removeClass('current-cell');
    let firstcell = null;
    for (var i = 0; i < nbCells.length; i++) {
        if (time >= nbCells[i].start && time < nbCells[i].end) {
            let cname = '#' + nbCells[i].content;
            if (!firstcell) firstcell = cname;
            $(cname).addClass('current-cell');
        }
    }
    checkEvaluated();
    $(firstcell)[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}


