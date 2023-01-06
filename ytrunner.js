/* Functions used by player and runnr */
function getBrowserLanguage() {
  var userLang = navigator.language || navigator.userLanguage;
  var lang = userLang.substring(0, 2);
  return lang;
}

const getScrollParent = (node) => {
  if (node === null) {
    return null;
  }

  if (node.scrollHeight > node.clientHeight) {
    return node;
  } else {
    return getScrollParent(node.parentNode);
  }
}

function syncTo(time) {
  $('.cell').removeClass('current-cell');
  let firstcell = null;
  for (var i = 0; i < data.nbCells.length; i++) {
    if (time >= data.nbCells[i].start && time < data.nbCells[i].end) {
      let cname = data.nbCells[i].content;
      if (!firstcell) firstcell = cname;
      $(cname).addClass('current-cell');
    }
  }
  checkEvaluated();
  if (!firstcell) firstcell = data.nbCells[data.nbCells.length - 1].content;
  //let cellTop=$(firstcell)[0].getBoundingClientRect().top;
  //let playerBottom=$('#player-nav')[0].getBoundingClientRect().bottom;
  //$('#notebook-wrapper')[0].scrollTo({ top: cellTop, behavior: "smooth" });
  //const scrollParent = getScrollParent($(firstcell)[0]);
  //console.log(scrollParent);
  //$(firstcell)[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  let cell = document.getElementById(firstcell);
  let nav = document.getElementById("player-nav");
  let navRects = nav.getClientRects()[0];
  let cellRects = cell.getClientRects()[0];
  window.scrollBy({ left: 0, top: cellRects.y - navRects.height, behavior: "smooth" });
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

// Start saving
function saveHtml() {
  saveAddSageCells(".code-cell", ".sagecell_input,.sagecell_output");
  saveInitEvaluated();
  //$('script').html().replace(/\u200B/g, '');
  let cs = document.getElementsByClassName('code-cell');
  for (let i = 0; i < cs.length; i++) {
    cs[i].innerHTML = cs[i].innerHTML.replace(/\u200B/g, '');
  }
  let mds = document.getElementsByClassName('markdown-cell');
  for (let i = 0; i < mds.length; i++) {
    mds[i].innerHTML = mds[i].innerHTML.replace(/\u2212+/g, '-');
    mds[i].innerHTML = mds[i].innerHTML.replace(/\u2032+/g, '\'');
  }
  var blob = new Blob(['<!DOCTYPE html>\n<html>\n<head>' +
    `<head>
 <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css">
 <script src="`+ data.system + `/vendor/js/FileSaver.min.js"></script>
 <script src="https://cdn.jsdelivr.net/remarkable/1.7.1/remarkable.min.js"></script>
 <meta charset="utf-8">
 <title>` + data.name + `</title>
 <!-- KaTeX -->
  <script src="https://dahn-research.eu/nbplayer/vendor/js/vendor/katex.min.js"></script>
  <script src="https://dahn-research.eu/nbplayer/vendor/js/vendor/katex-auto-render.min.js"></script>
  <link rel="stylesheet" href="https://dahn-research.eu/nbplayer/vendor/css/vendor/katex.min.css">
 <script src="https://sagecell.sagemath.org/embedded_sagecell.js"></script>
 <script src="`+ data.system + `/ytcontrol-min.js"></script>
 <script src="`+ data.system + `/ytrunner-min.js"></script>
 <link rel="stylesheet" href="`+ data.system + `/ytactivator-min.css">
</head>\n<body>\n<div id="main">
<row>
      <div id="player-nav">
        <div id="player-wrapper"></div>
        <select id="toc" onchange="ytSeekTo(this.selectedIndex)"></select>
        <button id="calcNext" type="button" class="btn btn-primary" onclick="calcNext()">Next Calculation</button>
        <button id="save" type="button" class="btn btn-primary" onclick="saveHtml()">Save</button>
      </div>
    </row>
    <div id='notebook-wrapper'>`+
    $('#notebook-wrapper').html() +
    `</div>
  </div>
  <script>
    var data =`+ JSON.stringify(data) + `;
    makeYtPlayer();
    makeToc();
    setCalcSave();
    makeSageCells();
    syncTo(0);
    renderMathInElement(document.body, { delimiters: [{ left: "$$", right: "$$", display: true, strict: false }, { left: "$", right: "$", display: false }] });
  </script>
  </body></html>`], { type: "text/plain;charset=utf-8" });
  saveAs(blob, data.name+".html");
  let saveWarnMsg = 'Do NOT use this page anymore - open your saved copy or reload this page.';
  var lang = getBrowserLanguage();
  if (lang == 'de') saveWarnMsg = 'Bitte die Seite nach dem Speichern neu laden oder die gespeicherte Kopie öffnen.';
  //$('#navbar').html('<div class="save-warning">' + saveWarnMsg + '</div>');
  alert(saveWarnMsg);
}

function saveAddSageCells(rootNode, delNode) {
  $(rootNode).each(function () {
    let scScript = getSageInput($(this));
    scScript = scScript.replace(/\u200B/g, '')
    let cell = `
    <div class='cell-input'>
      <div class='compute'>
        <script type='text/x-sage'>`+ scScript + `</script>
      </div>
    </div>`;
    $(this).html(cell);
  });
}

function getSageInput(rootNode) {
  let scScript = '';
  rootNode.find('.CodeMirror-line').each(function () {
    scScript += $(this).text() + '\n';
  })
  return scScript;
}

function saveInitEvaluated() {
  for (let i = 0; i < data.nbCells.length; i++) {
    if (data.nbCells[i].cellType == 'code') {
      data.nbCells[i].cellEvaluated = false;
    }
  }
}

// End Saving

function makeToc() {
  for (let i = 0; i < data.segments.length; i++) {
    $('#toc').append('<option value="' + data.segments[i].start + '">' + data.segments[i].title + '</option>');
  }
}

function setCalcSave() {
  let cl = document.getElementsByClassName('code-cell').length;
  if (cl < 2) {
    $('#calcNext').hide();
  }
  if (cl < 1) {
    $('#save').hide();
  }
}