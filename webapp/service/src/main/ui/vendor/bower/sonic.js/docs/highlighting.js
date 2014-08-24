var frame = document.getElementById('test'),
    checker = setInterval(function () {
        var code = hljs.highlightAuto(document.getElementById("test").contentWindow.document.body.textContent).value
        if (code.length > 0) {
            clearInterval(checker);
            document.getElementById("code").innerHTML = code;
        }
    }, 50);

hljs.initHighlightingOnLoad();