var fs = require("fs"),
		promise = require("../util/promise.js"),
		file = require("../util/file.js"),
		struct = require("../util/struct.js"),
		layout = struct.parse(fs.readFileSync("./microcode/layout.txt", "utf-8"));



module.exports = promise(function (pass, fail) {
	file.read("microcode.bin").then(function (data) {
		var states = [],
				len = (new layout())._data.byteLength,
				g = 0;
		
		for (var i = 0; i < data.byteLength; i += len) {
			states[g++] = new layout(data, i);
		}

		pass(states);
	}, function(code) {
		fail(code);
	})
});
