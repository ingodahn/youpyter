var player;const buttonRow='\n<div class="row">\n    <div class="btn-group">\n        <button id="play" type="button" class="btn btn-primary disabled" onClick="ytPlay()">Play</button>\n        <button id="pause" type="button" class="btn btn-primary disabled" onClick="ytPause()">Pause</button>\n        <button id="stop" type="button" class="btn btn-primary disabled" onClick="ytStop()">Stop</button>\n        <button id="volup" type="button" class="btn btn-primary disabled" onClick="ytVolUp()">Vol Up</button>\n        <button id="voldown" type="button" class="btn btn-primary disabled" onClick="ytVolDown()">Vol Down</button>\n        <button id="mute" type="button" class="btn btn-primary disabled" onClick="ytMute()">Mute</button>\n        <button id="speed" type="button" class="btn btn-primary disabled" onClick="ytSpeedUp()">Speed Up</button>\n        <button id="slow" type="button" class="btn btn-primary disabled" onClick="ytSlowDown()">Slow Down</button>\n    </div>\n</div>\n<div class="row">\n    <div id="player-container">\n        <div id="player-div"></div>\n    </div>\n</div>\n';function loadYtApi(){var t=document.createElement("script");t.src="https://www.youtube.com/iframe_api";var e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}function onYouTubeIframeAPIReady(){player=new YT.Player("player-div",{width:data.video.width,videoId:data.video.videoId,height:data.video.height,playerVars:{autoplay:0,controls:0,rel:0,fs:0,showinfo:0,modestbranding:1},events:{onReady:onPlayerReady,onStateChange:onPlayerStateChange}})}function onPlayerReady(t){$(".btn").removeClass("disabled"),syncTo(0),makeSageCells()}function onPlayerStateChange(t){t.data==YT.PlayerState.PLAYING&&setTimeout(checkTime,200)}var lastTime=0;function checkTime(){if(player.getPlayerState()==YT.PlayerState.PLAYING){var t=Math.floor(player.getCurrentTime());t!=lastTime&&data.breakpoints[t]&&(ytPause(),syncTo(t),document.getElementById("toc").selectedIndex=sectionIndex(t),lastTime=t),setTimeout(checkTime,200)}}function sectionIndex(t){for(var e=0;e<data.segments.length;e++)if(data.segments[e].start<=t&&t<data.segments[e].end)return e;return-1}function ytPlay(){player.playVideo()}function ytPause(){player.pauseVideo()}function ytStop(){player.stopVideo()}function ytSpeedUp(){var t=player.getPlaybackRate();player.setPlaybackRate(t+.25)}function ytSlowDown(){var t=player.getPlaybackRate();player.setPlaybackRate(t-.25)}function ytMute(){player.isMuted()?(player.unMute(),$("#mute").text("Mute")):(player.mute(),$("#mute").text("Unmute"))}function ytVolUp(){var t=player.getVolume();t<=95&&player.setVolume(t+5)}function ytVolDown(){var t=player.getVolume();t>=5&&player.setVolume(t-5)}function ytSeekTo(t){var e=data.segments[t].start;player.seekTo(e,!0),syncTo(e)}function makeYtPlayer(){$("#player-wrapper").html(buttonRow),loadYtApi(),$("#player-nav").css("visibility","visible")}