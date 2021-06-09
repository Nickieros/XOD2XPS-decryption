
/**
 * location of the .xod files relative to the index.html
 * It cannot be higher than the root server directory.
 */
let inputDirectory = "./userData/input_xod/";

/**
 * XOD file reader as WebView instance of PDFTron library
 */
let readerInstance = null;  // WebView instance of PDFTron library
let readerWindow = null;    // context of WebView instance
let readerDocument = null;  // document of WebView instance
let readerLibPath = "./lib";// library path for WebView

// user input options
let passwordField = document.getElementById("textPassword"); // for decryption of encrypted XOD files
let sliderSpeed = document.getElementById("sliderSpeed");
let instructions = document.getElementById("instructions");
let control = document.getElementById("control");
let fileList = document.getElementById("select");
let buttonStopDownload = document.getElementById("buttonStopDownload");

/**
 * Buffer with intercepted XOD parts to be assembled into XPS
 * @type {Array.<{fileName: string, decryptedData: string}>}
 */
let xodBuffer = [];

/**
 * Process status trigger
 * @type {boolean}
 */
let inProcess = false;

/**
 * Stop status trigger
 * @type {boolean}
 */
let isStop = false;

/**
 * Successful state at the end of program
 */
let isSuccessful = false;

/**
 * Id of Interval for looping page change
 * @type {number}
 */
let intervalId = 0;

/**
 * Current file path that chosen in the file list, with path and extension
 * @type {string}
 */
let currentFilePath = "";

/**
 * Current file name that chosen in the file list, without path and extension
 * @type {string}
 */
let currentFileName = "";

/**
 * Number of available parts in current file
 * @type {number}
 */
let partsAvailable = 0;

window.addEventListener("load", renderReader);
document.getElementById("buttonReapplyPassword").addEventListener("click", reapplyPassword);
document.getElementById("buttonStartDownload").addEventListener("click", start);
document.getElementById("buttonStopDownload").addEventListener("click", stop);
sliderSpeed.addEventListener(
    "input", () => {
        document.getElementById("textSpeed").innerHTML = sliderSpeed.value;
    }
);

