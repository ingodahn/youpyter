var data = {
    breakpoints: {},
    segments: [],
    nbCells: [],
    endTime: 1000000,
    kernel: 'sage',
    system: ytactivatorPath,
    video: null,
    name: 'ytActivator'
  }
  

function readURL(input) {
    if (input.files && input.files[0]) {
        alert(input.files[0].name);
        data.name=input.files[0].name.substring(0, input.files[0].name.lastIndexOf('.'));
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
        renderMathInElement(document.body, { delimiters: [{ left: "$$", right: "$$", display: true, strict: false }, { left: "$", right: "$", display: false }] });
    } catch (error) {
        $('#main').append("<p>Error: " + error + "</p>");
    }
}

function makeCodeCell(cell, i) {
    var code = (cell.source) ? cell.source.join('') : "";
    var cellDiv = $('<div class="cell code-cell" id="cell' + i + '"></div>');
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
        data.video = { videoId: isVideo.id, width: isVideo.width, height: isVideo.height };
        cellDiv.append(makeYtPlayer());
        getSections(mdContent);
        makeYtPlayer();
        return null;
    } else {
        var md = new Remarkable({ html: true, breaks: false, linkify: true });
        var mdContent0 = mdContent.replace(/\\\\/g, '\\\\\\\\');
        var html = md.render(mdContent0);
        var cellDiv = $('<div class="cell markdown-cell row" id="cell' + i + '"></div>');
        cellDiv.append('<div>' + html + '</div>');
        addCell(cell, i);
        return cellDiv;
    }
}

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
                data.segments.push(section);
                data.breakpoints[section.start] = true; // breakpoints should be a set, but that cannot be serialized
                data.breakpoints[section.end] = true;
            }
        }
    }
    makeToc();
}

function time2sec(time) {
    let t = time.split(':'), minutes = +t[0], seconds = +t[1];
    return minutes * 60 + seconds;
  }

function addCell(cell, i) {
    if (cell.metadata && cell.metadata.in) {
        let cellSectionId = cell.metadata.in;
        let cellSection = data.segments.find(s => s.id == cellSectionId);
        data.nbCells.push({ content: "cell" + i, start: cellSection.start, end: cellSection.end, cellType: cell.cell_type, cellEvaluated: false });
    } else {
        throw 'Cell ' + i + ' has no section';
    }
}
