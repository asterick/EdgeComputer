var fs = require("fs"),
		promise = require("../util/promise.js"),
		file = require("../util/file.js"),
		struct = require("../util/struct.js"),
		layout = struct.parse(fs.readFileSync("./microcode/layout.txt", "utf-8"));

// We are going to flatten this to plain objects, for speed
var proto = Object.getPrototypeOf(new layout),
		keys = Object.getOwnPropertyNames(proto).filter(function (k) {
			return k[0] !== '_'; 
		});

function imm(code) {
}

var mc = promise(function (pass, fail) {
	file.read("microcode.bin").then(function (data) {
		var states = [],
				len = (new layout())._data.byteLength,
				g = 0;
		
		for (var i = 0; i < data.byteLength; i += len) {
			var l = new layout(data, i);

			var o = keys.reduce(function (o, key) {
				o[key] = l[key];
				return o;
			}, {});	

			// Precalculate immediate value
			var c = (1 << o.imm_bit) - (o.imm_offset ? 0 : 1);
			o._immediate = o.imm_invert ? (c ^ 0xFFFF) : c;

			states[g++] = o;
		}

		pass(states);
	}, function(code) {
		fail(code);
	})
});

mc.fields = keys;

module.exports = mc;
