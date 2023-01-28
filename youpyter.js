var data = {
    breakpoints: {},
    segments: [],
    nbCells: [],
    endTime: 1000000,
    kernel: 'sage',
    system: youpyterPath,
    video: null,
    name: 'youpyter'
}

imgPath = "./images/";

function readURL(input) {
    if (input.files && input.files[0]) {
        data.name = input.files[0].name.substring(0, input.files[0].name.lastIndexOf('.'));
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
        getAllSections(nb.cells);
        getVideo(nb.cells[0]);
        for (var i = 1; i < nb.cells.length; i++) {
            let rowi = 'row'+i;
            $('#notebook-wrapper').append('<div class="row" id="'+rowi+'"><div class="side col-1" id="side' + i + '"></div></div>')
            var cell = nb.cells[i];
            if (cell.cell_type == "code") {
                $('#'+rowi).append(makeCodeCell(cell, i));
            } else {
                let mdcell = makeMarkdownCell(cell, i);
                if (mdcell) $('#'+rowi).append(mdcell);
            }
        }
        addPlayButtons();
        renderMathInElement(document.body, { delimiters: [{ left: "$$", right: "$$", display: true, strict: false }, { left: "$", right: "$", display: false }] });
    } catch (error) {
        $('#main').append("<p>Error: " + error + "</p>");
    }
}

function makeCodeCell(cell, i) {
    var code = (cell.source) ? cell.source.join('') : "";
    var cellDiv = $('<div class="cell code-cell col" id="cell' + i + '"></div>');
    cellDiv.append('<div class="cell-input">' + sageCell(code) + '</div>');
    addOneCell(cell, i);
    $('#calcNext').css('visibility', 'visible');
    return cellDiv;
}

function getVideo(cell) {
    var mdContent = cell.source.join('');
    let isVideo = hasVideo(mdContent);
    if (isVideo) {
        var cellDiv = $('<div class="cell" id="cell0"></div>');
        cellDiv.append(buttonRow);
        data.video = { videoId: isVideo.id, width: isVideo.width, height: isVideo.height };
        cellDiv.append(makeYtPlayer());
        makeYtPlayer();
    } else {
        alert('First cell must be a video');
    }
}
function makeMarkdownCell(cell, i) {
    var mdContent = cell.source.join('');
    var md = new Remarkable({ html: true, breaks: false, linkify: true });
    var mdContent0 = mdContent.replace(/\\\\/g, '\\\\\\\\');
    var html = md.render(mdContent0);
    var cellDiv = $('<div class="cell markdown-cell col" id="cell' + i + '"></div>');
    cellDiv.append('<div>' + html + '</div>');
    addOneCell(cell, i);
    return cellDiv;
}

function hasVideo(mdContent) {
    let reId = /\"https:\/\/www.youtube.*\.com\/embed\/([^\"]*)\"/mg;
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
        console.log(vpars);
        return vpars;
    } else return null;
}

function getAllSections(cells) {
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (cell.cell_type == "markdown") {
            let reTite = /<!--[\s]*Section:(.*)Time/;
            let line = cell.source[0];
            let match = reTite.exec(line);
            if (match) {
                let title = match[1].trim();
                let reTime = /Time:(.*)-->/;
                if (reTime.exec(line)) {
                    let time = reTime.exec(line)[1].trim();
                    let section = { title: title, start: time2sec(time), end: 999, cellNr: i, id: "section" + i };
                    data.segments.push(section);
                    if (data.segments.length > 1) {
                        data.segments[data.segments.length - 2].end = section.start;
                    }
                    data.breakpoints[section.start] = true; // breakpoints should be a set, but that cannot be serialized
                    data.breakpoints[section.end] = true;
                } else {
                    throw 'Section ' + title + ' has no time';
                }

            }

        }
    }
    makeToc();
}

function time2sec(time) {
    let t = time.split(':'), minutes = +t[0], seconds = +t[1];
    return minutes * 60 + seconds;
}

function addOneCell(cell, i) {
    let sectionCellNr = 0;
    for (j = 0; j < data.segments.length; j++) {
        if (data.segments[j].cellNr <= i) {
            sectionCellNr = j;
        } else {
            break;
        }
    }
    // sectionCellNr is the index of the section that contains the cell
    let cellSection = data.segments[sectionCellNr];
    data.nbCells.push({ content: "cell" + i, start: cellSection.start, end: cellSection.end, cellType: cell.cell_type, cellEvaluated: false });
}

function addPlayButtons() {
    for (var i = 0; i < data.segments.length; i++) {
        $('#side' + data.segments[i].cellNr).append(playButton(i));
    }
}
