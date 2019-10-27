WebViewer({
    path: "./lib",
    initialDoc: "./xod/encrypted-foobar12.xod",
}, document.getElementById("viewer"))
    .then(instance => {
        document.getElementById("select").onchange = e => {
            if (e.target.value === "./xod/encrypted-foobar12.xod") {
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
