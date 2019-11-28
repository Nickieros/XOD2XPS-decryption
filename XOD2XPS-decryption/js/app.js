WebViewer({
    path: "./lib",
    initialDoc: "../src/xod/sheet_music.xod",
}, document.getElementById("viewer"))
    .then(instance => {
        document.getElementById("select").onchange = e => {
            if (e.target.value.indexOf("encrypted") !== -1) {
                instance.loadDocument(e.target.value, {
                    decrypt: document.querySelector("iframe").contentWindow.CoreControls.Encryption.decrypt,
                    decryptOptions: {
                        p: "foobar12",
                        type: "aes",
                        error(msg) {
                            alert(msg);
                        },
                    },
                });
            } else {
                instance.loadDocument(e.target.value);
            }
        };

        document.getElementById("file-picker").onchange = e => {
            const file = e.target.files[0];
            if (file) {
                instance.loadDocument(file);
            }
        };

        document.getElementById("url-form").onsubmit = e => {
            e.preventDefault();
            instance.loadDocument(document.getElementById("url").value);
        };
    });

function convertToPDF() {
    let pdfdoc = new PDFDoc();
    PDFTron.PDF.Convert.ToPdf(pdfdoc, xodFile);
    pdfdoc.Save(xodFile.Replace(".xod", ".pdf"), SDFDoc.SaveOptions.e_remove_unused);
}

document.getElementById("downloadButton").addEventListener("click", convertToPDF);
