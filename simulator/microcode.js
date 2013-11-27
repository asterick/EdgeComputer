var fs = require("fs"),
		struct = require("./util/struct.js"),
		promise = require("./util/promise.js"),
		layout = struct.parse(fs.readFileSync("./microcode/layout.txt", "utf-8"));

module.exports = promise(function (pass, fail) {
	var xhr = new XMLHttpRequest();

	xhr.responseType = "arraybuffer";
	xhr.open("GET", "microcode.bin", true);
	xhr.send();

	xhr.onreadystatechange = function () {
		if (xhr.readyState !== 4) {
			return ;
		} else if (xhr.status !== 200) {
			fail(xhr.status);
		}

		var states = [],
				len = (new layout())._data.byteLength,
				g = 0;
		
		for (var i = 0; i < xhr.response.byteLength; i += len) {
			states[g++] = new layout(xhr.response, i);
		}

		pass(states);
	};
});
