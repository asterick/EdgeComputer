var fs = require("fs"),
		promise = require("../util/promise.js"),
		file = require("../util/file.js"),
		struct = require("../util/struct.js"),
		layout = struct.parse(fs.readFileSync("./microcode/layout.txt", "utf-8"));

// We are going to flatten this to plain objects, for speed
var keys = Object.getOwnPropertyNames(Object.getPrototypeOf(new layout));

var mc = promise(function (pass, fail) {
	file.read("microcode.bin").then(function (data) {
		var states = [],
				len = (new layout())._data.byteLength,
				g = 0;
		
		for (var i = 0; i < data.byteLength; i += len) {
			var l = new layout(data, i);

			states[g++] = keys.reduce(function (o, key) {
				o[key] = l[key];
				return o;
			}, {});	
		}

		pass(states);
	}, function(code) {
		fail(code);
	})
});

mc.fields = keys;

module.exports = mc;