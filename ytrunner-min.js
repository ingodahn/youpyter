function getBrowserLanguage(){return(navigator.language||navigator.userLanguage).substring(0,2)}function syncTo(e){$(".cell").removeClass("current-cell");let t=null;for(var a=0;a<data.nbCells.length;a++)if(e>=data.nbCells[a].start&&e<data.nbCells[a].end){let e="#"+data.nbCells[a].content;t||(t=e),$(e).addClass("current-cell")}checkEvaluated(),$(t)[0].scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"})}function checkEvaluated(){let e=null;$(".cell").removeClass(["evaluated","evaluable","notEvaluated"]);for(let t=0;t<data.nbCells.length;t++)"code"==data.nbCells[t].cellType&&(data.nbCells[t].cellEvaluated?$("#"+data.nbCells[t].content).addClass("evaluated"):null==e?(e=data.nbCells[t].content,$("#"+e).addClass("evaluable")):$("#"+data.nbCells[t].content).addClass("notEvaluated"));return e?$("#calcNext").prop("disabled",!1):$("#calcNext").prop("disabled",!0),e}function sageCell(e){return'<div class="compute"><script type="text/x-sage">'+e+"<\/script></div>"}function makeSageCells(){sagecell.makeSagecell({inputLocation:".compute",linked:!0,language:data.kernel,callback:()=>{$(".sagecell_evalButton").click((function(){let e=this.parentNode.parentNode.parentNode.parentNode.id,t=data.nbCells.findIndex((t=>t.content==e));data.nbCells[t].cellEvaluated=!0,checkEvaluated()}))}})}function calcNext(){let e=null;for(let t=0;t<data.nbCells.length;t++)if("code"==data.nbCells[t].cellType&&!data.nbCells[t].cellEvaluated){e=data.nbCells[t].start;break}player.seekTo(e),syncTo(e)}function saveHtml(){saveAddSageCells(".code-cell",".sagecell_input,.sagecell_output"),saveInitEvaluated(),$("script").html().replace(/\u200B/g,"");var e=new Blob(['<!DOCTYPE html>\n<html>\n<head><head>\n <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"><\/script>\n <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css">\n <script src="'+data.system+'/vendor/js/FileSaver.min.js"><\/script>\n <script src="https://cdn.jsdelivr.net/remarkable/1.7.1/remarkable.min.js"><\/script>\n \x3c!-- KaTeX --\x3e\n  <script src="https://dahn-research.eu/nbplayer/vendor/js/vendor/katex.min.js"><\/script>\n  <script src="https://dahn-research.eu/nbplayer/vendor/js/vendor/katex-auto-render.min.js"><\/script>\n  <link rel="stylesheet" href="https://dahn-research.eu/nbplayer/vendor/css/vendor/katex.min.css">\n <script src="https://sagecell.sagemath.org/embedded_sagecell.js"><\/script>\n <script src="'+data.system+'/ytcontrol-min.js"><\/script>\n <script src="'+data.system+'/ytrunner-min.js"><\/script>\n <link rel="stylesheet" href="'+data.system+'/ytactivator-min.css">\n</head>\n<body>\n<div id="main">\n<row>\n      <div id="player-nav">\n        <div id="player-wrapper"></div>\n        <select id="toc" onchange="if (this.selectedIndex) ytSeekTo(this.selectedIndex)"></select>\n        <button id="calcNext" type="button" class="btn btn-primary" onclick="calcNext()">Next Calculation</button>\n        <button id="save" type="button" class="btn btn-primary" onclick="saveHtml()">Save</button>\n      </div>\n    </row>\n    <div id=\'notebook-wrapper\'>'+$("#notebook-wrapper").html()+"</div>\n  </div>\n  <script>\n    var data ="+JSON.stringify(data)+';\n    makeYtPlayer();\n    makeToc();\n    makeSageCells();\n    syncTo(0);\n    renderMathInElement(document.body, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }] });\n  <\/script>\n  </body></html>'],{type:"text/plain;charset=utf-8"});saveAs(e,"testplayer.html");let t="Do NOT use this page anymore - open your saved copy or reload this page.";"de"==getBrowserLanguage()&&(t="Bitte die Seite neu laden oder die gespeicherte Kopie öffnen."),$("#navbar").html('<div class="save-warning">'+t+"</div>")}function saveAddSageCells(e,t){$(e).each((function(){let e=getSageInput($(this));e=e.replace(/\u200B/g,"");let t="\n    <div class='cell-input'>\n      <div class='compute'>\n        <script type='text/x-sage'>"+e+"<\/script>\n      </div>\n    </div>";$(this).html(t)}))}function getSageInput(e){let t="";return e.find(".CodeMirror-line").each((function(){t+=$(this).text()+"\n"})),t}function saveInitEvaluated(){for(let e=0;e<data.nbCells.length;e++)"code"==data.nbCells[e].cellType&&(data.nbCells[e].cellEvaluated=!1)}function makeToc(){for(let e=0;e<data.segments.length;e++)$("#toc").append('<option value="'+data.segments[e].start+'">'+data.segments[e].title+"</option>")}