function defineDragNDropListeners() {
    let dropAreas = [document.body, readerDocument.body];
    dropAreas.forEach(dropArea => {
        dropArea.addEventListener('dragenter', handleDrop.bind(this), false);
        dropArea.addEventListener('dragleave', handleDrop.bind(this), false);
        dropArea.addEventListener('dragover', handleDrop.bind(this), false);
        dropArea.addEventListener('drop', handleDrop.bind(this), false);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropAreas.forEach(dropArea => {dropArea.addEventListener(eventName, preventDefaults.bind(this), false)});
    });

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function handleDrop(ev) {
    ev.dataTransfer.dropEffect = "copy";

    if(!ev.dataTransfer.files.length) return;

    let fileNames = Object.values(ev.dataTransfer.files).map(file => file.name);

    fileNames.sort();
    fileList.innerHTML = "";

    fileNames.forEach(fileName => {
        const option = document.createElement("option");
        option.innerText = fileName;
        option.value = `../../../.${inputDirectory}${fileName}`;
        document.getElementById("select").appendChild(option);
    });
    instructions.style.display = "none";
    control.style.display = "block";
}

function renderReader() {
    WebViewer({
        path: readerLibPath,
    }, document.getElementById("viewer"))
    .then(async instance => {
        readerInstance = instance;
        readerWindow = instance.iframeWindow;
        readerDocument = readerWindow.document;

        defineDragNDropListeners(); // to fill file list by drag-and-drop files into window
        fileList.onchange = loadDocument;
        decryptInjection(); // Javascript injection to intercept decrypted parts
    });
}

function loadDocument() {
    currentFilePath = fileList.options[fileList.selectedIndex].value;

    const regex = /.*\/(.*)\..*/;
    currentFileName = currentFilePath.match(regex)[1];

    xodBuffer = []; // clear buffer for a new file

    getNumberOfParts(currentFileName, () => {
        readerInstance.loadDocument(currentFilePath, {
            decrypt: document.querySelector("iframe").contentWindow.CoreControls.Encryption.decrypt,
            decryptOptions: {
                p: passwordField.value,
                type: "aes",
                error(msg) {
                    alert(msg);
                },
            },
        });
    });
}

function start() {
    isStop = false;

    showProgressBarParts();
    fileList.options.selectedIndex = 0;
    showProgressBarFiles();

    document.querySelectorAll("input").forEach(inputElement => {
        inputElement.setAttribute("disabled", "");
    });
    fileList.setAttribute("disabled", "");
    buttonStopDownload.removeAttribute("disabled");

    setProgressBarFilesValue(fileList.options.selectedIndex, fileList.options.length);
    loadDocument();
    setTimeout(downloadAuto, 3000 / sliderSpeed.value);
}

function stop() {
    isStop = true;
    document.querySelectorAll("input").forEach(inputElement => {
        inputElement.removeAttribute("disabled");
    });
    fileList.removeAttribute("disabled");
    buttonStopDownload.setAttribute("disabled", "");
    if(!isSuccessful) {
        hideProgressBarParts();
        hideProgressBarFiles();
    }
    if(fileList.options.length > 1)
        hideProgressBarParts();
}

function downloadAuto(){
    if(isStop) return;

    inProcess = true;
    isSuccessful = false;

    if(fileList.options.length < 1) {
        stop();
        alert("Drop some files from 'userData/input_xod' folder into browser window");
        return;
    }

    if(!xodBuffer.length) {
        stop();
        alert("Unexpected error: xodBuffer is empty");
        return;
    }

    fireFakeMouseMove();

    setTimeout( () => {
                scrollDocument();
        },
        1000 / sliderSpeed.value);
}

function scrollDocument(speedDown = 1) {

    if(partsAvailable !== xodBuffer.length) {
        readerInstance.goToLastPage();
    }

    intervalId = setInterval(() => {
        if (isStop) {
            clearInterval(intervalId);
            return;
        }

        if(partsAvailable === xodBuffer.length) {
            clearInterval(intervalId);
            saveXOD();
            return;
        }

        if(readerInstance.getCurrentPageNumber() === 1) {
            clearInterval(intervalId);
            if(speedDown === 2) {
                console.log("Retrying document processing fail, reloading document and retrying from start");
                sliderSpeed.value = parseFloat(sliderSpeed.value/2).toFixed(1);
                document.getElementById("textSpeed").innerHTML = sliderSpeed.value;
                loadDocument();
                setTimeout(downloadAuto, 5000);
                return;
            }
            speedDown *= 2;
            console.log(`Retrying document processing, current speed x${sliderSpeed.value} decreased by ${speedDown} and will be ${parseFloat(sliderSpeed.value / speedDown).toFixed(2)}`);
            scrollDocument(speedDown);
            return;
        }
        fireFakeMouseMove();
        readerInstance.goToPrevPage();
        },
        speedDown * 1000 / sliderSpeed.value
    );
}

function reapplyPassword() {
    fileList.onchange();
}

function saveXOD() {

    let zip = new JSZip();
    let allPartsReady = false;

    JSZipUtils.getBinaryContent(inputDirectory + currentFileName + ".xod", (err, f) => {
        if(err) {
            throw err;
        }

        JSZip.loadAsync(f)
        .then(function(zip) {
            allPartsReady = Object.keys(zip.files).every(zipFileName => {
                return xodBuffer.some(part => {
                    return !!part.decryptedData && part.fileName === zipFileName;
                });
            });
            if(!allPartsReady) {
                zip = null;
                stop();
                throw Error ("Not all parts ready");
            }
        })
        .catch(e=>{stop();throw Error(e.message);})
        .then(() => {
            // adds all decrypted parts to zip container
            xodBuffer.forEach( part => {
                zip.file(
                    part.fileName,
                    part.decryptedData,
                    {
                        binary: true,
                        compression: "DEFLATE",
                        compressionOptions: {
                            level: 9
                        }
                    }
                );
            });

            // generate zip file and initiate download process
            zip.generateAsync( { type:"blob" } )
            .then( blob => {
                saveAs( blob, currentFileName + ".xps");
                isSuccessful = true;
                setProgressBarFilesValue(fileList.options.selectedIndex + 1, fileList.options.length);
            }, err=> { zip = null; throw Error(err.message); })
            .then(() => {
                if (fileList.options.length - 1 > fileList.options.selectedIndex) {
                    fileList.options.selectedIndex++;
                    loadDocument();
                    setTimeout(downloadAuto, 5000 / sliderSpeed.value);
                } else {
                    stop();
                }
            });
        })
        .then(() => { zip = null; });
    });
}

function decryptInjection() {
    let reader = document.querySelector("iframe").contentWindow;
    reader.CoreControls.Encryption.decrypt = interceptDecryptedData;
    reader.CoreControls.Encryption.decryptSynchronous = interceptDecryptedData;

    function interceptDecryptedData() {
        let inflate = kn.inflate;
        let decrypt = CoreControls.Encryption.decrypt;
        let decryptSynchronous = CoreControls.Encryption.decryptSynchronous;
        let decryptFunction = (arguments.length > 3) ? decrypt : decryptSynchronous;
        let decryptedData = decryptSynchronous.apply(this, arguments);
        let fileName = arguments[2];
        let extension = fileName.match(/\.([a-z]+)$/i)[1].toLowerCase();

        if(extension !== "jpg" && extension !== "png") {
            decryptedData = inflate(decryptedData);
        }

        if (!xodBuffer.some(part => part.fileName === fileName)) {
            xodBuffer.push({fileName: fileName, decryptedData: decryptedData});
            setProgressBarPartsValue(xodBuffer.length, partsAvailable);
        }
        return decryptFunction.apply(this, arguments);
    }
}

function getNumberOfParts(validatedFileName, callback) {
    let zip = new JSZip();

    JSZipUtils.getBinaryContent(inputDirectory + validatedFileName + ".xod", (err, f) => {
        JSZip.loadAsync(f)
        .then(zip => {
            partsAvailable = Object.keys(zip.files).length;
        })
        .then(() => { zip = null; callback(); })
        .catch(e => { zip = null; throw Error(e.message); } );
    });
}

function fireFakeMouseMove() {
    // generate a fake mousemove event to make the reader load the missing root tier parts
    let event = readerWindow.$.Event('mousemove');
    let readerGeometry = readerDocument.querySelector(".document").getBoundingClientRect();
    event.pageX = readerGeometry.x + 10;
    event.pageY = readerGeometry.y + 10;
    readerWindow.$(readerDocument.querySelector(".document")).trigger(event);
}


/**
 * Section for visual front-end
 */
function hideProgressBarParts() {
    hide("progressBarParts");
}

function hideProgressBarFiles() {
    hide("progressBarFiles");
}

function showProgressBarParts() {
    show("progressBarParts");
}

function showProgressBarFiles() {
    show("progressBarFiles");
}

function hide(progressBarId) {
    if(!(progressBarId && typeof progressBarId === "string")) {
        stop();
        throw Error("function hide(): progressBar id must be a string");
    }

    document.getElementById(progressBarId).style.fontSize = "0";
}

function show(progressBarId) {
    if(!(progressBarId && typeof progressBarId === "string")) {
        stop();
        throw Error("function show(): progressBar id must be a string");
    }
    document.getElementById(progressBarId).style.fontSize = "100%";
}

function setProgressBarPartsValue(currentValue, maxValue) {
    setProgressBarValue("progressBarParts", currentValue, maxValue);
}

function setProgressBarFilesValue(currentValue, maxValue) {
    setProgressBarValue("progressBarFiles", currentValue, maxValue);
}

function setProgressBarValue(progressBarId, currentValue, maxValue) {
    /**
     * Arguments validation
     */
    let errorMessage = "";

    if(!(progressBarId && typeof progressBarId === "string"))
        errorMessage = "progressBar id must be a String";

    let progressBar = document.getElementById(progressBarId);
    if(!progressBar)
        errorMessage = `element with id="${progressBarId}" not found`;

    if(isNaN(parseInt(currentValue)) || isNaN(parseInt(maxValue)))
        errorMessage = "currentValue and maxValue must be a Number";

    if(parseInt(currentValue) > parseInt(maxValue))
        errorMessage = "currentValue must be equal or less then maxValue";

    if(errorMessage) {
        stop();
        throw Error(`function setProgressBarValue(): ${errorMessage}`);
    }
    /**
     * End of arguments validation
     */

        // Change visual progress bar
    let currentPercents = 100 * currentValue/maxValue;
    progressBar.style.background = "" +
        "linear-gradient(" +
        "to right," +
        "rgb(208, 222, 255) 0%," +
        `rgb(208, 222, 255) ${currentPercents}%,` +
        `rgb(242, 242, 242) ${currentPercents}%,` +
        "rgb(242, 242, 242) 100%)";

    // change progress bar text
    progressBar.firstElementChild.innerHTML = `${currentValue} of ${maxValue}`;
}
