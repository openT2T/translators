var translator = require('./thingTranslator');

setTimeout(function () {
    translator.close();
	setTimeout(function () {
        translator.open();
		setTimeout(function () {
            translator.close()
            setTimeout(function () {
                translator.open()
                setTimeout(function () {
					process.exit(0);
                }, 2000);
			}, 2000);
		}, 2000);
	}, 2000);
}, 3000);


