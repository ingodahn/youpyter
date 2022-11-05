/* Functions used by player and runnr */
function getBrowserLanguage() {
    var userLang = navigator.language || navigator.userLanguage;
    var lang = userLang.substring(0,2);
    return lang;
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
      language: data.kernel,
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
 `<head>
 <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css">
 <script src="`+data.system+`/vendor/js/FileSaver.min.js"></script>
 <script src="https://cdn.jsdelivr.net/remarkable/1.7.1/remarkable.min.js"></script>
 <script type="text/javascript">window.MathJax = {
     tex: {
       inlineMath: [["$", "$"], ["\\(", "\\)"]],
       displayMath: [["$$", "$$"], ["\\[", "\\]"]],
       processEscapes: true,
       processEnvironments: true,
     },
     options: {
       renderActions: { /* remove when dropping MathJax2 compatibility */
         find_script_mathtex: [10, function (doc) {
           for (const node of document.querySelectorAll('script[type^="math/tex"]')) {
             const display = !!node.type.match(/; *mode=display/);
             const math = new doc.options.MathItem(node.textContent, doc.inputJax[0], display);
             const text = document.createTextNode('');
             node.parentNode.replaceChild(text, node);
             math.start = { node: text, delim: '', n: 0 };
             math.end = { node: text, delim: '', n: 0 };
             doc.math.push(math);
           }
         }, '']
       }
     }
   };</script>
 <script src="https://sagecell.sagemath.org/embedded_sagecell.js"></script>
 <script src="`+data.system+`/ytcontrol.js"></script>
 <script src="`+data.system+`/ytrunner.js"></script>
 <link rel="stylesheet" href="`+data.system+`/ytactivator.css">
</head>\n<body>\n<div id="main">
<row>
      <div id="player-nav">
        <div id="player-wrapper"></div>
        <select id="toc" onchange="if (this.selectedIndex) ytSeekTo(this.selectedIndex)"></select>
        <button id="calcNext" type="button" class="btn btn-primary" onclick="calcNext()">Next Calculation</button>
        <button id="save" type="button" class="btn btn-primary" onclick="saveHtml()">Save</button>
      </div>
    </row>`+
  $('#notebook-wrapper').html()+
  `</div>
  <script>
    var data =`+ JSON.stringify(data) +`;
    makeYtPlayer();
    makeToc();
    makeSageCells();
  </script>
  </body></html>`], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "testplayer.html");
  let saveWarnMsg='Do NOT use this page anymore - open your saved copy or reload this page.';
  var lang=getBrowserLanguage();
  if (lang == 'de') saveWarnMsg='Bitte die Seite neu laden oder die gespeicherte Kopie öffnen.';
  $('#navbar').html('<div class="save-warning">'+saveWarnMsg+'</div>');
}

function saveAddSageCells(rootNode,delNode) {
  let cell = `
  <div class='compute'>
    <script type='text/x-sage'>1+1</script>
  </div>`;
  $(rootNode).each(function () {
    $(this).append(cell);
    let scScript=getSageInput($(this));
    scScript=scScript.replace(/\u200B/g,'')
    $(this).find('.compute script').text(scScript);
    if (delNode) $(this).find(delNode).remove();
    $(this).find('.compute').hide();
  });
}

function makeToc() {
  for (let i = 0; i< data.segments.length; i++) {
    $('#toc').append('<option value="' + data.segments[i].start + '">'+data.segments[i].title+'</option>');
  }
}