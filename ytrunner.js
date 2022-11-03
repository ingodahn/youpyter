/* Functions used by player and runnr */
function getBrowserLanguage() {
    var userLang = navigator.language || navigator.userLanguage;
    var lang = userLang.substring(0,2);
    return lang;
}

var data = {
  breakpoints: new Set(),
  segments: [],
  nbCells: [],
  endTime: 1000000,
  kernel: 'sage',
}

function syncTo(time) {
  $('.cell').removeClass('current-cell');
  let firstcell = null;
  for (var i = 0; i < data.nbCells.length; i++) {
      if (time >= data.nbCells[i].start && time < data.nbCells[i].end) {
          let cname = '#' + data.nbCells[i].content;
          if (!firstcell) firstcell = cname;
          $(cname).addClass('current-cell');
      }
  }
  checkEvaluated();
  $(firstcell)[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function checkEvaluated() {
  let evaluable = null;
  $('.cell').removeClass(['evaluated', 'evaluable', 'notEvaluated']);
  for (let i = 0; i < data.nbCells.length; i++) {
      if (data.nbCells[i].cellType == 'code') {
          if (data.nbCells[i].cellEvaluated) {
              $('#' + data.nbCells[i].content).addClass('evaluated');
          } else {

              if (evaluable == null) {
                  evaluable = data.nbCells[i].content;
                  $('#' + evaluable).addClass('evaluable');
              } else {
                  $('#' + data.nbCells[i].content).addClass('notEvaluated');
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
              let cei = data.nbCells.findIndex(c => c.content == cell);
              data.nbCells[cei].cellEvaluated = true;
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

function calcNext() {
  let nextTime = null;
  for (let i = 0; i < data.nbCells.length; i++) {
      if (data.nbCells[i].cellType == 'code') {
          if (!data.nbCells[i].cellEvaluated) {
              nextTime = data.nbCells[i].start;
              break;
          }
      }
  }
  player.seekTo(nextTime);
  syncTo(nextTime);
}

function saveHtml() {
  saveAddSageCells(".nb-code-cell",".sagecell_input,.sagecell_output");
  $('script').html().replace(/\u200B/g,'');
  var blob = new Blob(['<!DOCTYPE html>\n<html>\n<head>'+
  $('head').html()+
  '</head>\n<body>\n<div id="main">'+
  $('#main').html()+
  `</div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW" crossorigin="anonymous"></script>
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
  <script src="https://sagecell.sagemath.org/embedded_sagecell.js"></script>
  <script src="`+playerConfig.playerPath+`/vendor/js/FileSaver.min.js"></script>
  <script src="`+playerConfig.playerPath+`/nbplayerConfig.js"></script>
  <script src="`+playerConfig.playerPath+`/js/nbrunner.min.js"></script>
  <script>
    playerConfig=`+JSON.stringify(playerConfig)+`;
    playerMode=`+JSON.stringify(playerMode)+`;
    makeMenu();
    localize();
    loadStatus();
    makeSageCells(playerConfig);
    launchPlayer();
  </script>
  </body></html>`], {type: "text/plain;charset=utf-8"});
  saveAs(blob, playerConfig.name+".html");
  let saveWarnMsg='Do NOT use this page anymore - open your saved copy or reload this page.';
  var lang=getBrowserLanguage();
  if (lang == 'de') saveWarnMsg='Bitte die Seite neu laden oder die gespeicherte Kopie öffnen.';
  $('#navbar').html('<div class="save-warning">'+saveWarnMsg+'</div>');
}